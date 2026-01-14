/**
 * AnalysisService.js
 * 
 * Orchestrates the complete analysis pipeline:
 * 1) Triggers Stockfish analysis via HTTP REST API
 * 2) Formats OpenAI prompts
 * 3) Calls OpenAI API
 * 4) Caches results
 * 5) Returns results via REST API
 * 
 * Supports two modes:
 * - Move analysis (with chat history) - used by AI Tutor
 * - Question answering - used by AI Tutor
 */

// ============================================================================
// IMPORTS & CONFIGURATION
// ============================================================================

const cache = require("../utils/cache");
const openai = require("../config/openai");
const mockTutor = require("../utils/mockTutor");
const crypto = require("crypto");

const STOCKFISH_URL = process.env.STOCKFISH_SERVER_URL || "http://localhost:4002";

if (typeof fetch !== "function") {
  throw new Error("Global fetch not found. Use Node 18+ or install node-fetch.");
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Logs a metric as structured JSON
 * @param {string} metric - Metric name (e.g., "stockfish_latency", "openai_latency", "cache_hit")
 * @param {number} duration_ms - Duration in milliseconds (optional)
 * @param {boolean} success - Whether the operation was successful
 * @param {Object} metadata - Additional metadata to log
 */
function logMetric(metric, duration_ms = null, success = true, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    metric,
    ...metadata,
  };

  if (duration_ms !== null) {
    logEntry.duration_ms = duration_ms;
  }

  logEntry.success = success;

  // Only log if metrics are enabled (default: true)
  if (process.env.METRICS_LOG_ENABLED !== "false") {
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Computes UCI move notation from chess.js move result
 * @param {Object} moveResult - chess.js move object
 * @returns {string} UCI notation (e.g., "e7e8q" for promotion)
 */
function computeMoveUci(moveResult) {
  return moveResult.from + moveResult.to + (moveResult.promotion || "");
}

/**
 * Parses OpenAI JSON response, handling markdown code fences
 * @param {string} rawText - Raw text from OpenAI response
 * @returns {Object|null} Parsed JSON object, or null if parsing fails
 */
function parseOpenAIJson(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return null;
  }

  try {
    // Remove markdown code fences (```json and ```)
    let cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Try to parse as JSON
    return JSON.parse(cleaned);
  } catch (err) {
    return null;
  }
}

/**
 * Validates that an object matches the expected tutor response shape
 * @param {Object} obj - Object to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateTutorResponse(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  // Required fields: moveIndicator and Analysis (both strings)
  if (typeof obj.moveIndicator !== "string" || !obj.moveIndicator.trim()) {
    return false;
  }

  if (typeof obj.Analysis !== "string" || !obj.Analysis.trim()) {
    return false;
  }

  // nextStepHint is optional but if present should be a string
  if (obj.nextStepHint !== undefined && typeof obj.nextStepHint !== "string") {
    return false;
  }

  return true;
}

/**
 * Generates a fallback tutor response when OpenAI fails but Stockfish succeeded
 * @param {Object} stockfishFacts - Stockfish analysis results
 * @returns {Object} Fallback response matching expected format
 */
function generateFallbackResponse(stockfishFacts) {
  const moveIndicator = stockfishFacts?.classify || "Good";
  
  const analysis = `I'm having trouble providing a detailed analysis right now, but based on the engine evaluation, this appears to be a ${moveIndicator.toLowerCase()} move. Consider the position carefully and look for tactical opportunities.`;
  
  const nextStepHint = "Continue developing your pieces and controlling key squares.";

  return {
    moveIndicator,
    Analysis: analysis,
    nextStepHint,
  };
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



async function fetchWithTimeout(url, options = {}, ms = 8000, label = "fetch") {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);

  // If caller provided a signal, abort this fetch too.
  if (options.signal) {
    options.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(`${label} timed out after ${ms}ms`);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
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
    console.error("[AnalysisService] OpenAI client not available. This should not happen - check openai.js configuration.");
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

  // Check rate limiter before making API call
  const rateLimitResult = openai.rateLimiter.acquire();
  if (!rateLimitResult.allowed) {
    logMetric("openai_rate_limit", null, false, { retryAfter: rateLimitResult.retryAfter });
    const error = new Error("OPENAI_RATE_LIMIT");
    error.retryAfter = rateLimitResult.retryAfter;
    throw error;
  }

  const startTime = Date.now();
  let success = true;
  let error = null;

  try {
    const resp = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: "Follow the user instructions exactly." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const responseContent = resp.choices?.[0]?.message?.content ?? "";
    const duration_ms = Date.now() - startTime;
    
    // Log timing metric
    logMetric("openai_latency", duration_ms, true);

    // Log response if in mock mode
    if (openai.isMockMode && openai.isMockMode()) {
      console.log("[AnalysisService] Sample response (mock mode):", responseContent);
    }

    // Parse and validate the response
    const parsed = parseOpenAIJson(responseContent);
    if (!parsed) {
      throw new Error("OPENAI_INVALID_RESPONSE");
    }

    if (!validateTutorResponse(parsed)) {
      throw new Error("OPENAI_INVALID_RESPONSE");
    }

    // Return normalized response (nextStepHint is optional but we prefer it to be a string)
    return {
      moveIndicator: parsed.moveIndicator,
      Analysis: parsed.Analysis,
      nextStepHint: parsed.nextStepHint || "",
    };
  } catch (err) {
    success = false;
    error = err.message;
    const duration_ms = Date.now() - startTime;
    logMetric("openai_latency", duration_ms, false, { error: err.message });
    throw err;
  }

  // Parse and validate the response
  const parsed = parseOpenAIJson(responseContent);
  if (!parsed) {
    throw new Error("OPENAI_INVALID_RESPONSE");
  }

  if (!validateTutorResponse(parsed)) {
    throw new Error("OPENAI_INVALID_RESPONSE");
  }

  // Return normalized response (nextStepHint is optional but we prefer it to be a string)
  return {
    moveIndicator: parsed.moveIndicator,
    Analysis: parsed.Analysis,
    nextStepHint: parsed.nextStepHint || "",
  };
}

/**
 * Calls OpenAI API with chat history support
 * @param {Object} stockfishFacts - Stockfish analysis results
 * @param {Object} context - Move or question context (includes chatHistory)
 * @param {string} mode - "move" or "question"
 * @returns {Promise<string>} LLM response
 */
async function callOpenAIWithHistory(stockfishFacts, context, mode) {
  // Check if mock mode and move mode - use MockTutor directly
  if (openai.isMockMode && openai.isMockMode() && mode === "move") {
    const mockResponse = mockTutor.buildMockMoveTutorResponse(stockfishFacts, context);
    console.log(`[AnalysisService] Mock tutor response (move mode):`, mockResponse);
    
    // Return normalized response (same format as OpenAI response)
    return {
      moveIndicator: mockResponse.moveIndicator,
      Analysis: mockResponse.Analysis,
      nextStepHint: mockResponse.nextStepHint || "",
    };
  }

  // Continue with OpenAI (or mock client for question mode)
  const client = openai.getClient ? openai.getClient() : openai;
  
  if (!client) {
    console.error("[AnalysisService] OpenAI client not available. This should not happen - check openai.js configuration.");
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

  const responseContent = resp.choices?.[0]?.message?.content ?? "";
  
  // Log response if in mock mode
  if (openai.isMockMode && openai.isMockMode()) {
    console.log(`[AnalysisService] Sample response (mock mode, ${mode}):`, responseContent);
  }

  // For move mode, parse and validate as tutor response
  if (mode === "move") {
    const parsed = parseOpenAIJson(responseContent);
    if (!parsed) {
      throw new Error("OPENAI_INVALID_RESPONSE");
    }

    if (!validateTutorResponse(parsed)) {
      throw new Error("OPENAI_INVALID_RESPONSE");
    }

    // Return normalized response
    return {
      moveIndicator: parsed.moveIndicator,
      Analysis: parsed.Analysis,
      nextStepHint: parsed.nextStepHint || "",
    };
  }

  // For question mode, return raw content (string answer)
  return responseContent;
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

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
    // Log cache hit
    const stats = cache.getStats();
    logMetric("cache_hit", null, true, { key: cacheKey, stats });

    // Even on cache hit, we need bestMove for auto-play feature
    // Stockfish analysis is fast compared to LLM, so we fetch it anyway
    const startTime = Date.now();
    let success = true;
    let error = null;

    try {
      const stockFishResponse = await fetchWithTimeout(
        `${STOCKFISH_URL}/analysis`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fen: fen_before,
            moves: move,
            depth,
            multipv,
          }),
        },
        6000,
        "Stockfish /analysis"
      );
      
      if (!stockFishResponse.ok) {
        throw new Error(`Stockfish server error: ${stockFishResponse.status}`);
      }
      
      const stockfishFacts = await stockFishResponse.json();
      const duration_ms = Date.now() - startTime;
      logMetric("stockfish_latency", duration_ms, true);
      
      return {
        explanation: cache.get(cacheKey),
        cached: true,
        bestMove: stockfishFacts?.cpuMove || null,
      };
    } catch (err) {
      success = false;
      error = err.message;
      const duration_ms = Date.now() - startTime;
      logMetric("stockfish_latency", duration_ms, false, { error: err.message });
      throw err;
    }
  }

  // Log cache miss
  const stats = cache.getStats();
  logMetric("cache_miss", null, true, { key: cacheKey, stats });

  // 1) Get Stockfish analysis
  const startTime = Date.now();

  let stockFishfacts;
  try {
    const stockFishResponse = await fetchWithTimeout(
      `${STOCKFISH_URL}/analysis`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: fen_before,
          moves: move,
          depth,
          multipv,
        }),
      },
      6000, //timeout ms
      "Stockfish /analysis"  
    );

    if (!stockFishResponse.ok) {
      throw new Error(`Stockfish server error: ${stockFishResponse.status}`);
    }

    stockFishfacts = await stockFishResponse.json();
    const duration_ms = Date.now() - startTime;
    logMetric("stockfish_latency", duration_ms, true);
  } catch (err) {
    const duration_ms = Date.now() - startTime;
    logMetric("stockfish_latency", duration_ms, false, { error: err.message });
    throw err;
  }
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
    learnerColor: "w", // Default to white learner (can be extended to infer from request later)
  };

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/faac9266-bc5f-4ac8-89ce-7169defbdfc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AnalysisService.js:712',message:'before OpenAI call',data:{chatHistoryLength:chatHistory?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
  // #endregion

  // 4) Call OpenAI with chat history
  let explanation;
  try {
    const openaiResponse = await callOpenAIWithHistory(
      stockFishfacts,
      moveContext,
      "move"
    );

    // openaiResponse is now a normalized object for move mode
    explanation = JSON.stringify(openaiResponse);
  } catch (error) {
    // Log error metric if it's a rate limit
    if (error.message === "OPENAI_RATE_LIMIT") {
      logMetric("openai_rate_limit", null, false, { retryAfter: error.retryAfter });
    }
    
    // If OpenAI fails but Stockfish succeeded, use fallback
    // Stockfish succeeded if stockFishfacts exists and has required data
    if (stockFishfacts && stockFishfacts.classify) {
      const fallbackResponse = generateFallbackResponse(stockFishfacts);
      explanation = JSON.stringify(fallbackResponse);
      // Don't throw - return fallback as successful response
      // Cache the fallback response (shorter TTL could be used here, but keeping it consistent)
      cache.set(cacheKey, explanation, 60 * 60 * 24);
      return {
        explanation,
        cached: false,
        bestMove: stockFishfacts?.cpuMove || null,
      };
    }
    // If Stockfish also failed, re-throw the error
    throw error;
  }

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
    // Log cache hit
    const stats = cache.getStats();
    logMetric("cache_hit", null, true, { key: questionCacheKey, stats });
    
    return {
      answer: cache.get(questionCacheKey),
      cached: true,
    };
  }

  // Log cache miss
  const stats = cache.getStats();
  logMetric("cache_miss", null, true, { key: questionCacheKey, stats });

  // Optional: Get Stockfish analysis for current position (for context)
  let stockfishFacts = null;
  let stockfishStartTime = null;
  try {
    // stockfishFacts = await getStockfishAnalysis(fen, { depth: 10 });  
    stockfishStartTime = Date.now();
    const stockFishResponse = await fetchWithTimeout(
      `${STOCKFISH_URL}/analysis`, // use the same STOCKFISH_URL constant you already defined
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen,
          depth: 15,
          multipv: 15,
        }),
      },
      6000,
      "Stockfish /analysis"
    );

    if (!stockFishResponse.ok) {
      throw new Error(`Stockfish server error: ${stockFishResponse.status}`);
    }

    stockfishFacts = await stockFishResponse.json();
    const duration_ms = Date.now() - stockfishStartTime;
    logMetric("stockfish_latency", duration_ms, true);
    console.log(stockfishFacts)
  } catch (err) {
    if (stockfishStartTime) {
      const duration_ms = Date.now() - stockfishStartTime;
      logMetric("stockfish_latency", duration_ms, false, { error: err.message });
    }
    console.warn("[AnalysisService] Stockfish analysis failed for question, continuing without it:", err.message);
  }

  // Build context
  const questionContext = {
    fen,
    question,
    chatHistory,
    stockfish: stockfishFacts?.topBestMoves || [],
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
  analyzeMoveWithHistory,
  answerQuestion,
  
  // Internal functions (exposed for testing/debugging)
  callOpenAI,
  callOpenAIWithHistory,
  getCacheKey,
  computeMoveUci,
};
