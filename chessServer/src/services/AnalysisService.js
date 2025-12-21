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
  const client = openai.getClient ? openai.getClient() : openai;
  
  if (!client) {
    throw new Error("OpenAI client not configured. Set OPENAI_API_KEY or use LLM_MODE=mock");
  }

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

  const resp = await client.chat.completions.create({
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


/**
 * Analyze a move with chat history context
 * @param {Object} params - Move analysis parameters
 * @param {string} params.fen_before - FEN before move
 * @param {string} params.fen_after - FEN after move
 * @param {string} params.move - UCI move (e.g., "g1f3")
 * @param {string} params.uciHistory - Space-separated UCI moves
 * @param {number} params.depth - Stockfish depth
 * @param {Array} params.chatHistory - Previous chat messages
 * @returns {Promise<{explanation: string, cached: boolean}>}
 */
async function analyzeMoveWithHistory({
    fen_before,
    fen_after,
    move,
    uciHistory,
    depth = 12,
    chatHistory = [],
  }) {
    const analysisSettings = { depth, movetime: 2000, multipv: 1 };
    const cacheKey = getCacheKey(fen_after, move, analysisSettings);
  
    // Check cache
    if (cache.has(cacheKey)) {
      return {
        explanation: cache.get(cacheKey),
        cached: true,
      };
    }
  
    // 1) Stockfish analysis
    const stockfishFacts = await getStockfishAnalysis(fen_after, analysisSettings);
  
    // 2) Parse UCI history into move list
    const lastMoves = uciHistory ? uciHistory.trim().split(/\s+/) : [];
    
    // Extract move index from history length
    const moveIndex = lastMoves.length - 1;
  
    // 3) Build context with chat history
    const moveContext = {
      fenBefore: fen_before,
      fenAfter: fen_after,
      moveUci: move,
      moveIndex: moveIndex >= 0 ? moveIndex : 0,
      lastMoves: lastMoves,
      chatHistory: chatHistory,
    };
  
    // 4) Call OpenAI with chat history
    const explanation = await callOpenAIWithHistory(
      stockfishFacts,
      moveContext,
      "move"
    );
  
    // 5) Cache result
    cache.set(cacheKey, explanation, 60 * 60 * 24);
  
    return {
      explanation,
      cached: false,
    };
  }
  
  /**
   * Answer a chess-related question
   * @param {Object} params - Question parameters
   * @param {string} params.fen - Current FEN position
   * @param {string} params.question - User's question
   * @param {Array} params.chatHistory - Previous chat messages
   * @returns {Promise<{answer: string, cached: boolean}>}
   */
  async function answerQuestion({
    fen,
    question,
    chatHistory = [],
  }) {
    // Cache key for questions (different from move analysis)
    const questionCacheKey = `question:v1:${fen}:${question}`;
  
    // Check cache
    if (cache.has(questionCacheKey)) {
      return {
        answer: cache.get(questionCacheKey),
        cached: true,
      };
    }
  
    // Optional: Get Stockfish analysis for current position (for context)
    let stockfishFacts = null;
    try {
      stockfishFacts = await getStockfishAnalysis(fen, { depth: 10 });
    } catch (err) {
      console.warn("[AnalysisService] Stockfish analysis failed for question, continuing without it:", err.message);
    }
  
    // Build context
    const questionContext = {
      fen,
      question,
      chatHistory,
      stockfish: stockfishFacts,
    };
  
    // Call OpenAI
    const answer = await callOpenAIWithHistory(
      stockfishFacts,
      questionContext,
      "question"
    );
  
    // Cache result
    cache.set(questionCacheKey, answer, 60 * 60 * 24);
  
    return {
      answer,
      cached: false,
    };
  }
  
  /**
   * Call OpenAI with chat history support
   * @param {Object} stockfishFacts - Stockfish analysis results
   * @param {Object} context - Move or question context
   * @param {string} mode - "move" or "question"
   * @returns {Promise<string>}
   */
  async function callOpenAIWithHistory(stockfishFacts, context, mode) {
    const client = openai.getClient ? openai.getClient() : openai;
    
    if (!client) {
      throw new Error("OpenAI client not configured. Set OPENAI_API_KEY or use LLM_MODE=mock");
    }
  
    // Build messages array with chat history
    const messages = [
      {
        role: "system",
        content: mode === "move"
          ? "You are a chess coach. Explain moves clearly and conversationally. Use chat history for context."
          : "You are a chess coach. Answer questions about chess rules, strategy, and the current position. Be clear and educational.",
      },
    ];
  
    // Add chat history (convert to OpenAI message format)
    if (Array.isArray(context.chatHistory) && context.chatHistory.length > 0) {
      for (const msg of context.chatHistory) {
        // Map roles: 'move' -> 'user', 'assistant' -> 'assistant', 'user' -> 'user'
        let role = msg.role;
        if (msg.role === "move") {
          role = "user";
        }
  
        if (role === "user" || role === "assistant") {
          messages.push({
            role: role,
            content: msg.content,
          });
        }
      }
    }
  
    // Build the current prompt
    let userPrompt;
    if (mode === "move") {
      userPrompt = buildPromptFromDoc({
        fenBefore: context.fenBefore,
        fenAfter: context.fenAfter,
        moveUci: context.moveUci,
        moveIndex: context.moveIndex,
        san: null,
        turn: null,
        lastMoves: context.lastMoves || [],
        legalMoves: [],
        stockfish: stockfishFacts,
      });
    } else {
      // Question mode
      userPrompt = buildQuestionPrompt({
        fen: context.fen,
        question: context.question,
        stockfish: stockfishFacts,
      });
    }
  
    // Add current user message
    messages.push({
      role: "user",
      content: userPrompt,
    });
  
    const resp = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: messages,
      temperature: 0.2,
    });
  
    return resp.choices?.[0]?.message?.content ?? "";
  }
  
  /**
   * Build prompt for question answering
   * @param {Object} params
   * @returns {string}
   */
  function buildQuestionPrompt({ fen, question, stockfish }) {
    return [
      "You are a chess coach answering a student's question.",
      "",
      "CURRENT POSITION",
      `- FEN: ${fen}`,
      "",
      stockfish?.bestMove ? `- Best move: ${stockfish.bestMove}` : "",
      stockfish?.evalCp != null ? `- Evaluation: ${stockfish.evalCp} centipawns` : "",
      stockfish?.mateIn != null ? `- Mate in: ${stockfish.mateIn} moves` : "",
      "",
      "STUDENT'S QUESTION",
      question,
      "",
      "INSTRUCTIONS",
      "- Answer the question clearly and helpfully.",
      "- Reference the current position if relevant.",
      "- If the question is about rules, explain the rule clearly.",
      "- If the question is about strategy, provide strategic insights.",
      "- Keep your answer concise (2-4 sentences unless more detail is needed).",
    ].filter(line => line !== "").join("\n");
  }
  
  module.exports = {
    analyzeMove,
    analyzeMoveWithHistory,
    answerQuestion,
    getStockfishAnalysis,
    callOpenAI,
    callOpenAIWithHistory,
    getCacheKey,
    computeMoveUci,
  };