/**
 * AnalysisService.js
 * 
 * Orchestrates the complete analysis pipeline:
 * 1) Triggers Stockfish analysis
 * 2) Formats OpenAI prompts
 * 3) Calls OpenAI API
 * 4) Caches results
 * 5) Emits socket events back to players
 * 
 * Supports two modes:
 * - Move analysis (with/without chat history)
 * - Question answering
 */

// ============================================================================
// IMPORTS & CONFIGURATION
// ============================================================================

const { io: ioClient } = require("socket.io-client");
const cache = require("../utils/cache");
const openai = require("../config/openai");
const crypto = require("crypto");

const STOCKFISH_URL = process.env.STOCKFISH_SERVER_URL || "http://localhost:4002";

// ============================================================================
// STOCKFISH SESSION MANAGEMENT
// ============================================================================

// Connect to stockfishServer
const stockfishSocket = ioClient(STOCKFISH_URL, {
  transports: ["websocket"],
  reconnection: true,
});

// Session state management
let stockfishSessionReady = false;
let resolveReady = null;
let stockfishQueue = Promise.resolve(); // Queue to prevent overlapping evaluations

/**
 * Creates a promise that resolves when Stockfish session is ready
 */
function makeReadyPromise() {
  return new Promise((resolve) => {
    resolveReady = resolve;
  });
}

let readyPromise = makeReadyPromise();

/**
 * Ensures Stockfish session is ready before proceeding
 * @returns {Promise<void>}
 */
function ensureStockfishSession() {
  if (stockfishSessionReady) {
    return Promise.resolve();
  }
  return readyPromise;
}

// Socket event handlers
stockfishSocket.on("connect", () => {
  console.log("[AnalysisService] Connected to stockfishServer:", STOCKFISH_URL);
  
  stockfishSocket.emit("start-session", {
    sessionType: "analysis",
    fen: null,
    infoMode: true,
  });
});

stockfishSocket.on("session-started", (data) => {
  stockfishSessionReady = true;
  console.log("[AnalysisService] Stockfish session started:", data?.id);
  
  if (resolveReady) {
    resolveReady();
  }
});

stockfishSocket.on("disconnect", () => {
  console.log("[AnalysisService] Disconnected from stockfishServer");
  stockfishSessionReady = false;
  readyPromise = makeReadyPromise();
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Computes UCI move notation from chess.js move result
 * @param {Object} moveResult - chess.js move object
 * @returns {string} UCI notation (e.g., "e7e8q" for promotion)
 */
function computeMoveUci(moveResult) {
  return moveResult.from + moveResult.to + (moveResult.promotion || "");
}

/**
 * Generates cache key for move analysis
 * @param {string} fenAfter - FEN after move
 * @param {string} moveUci - UCI move notation
 * @param {Object} analysisSettings - Analysis parameters
 * @returns {string} Cache key
 */
function getCacheKey(fenAfter, moveUci, analysisSettings) {
  const depth = analysisSettings?.depth ?? 15;
  const movetime = analysisSettings?.movetime ?? 2000;
  const multipv = analysisSettings?.multipv ?? 1;
  
  return `analysis:v1:${fenAfter}:${moveUci}:depth${depth}:movetime${movetime}:multipv${multipv}`;
}

/**
 * Emits socket event to both student and mentor
 * @param {Object} io - Socket.IO server instance
 * @param {string} studentSocketId - Student socket ID
 * @param {string} mentorSocketId - Mentor socket ID
 * @param {string} eventName - Event name
 * @param {Object} payload - Event payload
 */
function emitToBoth(io, studentSocketId, mentorSocketId, eventName, payload) {
  io.to(studentSocketId).to(mentorSocketId).emit(eventName, payload);
}

/**
 * Parses Stockfish info output into structured data
 * @param {Array<string>} outputLines - Raw Stockfish output lines
 * @returns {Object} Parsed Stockfish facts
 */
function parseInfoOutput(outputLines) {
  let bestMove = null;
  let lastScoreCp = null;
  let lastMate = null;
  let lastPv = null;

  for (const line of outputLines) {
    if (typeof line !== "string") continue;

    // Extract best move
    if (line.startsWith("bestmove")) {
      bestMove = line.split(/\s+/)[1] || null;
      continue;
    }

    if (!line.startsWith("info ")) continue;

    // Extract score (cp or mate)
    const scoreIdx = line.indexOf(" score ");
    if (scoreIdx !== -1) {
      const tokens = line.slice(scoreIdx).trim().split(/\s+/);
      const scoreType = tokens[1];
      const scoreVal = tokens[2];

      if (scoreType === "cp") {
        const n = Number(scoreVal);
        if (!Number.isNaN(n)) {
          lastScoreCp = n;
          lastMate = null;
        }
      } else if (scoreType === "mate") {
        const n = Number(scoreVal);
        if (!Number.isNaN(n)) {
          lastMate = n;
          lastScoreCp = null;
        }
      }
    }

    // Extract principal variation (PV)
    const pvIdx = line.indexOf(" pv ");
    if (pvIdx !== -1) {
      lastPv = line.slice(pvIdx + 4).trim();
    }
  }

  return {
    bestMove,
    evalCp: lastScoreCp,
    mateIn: lastMate,
    pv: lastPv,
    raw: outputLines,
  };
}

// ============================================================================
// PROMPT BUILDING FUNCTIONS
// ============================================================================

/**
 * Builds prompt for move analysis (per Google Doc contract)
 * @param {Object} params - Move context parameters
 * @returns {string} Formatted prompt
 */
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
}) {
  return [
    "You are a chess ctutor. Explain the move in a clear, conversational, BIG-PICTURE way.",
    "Base your assessment of the player's move primarily on the ENGINE CONTEXT provided.",
    "Use the engine lines to understand which ideas were stronger or weaker.",
    "Do NOT quote, paraphrase, or mention engine evaluations, scores, or rankings.",
    "Translate engine insights into human, strategic reasoning only.",
    "",
    "BOARD STATE",
    `- FEN before: ${fenBefore}`,
    `Player Move : ${moveUci}`,
    `CPU Move : ${stockfish.cpuMove}`,
    "",
    "ENGINE SUMMARY (PRE-INTERPRETED — TRUST THIS)",
    `- Move quality label: ${stockfish.classify}`,
    "",
     "BEST MOVE CONTEXT (BEFORE PLAYER MOVE)",
    "- The following moves represented stronger or weaker strategic ideas:",
    ...stockfish.topBestMoves.map(
      m => `- ${m.move} → represents a ${m.rank <= 3 ? "strong" : m.rank <= 7 ? "playable" : "inferior"} idea`
    ),
    "",
    "POSITION AFTER PLAYER MOVE",
    "- Opponent immediately responded with a principled reply.",
    "- The opponent's reply follows this idea:",
    `  ${stockfish.cpuPV.split(" ").slice(0, 4).join(" ")} (conceptual reference only)`,
    "",
    "YOUR TASK",
    "Return a JSON object with EXACTLY these three fields:",
    "",
    "{",
    "  moveIndicator: string,",
    "  Analysis: string,",
    "  nextStepHint: string",
    "}",
    "",
    "FIELD RULES",
    "",
    "moveIndicator",
    `send the '${stockfish.classify}' as it is as string for moveIndicator`,
    "",
    "Analysis:",
    "- 3–5 sentences.",
    "- Start by clearly stating the move quality using this label:",
    `  '${stockfish.classify}'.`,
    "- Explain WHY the move was good / neutral / bad using:",
    "  • comparison to better ideas from topBestMoves",
    "  • what strategic goal was missed or achieved",
    "  • why the opponent's reply made sense",
    "  • what the opponent is now aiming to do next",
    "- If the move was not optimal:",
    "  • describe the TYPE of better plan that existed (never name a specific move)",
    "",
    "nextStepHint:",
    "- EXACTLY one sentence.",
    "- Based ONLY on the position after the CPU move.",
    "- Use nextBestMoves to infer the idea.",
    "- Do NOT name any move.",
    "- Give a conceptual hint like:",
    "  • developing a piece",
    "  • increasing central control",
    "  • preparing a recapture",
    "  • improving king safety",
    "",
    "OUTPUT RULES",
    "- Output ONLY valid JSON.",
    "- No markdown.",
    "- No extra keys.",
    "- No commentary outside JSON.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Builds prompt for question answering
 * @param {Object} params - Question context
 * @param {string} params.fen - Current FEN position
 * @param {string} params.question - User's question
 * @param {Object} params.stockfish - Stockfish analysis (optional)
 * @returns {string} Formatted prompt
 */
function buildQuestionPrompt({ fen, question, stockfish }) {
  return [
    "You are a chess coach answering a student's question.",
    "",
    "CURRENT POSITION",
    `- FEN: ${fen}`,
    "",
    // stockfish?.bestMove ? `- Best move: ${stockfish.bestMove}` : "",
    // stockfish?.evalCp != null ? `- Evaluation: ${stockfish.evalCp} centipawns` : "",
    // stockfish?.mateIn != null ? `- Mate in: ${stockfish.mateIn} moves` : "",
    "Use these Stock Fish Calculations If needed",
    `${stockfish}`,
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

// ============================================================================
// STOCKFISH ANALYSIS
// ============================================================================

/**
 * Gets Stockfish analysis for a position
 * @param {string} fenAfter - FEN position to analyze
 * @param {Object} analysisSettings - Analysis parameters (depth, movetime, multipv)
 * @returns {Promise<Object>} Stockfish facts object
 */
async function getStockfishAnalysis(fenAfter, analysisSettings) {
  await ensureStockfishSession();

  // Serialize evaluations through queue to prevent conflicts
  stockfishQueue = stockfishQueue.then(() => {
    return new Promise((resolve, reject) => {
      const depth = analysisSettings?.depth ?? 15;
      const timeoutMs = 8000;
      
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Stockfish analysis timed out"));
      }, timeoutMs);

      function cleanup() {
        clearTimeout(timeout);
        stockfishSocket.off("evaluation-complete", onComplete);
        stockfishSocket.off("evaluation-error", onError);
      }

      function onError(err) {
        cleanup();
        reject(new Error(err?.error || "Stockfish evaluation error"));
      }

      function onComplete(data) {
        cleanup();

        if (!data) {
          return reject(new Error("Stockfish returned empty response"));
        }

        // Handle info mode response
        if (data.mode === "info" && Array.isArray(data.output)) {
          return resolve(parseInfoOutput(data.output));
        }

        // Handle move mode response (fallback)
        if (data.mode === "move") {
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

      // Request analysis from Stockfish server
      stockfishSocket.emit("evaluate-fen", {
        fen: fenAfter,
        move: "",
        level: depth,
      });
    });
  });

  return stockfishQueue;
}

// ============================================================================
// OPENAI INTEGRATION
// ============================================================================

/**
 * Calls OpenAI API for move analysis (without chat history)
 * @param {Object} stockfishFacts - Stockfish analysis results
 * @param {Object} moveContext - Move context parameters
 * @returns {Promise<string>} LLM explanation
 */
async function callOpenAI(stockfishFacts, moveContext) {
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

/**
 * Calls OpenAI API with chat history support
 * @param {Object} stockfishFacts - Stockfish analysis results
 * @param {Object} context - Move or question context (includes chatHistory)
 * @param {string} mode - "move" or "question"
 * @returns {Promise<string>} LLM response
 */
async function callOpenAIWithHistory(stockfishFacts, context, mode) {
  const client = openai.getClient ? openai.getClient() : openai;
  
  if (!client) {
    throw new Error("OpenAI client not configured. Set OPENAI_API_KEY or use LLM_MODE=mock");
  }

  // Build messages array with system prompt
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

  // Build the current prompt based on mode
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

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Analyzes a move and emits explanation via socket (for socket-based games)
 * @param {string} gameId - Game identifier
 * @param {string} fenBefore - FEN before move
 * @param {string} fenAfter - FEN after move
 * @param {string} moveUci - UCI move notation
 * @param {number} moveIndex - Move index in game
 * @param {Object} analysisSettings - Analysis parameters
 * @param {Object} io - Socket.IO server instance
 * @param {string} studentSocketId - Student socket ID
 * @param {string} mentorSocketId - Mentor socket ID
 * @returns {Promise<void>}
 */
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
) {
  const cacheKey = getCacheKey(fenAfter, moveUci, analysisSettings);

  // Cache hit: return immediately
  if (cache.has(cacheKey)) {
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

  // 1) Get Stockfish analysis
  const stockfishFacts = await getStockfishAnalysis(fenAfter, analysisSettings);

  // 2) Build move context
  const moveContext = {
    gameId,
    moveIndex,
    fenBefore,
    fenAfter,
    moveUci,
    san: null,
    turn: null,
    lastMoves: [],
    legalMoves: [],
  };

  // 3) Call OpenAI
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
 * Analyzes a move with chat history context (for REST API)
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
  depth = 15,
  chatHistory = [],
  multipv = 15
}) {
  const analysisSettings = { depth, movetime: 2000, multipv: 1 };
  const cacheKey = getCacheKey(fen_after, move, analysisSettings);

  // Check cache
  if (cache.has(cacheKey)) {
    // Even on cache hit, we need bestMove for auto-play feature
    // Stockfish analysis is fast compared to LLM, so we fetch it anyway
    const stockfishFacts = await getStockfishAnalysis(fen_after, analysisSettings);

    return {
      explanation: cache.get(cacheKey),
      cached: true,
      bestMove: stockfishFacts?.bestMove || null,
    };
  }

  // 1) Get Stockfish analysis
  const stockFishResponse = await fetch(`${process.env.STOCKFISH_SERVER_URL}/analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fen : fen_before,
      moves: move,
      depth : depth,
      multipv : multipv
    })
  })

  if (!stockFishResponse.ok) {
    throw new Error(`Stockfish server error: ${respostockFishResponse.status}`);
  }

  const stockFishfacts = await stockFishResponse.json();
  // const stockfishFacts = await getStockfishAnalysis(fen_after, analysisSettings);

  // 2) Parse UCI history into move list
  const lastMoves = uciHistory ? uciHistory.trim().split(/\s+/) : [];
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
    stockFishfacts,
    moveContext,
    "move"
  );

  // 5) Cache result
  cache.set(cacheKey, explanation, 60 * 60 * 24);

  return {
    explanation,
    cached: false,
    bestMove: stockFishfacts?.cpuMove || null,
  };
}

/**
 * Answers a chess-related question
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
    // stockfishFacts = await getStockfishAnalysis(fen, { depth: 10 });  
    const stockFishResponse = await fetch(`${process.env.STOCKFISH_SERVER_URL}/analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        fen : fen,
        depth : 15,
        multipv : 15
      })
    })

    if (!stockFishResponse.ok) {
      throw new Error(`Stockfish server error: ${respostockFishResponse.status}`);
    }

    stockfishFacts = await stockFishResponse.json();
    console.log(stockfishFacts)
  } catch (err) {
    console.warn("[AnalysisService] Stockfish analysis failed for question, continuing without it:", err.message);
  }

  // Build context
  const questionContext = {
    fen,
    question,
    chatHistory,
    stockfish: stockfishFacts.topBestMoves,
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

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  // Public API
  analyzeMove,
  analyzeMoveWithHistory,
  answerQuestion,
  
  // Internal functions (exposed for testing/debugging)
  getStockfishAnalysis,
  callOpenAI,
  callOpenAIWithHistory,
  getCacheKey,
  computeMoveUci,
};
