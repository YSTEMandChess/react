/**
 * mockTutor.js
 * 
 * Generates position-specific mock tutor responses for move analysis
 * based on Stockfish analysis data. Used in mock mode when OpenAI is not available.
 * 
 * All responses are deterministic (same inputs → same outputs) for stable testing.
 */

const { Chess } = require("chess.js");

/**
 * Converts UCI move notation to SAN (Standard Algebraic Notation) using chess.js
 * Falls back to "from to" format if conversion fails
 * @param {string} uciMove - UCI move (e.g., "e2e4", "e7e8q")
 * @param {string} fen - FEN position before the move
 * @returns {string} SAN notation (e.g., "e4", "e8=Q") or fallback format
 */
function formatMoveUciToSan(uciMove, fen) {
  if (!uciMove || typeof uciMove !== "string" || uciMove.length < 4) {
    return uciMove || "unknown move";
  }

  // Try to convert to SAN using chess.js
  if (fen) {
    try {
      const chess = new Chess(fen);
      const from = uciMove.substring(0, 2);
      const to = uciMove.substring(2, 4);
      const promotion = uciMove.length > 4 ? uciMove[4] : null;
      
      const move = chess.move({
        from: from,
        to: to,
        promotion: promotion || undefined
      });
      
      if (move && move.san) {
        return move.san;
      }
    } catch (err) {
      // Fall through to fallback format
    }
  }

  // Fallback: use "from to" format
  const from = uciMove.substring(0, 2);
  const to = uciMove.substring(2, 4);
  
  if (uciMove.length > 4) {
    const promotion = uciMove[4];
    const promotionNames = {
      q: "queen",
      r: "rook",
      b: "bishop",
      n: "knight"
    };
    const promotionName = promotionNames[promotion] || promotion;
    return `${from} to ${to} promoting to ${promotionName}`;
  }
  
  return `${from} to ${to}`;
}

/**
 * Legacy function for backward compatibility (uses fallback format)
 * @param {string} uciMove - UCI move
 * @returns {string} Human-readable format
 */
function formatMoveUci(uciMove) {
  if (!uciMove || typeof uciMove !== "string" || uciMove.length < 4) {
    return uciMove || "unknown move";
  }
  
  const from = uciMove.substring(0, 2);
  const to = uciMove.substring(2, 4);
  
  // Handle promotion
  if (uciMove.length > 4) {
    const promotion = uciMove[4];
    const promotionNames = {
      q: "queen",
      r: "rook",
      b: "bishop",
      n: "knight"
    };
    const promotionName = promotionNames[promotion] || promotion;
    return `${from} to ${to} promoting to ${promotionName}`;
  }
  
  return `${from} to ${to}`;
}

/**
 * Gets the side to move from a FEN string
 * @param {string} fen - FEN position string
 * @returns {string|null} "w" for white, "b" for black, or null if invalid
 */
function getSideToMoveFromFen(fen) {
  if (!fen || typeof fen !== "string") {
    return null;
  }
  
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 2) {
    return null;
  }
  
  const sideToMove = parts[1].toLowerCase();
  if (sideToMove === "w" || sideToMove === "b") {
    return sideToMove;
  }
  
  return null;
}

/**
 * Converts an evaluation score to White's POV
 * @param {Object} evalObj - Evaluation object with {type: "cp"|"mate", value: number}
 * @param {string} fen - FEN position string
 * @returns {number|null} Score in White's POV, or null if invalid
 */
function toWhitePovScore(evalObj, fen) {
  if (!evalObj || typeof evalObj.value !== "number") {
    return null;
  }
  
  const sideToMove = getSideToMoveFromFen(fen);
  if (!sideToMove) {
    return null;
  }
  
  const value = evalObj.value;
  
  if (evalObj.type === "cp") {
    // Centipawn: positive = good for side to move
    // Convert to White POV: if Black to move, flip sign
    return sideToMove === "w" ? value : -value;
  } else if (evalObj.type === "mate") {
    // Mate: positive = mate in N for side to move
    // Convert to White POV: if Black to move, flip sign
    return sideToMove === "w" ? value : -value;
  }
  
  return null;
}

/**
 * Normalizes evaluation to player's POV (learner's perspective)
 * @param {Object} evaluation - Evaluation object with {before, after, delta}
 * @param {string} fenBefore - FEN before the move
 * @param {string} fenAfter - FEN after the move
 * @param {string} learnerColor - "w" for white learner, "b" for black learner
 * @returns {Object} Normalized evaluation {before, after, delta} in player POV, or fallback
 */
function normalizeEvaluationToPlayerPov(evaluation, fenBefore, fenAfter, learnerColor = "w") {
  if (!evaluation) {
    return { before: null, after: null, delta: 0 };
  }
  
  // Convert to White POV first
  const beforeWhite = toWhitePovScore(evaluation.before, fenBefore);
  const afterWhite = toWhitePovScore(evaluation.after, fenAfter);
  
  // If we couldn't normalize, fallback to original delta
  if (beforeWhite === null || afterWhite === null) {
    const fallbackDelta = typeof evaluation.delta === "number" ? evaluation.delta : 0;
    return {
      before: evaluation.before,
      after: evaluation.after,
      delta: fallbackDelta
    };
  }
  
  // Convert to player POV: if learner is Black, flip signs
  let beforePlayer = beforeWhite;
  let afterPlayer = afterWhite;
  
  if (learnerColor === "b") {
    beforePlayer = -beforeWhite;
    afterPlayer = -afterWhite;
  }
  
  // Calculate delta in player POV
  const delta = afterPlayer - beforePlayer;
  
  return {
    before: { type: evaluation.before?.type || "cp", value: beforePlayer },
    after: { type: evaluation.after?.type || "cp", value: afterPlayer },
    delta: delta
  };
}

/**
 * Maps evaluation delta to beginner-friendly buckets (no centipawn numbers)
 * @param {Object} evaluation - Evaluation object with delta, before, after (should be normalized)
 * @returns {string} Bucket description
 */
function getEvalBucket(evaluation) {
  if (!evaluation || typeof evaluation.delta !== "number") {
    return "about equal";
  }

  const delta = evaluation.delta;

  // Handle mate evaluations
  if (evaluation.after && evaluation.after.type === "mate") {
    if (delta > 0) {
      return "you now have a forced mate";
    } else if (delta < 0) {
      return "your opponent now has a forced mate";
    }
  }

  if (evaluation.before && evaluation.before.type === "mate") {
    if (delta > 0) {
      return "you improved from a losing position";
    } else {
      return "you worsened from a winning position";
    }
  }

  // Map to buckets (no centipawn numbers)
  if (delta > 50) {
    return "big improvement";
  } else if (delta > 20) {
    return "improvement";
  } else if (delta > 0) {
    return "slight improvement";
  } else if (delta === 0) {
    return "about equal";
  } else if (delta > -20) {
    return "slightly worse";
  } else if (delta > -50) {
    return "worse";
  } else {
    return "big mistake";
  }
}

/**
 * Legacy function for backward compatibility
 * @param {Object} evaluation - Evaluation object
 * @returns {string} Formatted evaluation text
 */
function formatEval(evaluation) {
  return getEvalBucket(evaluation);
}

/**
 * Selects top N candidate moves from nextBestMoves array
 * @param {Array} nextBestMoves - Array of move objects with {move, rank, score, ...}
 * @param {number} count - Number of moves to select (default: 2)
 * @returns {Array} Selected move objects
 */
function pickCandidateMoves(nextBestMoves, count = 2) {
  if (!Array.isArray(nextBestMoves) || nextBestMoves.length === 0) {
    return [];
  }

  // Sort by rank (if available) or take first N
  const sorted = [...nextBestMoves].sort((a, b) => {
    if (a.rank !== undefined && b.rank !== undefined) {
      return a.rank - b.rank;
    }
    return 0;
  });

  return sorted.slice(0, count);
}

/**
 * Gets a simple next step suggestion (one action)
 * @param {string} classify - Move classification
 * @param {Object} evaluation - Evaluation object
 * @returns {string} Simple action suggestion
 */
function getNextStepAction(classify, evaluation) {
  const delta = evaluation?.delta || 0;
  const isSignificantlyBad = delta < -50 || classify === "Blunder" || classify === "Mistake";

  if (isSignificantlyBad) {
    return "defend any hanging pieces";
  } else if (delta < -20 || classify === "Inaccuracy") {
    return "control the center";
  } else {
    return "develop a piece";
  }
}

/**
 * Checks for contradictions between classify and normalized delta, adjusts classify if needed
 * @param {string} classify - Original classification
 * @param {Object} normalizedEvaluation - Normalized evaluation object with delta in player POV
 * @returns {string} Adjusted classification
 */
function resolveContradictions(classify, normalizedEvaluation) {
  const delta = normalizedEvaluation?.delta || 0;
  
  // If classify is "Best" or "Good" but delta is significantly negative, soften
  // Changed threshold from < 0 to < -50 to prevent good opening moves from being downgraded
  if ((classify === "Best" || classify === "Good") && delta < -50) {
    return "Inaccuracy"; // Soften to inaccuracy only for significant negative deltas
  }
  
  // If classify is "Mistake" or "Blunder" but delta > -30, soften
  if ((classify === "Mistake" || classify === "Blunder") && delta > -30) {
    return "Inaccuracy"; // Soften to inaccuracy
  }
  
  return classify;
}

/**
 * Builds a mock move tutor response based on Stockfish analysis
 * Uses beginner-friendly 3-sentence template
 * @param {Object} stockfishFacts - Stockfish analysis results
 * @param {Object} moveContext - Move context (fenBefore, fenAfter, moveUci, etc.)
 * @returns {Object} Tutor response with {moveIndicator, Analysis, nextStepHint}
 */
function buildMockMoveTutorResponse(stockfishFacts, moveContext) {
  // Get move indicator (fallback to "Good" if not provided)
  let moveIndicator = stockfishFacts?.classify || "Good";
  
  // Get learner color (default to "w" for white)
  const learnerColor = moveContext?.learnerColor || "w";
  
  // Get evaluation info and normalize to player POV
  const rawEvaluation = stockfishFacts?.evaluation || {};
  const fenBefore = moveContext?.fenBefore;
  const fenAfter = moveContext?.fenAfter || moveContext?.fenBefore;
  
  // Normalize evaluation to player POV
  const normalizedEvaluation = normalizeEvaluationToPlayerPov(
    rawEvaluation,
    fenBefore,
    fenAfter,
    learnerColor
  );
  
  // Resolve contradictions between classify and normalized delta
  moveIndicator = resolveContradictions(moveIndicator, normalizedEvaluation);
  
  // Get eval bucket using normalized evaluation (no centipawn numbers)
  const evalBucket = getEvalBucket(normalizedEvaluation);
  
  // Get best move (CPU's response or top move)
  const bestMove = stockfishFacts?.cpuMove || 
                   (stockfishFacts?.topBestMoves && stockfishFacts.topBestMoves.length > 0 
                     ? stockfishFacts.topBestMoves[0].move 
                     : null);
  
  // Convert to SAN using fenAfter (position after player's move, where opponent responds)
  const bestMoveSan = bestMove ? formatMoveUciToSan(bestMove, fenAfter) : "a better move";
  
  // Build Sentence 1: Simple verdict (<= 12 words)
  let sentence1 = "";
  if (moveIndicator === "Best") {
    sentence1 = "Excellent move! This is the engine's top choice.";
  } else if (moveIndicator === "Good") {
    sentence1 = "Good move! This is a solid choice.";
  } else if (moveIndicator === "Inaccuracy") {
    // Check if we softened from Best/Good
    const originalClassify = stockfishFacts?.classify;
    if (originalClassify === "Best" || originalClassify === "Good") {
      sentence1 = "Playable, but not the engine's favorite.";
    } else {
      sentence1 = "This move is playable but not optimal.";
    }
  } else if (moveIndicator === "Mistake") {
    sentence1 = "This move is a mistake.";
  } else if (moveIndicator === "Blunder") {
    sentence1 = "This move is a blunder.";
  } else {
    sentence1 = "This move is playable.";
  }
  
  // Build Sentence 2: Simple best reply (no evaluation commentary)
  let sentence2 = "";
  if (bestMove && bestMoveSan !== "a better move") {
    sentence2 = `Your opponent's best reply is ${bestMoveSan}.`;
  } else {
    sentence2 = "The engine suggests continuing with solid moves.";
  }
  
  // Build Sentence 3: One next step suggestion
  const nextStepAction = getNextStepAction(moveIndicator, normalizedEvaluation);
  let sentence3 = "";
  if (moveIndicator === "Best" || moveIndicator === "Good") {
    sentence3 = `Next, focus on ${nextStepAction}.`;
  } else {
    sentence3 = `Next time, try to ${nextStepAction}.`;
  }
  
  // Combine into analysis (3 sentences)
  const analysis = `${sentence1} ${sentence2} ${sentence3}`;
  
  // Build next step hint using nextBestMoves with SAN
  let nextStepHint = "Continue developing your pieces and controlling key squares.";
  
  const nextBestMoves = stockfishFacts?.nextBestMoves;
  if (Array.isArray(nextBestMoves) && nextBestMoves.length > 0) {
    const candidateMoves = pickCandidateMoves(nextBestMoves, 2);
    if (candidateMoves.length > 0) {
      // Convert moves to SAN (using fenAfter - position after player's move)
      const moveSans = candidateMoves.map(m => {
        const san = formatMoveUciToSan(m.move, fenAfter);
        return san;
      }).filter(san => san && san !== "unknown move");
      
      if (moveSans.length > 0) {
        // Simple move recommendation (no reason phrases)
        if (moveSans.length === 1) {
          nextStepHint = `Engine recommends ${moveSans[0]}.`;
        } else {
          nextStepHint = `Engine recommends ${moveSans[0]} or ${moveSans[1]}.`;
        }
      }
    }
  }
  
  return {
    moveIndicator,
    Analysis: analysis.trim(),
    nextStepHint
  };
}

module.exports = {
  buildMockMoveTutorResponse,
  // Export helpers for testing
  formatEval,
  formatMoveUci,
  formatMoveUciToSan,
  getEvalBucket,
  pickCandidateMoves,
  getNextStepAction,
  resolveContradictions,
  // Export normalization helpers for testing
  getSideToMoveFromFen,
  toWhitePovScore,
  normalizeEvaluationToPlayerPov
};

