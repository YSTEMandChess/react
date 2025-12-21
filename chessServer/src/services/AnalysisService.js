//AnalysisService.js is the pipeline/orchestrator that runs everything needed to produce an explanation after a move:
// 1) triggers Stockfish analysis
// 2) formats the OpenAI prompt
// 3) calls OpenAI
// 4) caches the result
// 5) emits socket events back to both players

const { io: ioClient } = require("socket.io-client");
const cache = require("../utils/cache");
const openai = require("../config/openai"); // must export an OpenAI client instance
const crypto = require("crypto");

// Set this to your real stockfish server URL/port (example: http://localhost:4002)
const STOCKFISH_URL = process.env.STOCKFISH_SERVER_URL || "http://localhost:xxxx";

// Connect to stockfishServer
const stockfishSocket = ioClient(STOCKFISH_URL, {
  transports: ["websocket"],
  reconnection: true,
});

// ---------------------------
// Stockfish session management
// ---------------------------

// We need to know when the chessServer->stockfishServer session exists.
// We'll resolve a promise when we see "session-started".
let stockfishSessionReady = false;
let resolveReady = null;

function makeReadyPromise()
{
  return new Promise((resolve) =>
  {
    resolveReady = resolve;
  });
}

let readyPromise = makeReadyPromise();

// Simple queue so we don't overlap evaluations on a single stockfish session.
// (Your stockfishServer uses session.awaitingResponse, so overlapping requests will conflict.)
let stockfishQueue = Promise.resolve();

stockfishSocket.on("connect", () =>
{
  console.log("[AnalysisService] Connected to stockfishServer:", STOCKFISH_URL);

  // Start a dedicated analysis session for chessServer -> stockfishServer.
  // This REQUIRES your stockfishServer to accept infoMode in start-session and pass it through.
  // If you haven't made that change yet, it will still work, but you won't get info output.
  stockfishSocket.emit("start-session", {
    sessionType: "analysis",
    fen: null,
    infoMode: true,
  });
});

stockfishSocket.on("session-started", (data) =>
{
  stockfishSessionReady = true;
  console.log("[AnalysisService] Stockfish session started:", data?.id);

  if (resolveReady)
  {
    resolveReady();
  }
});

stockfishSocket.on("disconnect", () =>
{
  console.log("[AnalysisService] Disconnected from stockfishServer");
  stockfishSessionReady = false;

  // Recreate the promise so callers will wait again until next session-started.
  readyPromise = makeReadyPromise();
});

function ensureStockfishSession()
{
  if (stockfishSessionReady)
  {
    return Promise.resolve();
  }
  return readyPromise;
}

// ---------------------------
// Helpers
// ---------------------------

function computeMoveUci(moveResult)
{
  // moveResult comes from chess.js
  // Example: "e7e8q" for promotion
  return moveResult.from + moveResult.to + (moveResult.promotion || "");
}

function getCacheKey(fenAfter, moveUci, analysisSettings)
{
  // Note: your current stockfishServer only supports "depth" via "level".
  // We still include movetime/multipv in the cache key so future upgrades don't collide.
  const depth = analysisSettings?.depth ?? 15;
  const movetime = analysisSettings?.movetime ?? 2000;
  const multipv = analysisSettings?.multipv ?? 1;

  return `analysis:v1:${fenAfter}:${moveUci}:depth${depth}:movetime${movetime}:multipv${multipv}`;
}

function emitToBoth(io, studentSocketId, mentorSocketId, eventName, payload)
{
  io.to(studentSocketId).to(mentorSocketId).emit(eventName, payload);
}

function parseInfoOutput(outputLines)
{
  // Parses stockfish "info ..." lines and "bestmove ..." line.
  // Returns a compact object you can feed into your prompt.
  let bestMove = null;
  let lastScoreCp = null;
  let lastMate = null;
  let lastPv = null;

  for (const line of outputLines)
  {
    if (typeof line !== "string") continue;

    if (line.startsWith("bestmove"))
    {
      // "bestmove e2e4 ponder ..."
      bestMove = line.split(/\s+/)[1] || null;
      continue;
    }

    if (!line.startsWith("info ")) continue;

    // score cp/mate
    // examples: "info ... score cp 23 ..." or "info ... score mate 3 ..."
    const scoreIdx = line.indexOf(" score ");
    if (scoreIdx !== -1)
    {
      const tokens = line.slice(scoreIdx).trim().split(/\s+/); // ["score","cp","23",...]
      const scoreType = tokens[1];
      const scoreVal = tokens[2];

      if (scoreType === "cp")
      {
        const n = Number(scoreVal);
        if (!Number.isNaN(n))
        {
          lastScoreCp = n;
          lastMate = null;
        }
      }
      else if (scoreType === "mate")
      {
        const n = Number(scoreVal);
        if (!Number.isNaN(n))
        {
          lastMate = n;
          lastScoreCp = null;
        }
      }
    }

    // PV
    const pvIdx = line.indexOf(" pv ");
    if (pvIdx !== -1)
    {
      lastPv = line.slice(pvIdx + 4).trim(); // everything after " pv "
    }
  }

  return {
    bestMove,
    evalCp: lastScoreCp, // null if mate
    mateIn: lastMate,    // null if cp
    pv: lastPv,
    raw: outputLines,
  };
}

function buildPromptFromDoc({
  fenBefore,
  fenAfter,
  moveUci,
  moveIndex,
  san,
  turn,
  lastMoves,
  legalMoves,
  stockfish,
})
{
  // This mirrors your Google Doc structure.
  // It’s OK if some values are not provided yet—keep fields explicit to avoid hallucinations.

  return [
    "You are a chess coach. Explain the move in a clear, conversational, BIG-PICTURE way.",
    "Do NOT invent moves, evaluations, or tactics. If data is missing, say it's not provided.",
    "",
    "BOARD STATE",
    `- FEN before: ${fenBefore}`,
    `- FEN after:  ${fenAfter}`,
    "",
    "MOVE + CONTEXT",
    `- Move index: ${moveIndex}`,
    `- Played move (UCI): ${moveUci}`,
    san ? `- Played move (SAN): ${san}` : "- Played move (SAN): (not provided)",
    turn ? `- Side to move before: ${turn}` : "- Side to move before: (not provided)",
    Array.isArray(lastMoves) && lastMoves.length
      ? `- Last moves (context): ${lastMoves.join(" ")}`
      : "- Last moves (context): (not provided)",
    "",
    "LEGAL MOVES / CANDIDATES",
    Array.isArray(legalMoves) && legalMoves.length
      ? `- Legal moves (or candidates): ${legalMoves.join(", ")}`
      : "- Legal moves (or candidates): (not provided)",
    "",
    "STOCKFISH INFO",
    stockfish?.bestMove ? `- bestMove: ${stockfish.bestMove}` : "- bestMove: (not provided)",
    stockfish?.evalCp != null ? `- evalAfter (cp): ${stockfish.evalCp}` : "- evalAfter (cp): (not provided)",
    stockfish?.mateIn != null ? `- mateIn: ${stockfish.mateIn}` : "- mateIn: (not provided)",
    stockfish?.pv ? `- pvForBest: ${stockfish.pv}` : "- pvForBest: (not provided)",
    "",
    "INSTRUCTIONS TO EXPLAIN",
    "- Explain why this move is significant.",
    "- Identify if it’s a good move or a mistake, and why.",
    "- Mention what better moves/plans were available if applicable (use bestMove + PV if available).",
    "- Keep it high level (king safety, development, initiative, tactics themes) — do not list every piece.",
    "",
    "OUTPUT FORMAT",
    "- Return 2–5 sentences. Broad explanation, not a deep line-by-line calculation.",
  ].join("\n");
}

// ---------------------------
// Stockfish + OpenAI calls
// ---------------------------

async function getStockfishAnalysis(fenAfter, analysisSettings)
{
  await ensureStockfishSession();

  // Serialize evaluations through the queue
  stockfishQueue = stockfishQueue.then(() =>
  {
    return new Promise((resolve, reject) =>
    {
      const depth = analysisSettings?.depth ?? 15;

      const timeoutMs = 8000;
      const timeout = setTimeout(() =>
      {
        cleanup();
        reject(new Error("Stockfish analysis timed out"));
      }, timeoutMs);

      function cleanup()
      {
        clearTimeout(timeout);
        stockfishSocket.off("evaluation-complete", onComplete);
        stockfishSocket.off("evaluation-error", onError);
      }

      function onError(err)
      {
        cleanup();
        reject(new Error(err?.error || "Stockfish evaluation error"));
      }

      function onComplete(data)
      {
        cleanup();

        if (!data)
        {
          return reject(new Error("Stockfish returned empty response"));
        }

        // If infoMode works, you get: { mode:"info", output:[...] }
        if (data.mode === "info" && Array.isArray(data.output))
        {
          return resolve(parseInfoOutput(data.output));
        }

        // If infoMode is not enabled yet, you get: { mode:"move", move, newFEN, ... }
        if (data.mode === "move")
        {
          return resolve({
            bestMove: data.move || null,
            evalCp: null,
            mateIn: null,
            pv: null,
            raw: [JSON.stringify(data)],
          });
        }

        return reject(new Error(`Unexpected stockfish response mode: ${data.mode}`));
      }

      stockfishSocket.on("evaluation-complete", onComplete);
      stockfishSocket.on("evaluation-error", onError);

      // MUST match your stockfishServer API: { fen, move, level }
      stockfishSocket.emit("evaluate-fen", {
        fen: fenAfter,
        move: "",
        level: depth,
      });
    });
  });

  return stockfishQueue;
}

async function callOpenAI(stockfishFacts, moveContext)
{
  const prompt = buildPromptFromDoc({
    fenBefore: moveContext.fenBefore,
    fenAfter: moveContext.fenAfter,
    moveUci: moveContext.moveUci,
    moveIndex: moveContext.moveIndex,
    san: moveContext.san,
    turn: moveContext.turn,
    lastMoves: moveContext.lastMoves,
    legalMoves: moveContext.legalMoves,
    stockfish: stockfishFacts,
  });

  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: "Follow the user instructions exactly." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  return resp.choices?.[0]?.message?.content ?? "";
}

// ---------------------------
// Main entry point
// ---------------------------

async function analyzeMove(
  gameId,
  fenBefore,
  fenAfter,
  moveUci,
  moveIndex,
  analysisSettings,
  io,
  studentSocketId,
  mentorSocketId
)
{
  const cacheKey = getCacheKey(fenAfter, moveUci, analysisSettings);

  // Cache hit
  if (cache.has(cacheKey))
  {
    const cached = cache.get(cacheKey);
    emitToBoth(io, studentSocketId, mentorSocketId, "move-explanation", {
      gameId,
      moveIndex,
      moveUci,
      explanation: cached,
      cached: true,
    });
    return;
  }

  // Cache miss: notify UI immediately
  emitToBoth(io, studentSocketId, mentorSocketId, "analysis-started", {
    gameId,
    moveIndex,
    moveUci,
  });

  // 1) Stockfish analysis (currently based on fenAfter)
  const stockfishFacts = await getStockfishAnalysis(fenAfter, analysisSettings);

  // 2) Build context for LLM (fill in extras later when you wire them up)
  const moveContext = {
    gameId,
    moveIndex,
    fenBefore,
    fenAfter,
    moveUci,

    // OPTIONAL (wire these in later; leaving them null/empty prevents hallucination)
    san: null,
    turn: null,
    lastMoves: [],
    legalMoves: [],
  };

  // 3) OpenAI call
  const explanation = await callOpenAI(stockfishFacts, moveContext);

  // 4) Cache result (24h)
  cache.set(cacheKey, explanation, 60 * 60 * 24);

  // 5) Emit result to both clients
  emitToBoth(io, studentSocketId, mentorSocketId, "move-explanation", {
    gameId,
    moveIndex,
    moveUci,
    explanation,
    cached: false,
  });
}

module.exports = {
  analyzeMove,
  getStockfishAnalysis,
  callOpenAI,
  getCacheKey,
  computeMoveUci,
};
