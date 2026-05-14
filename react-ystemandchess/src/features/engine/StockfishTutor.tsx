import React, { useEffect, useState } from 'react';
import { environment } from '../../environments/environment';
import styles from './StockfishTutor.module.scss';
import { Chess as ChessClass } from 'chess.js';
const Chess: any = ChessClass;

type Props = {
  enabled: boolean;
  trigger: number; // increment to signal a new move to analyze
  fenBefore?: string;
  fenAfter?: string;
  moveUci?: string;
  uciHistory?: string;
};

type Analysis = {
  moveIndicator?: 'Best' | 'Good' | 'Neutral' | 'Book' | 'Inaccuracy' | 'Mistake' | 'Blunder';
  Analysis?: string;
  nextStepHint?: string;
  // new fields to answer user's requested appraisals
  botPreference?: 'More' | 'Less' | 'Equal' | 'Unknown';
  favorsCenter?: boolean;
  // how closely the player's move matched the engine's preferred move(s). 0..1
  matchScore?: number;
  // points mapped from matchScore (0..100)
  matchPoints?: number;
  // optional numeric score from local heuristic or engine (centipawns-ish for engine, heuristic scale for local)
  score?: number | null;
};

function normalizeIndicator(ind?: string | null | undefined): Analysis['moveIndicator'] | undefined {
  if (!ind) return undefined;
  const v = String(ind).toLowerCase();
  if (v === 'best') return 'Best';
  if (v === 'good') return 'Good';
  if (v === 'book') return 'Book';
  if (v === 'mistake') return 'Mistake';
  if (v === 'blunder') return 'Blunder';
  // map old 'inaccuracy' to 'Neutral'
  if (v === 'inaccuracy' || v === 'inaccurate') return 'Neutral';
  if (v === 'neutral') return 'Neutral';
  // default: return undefined so downstream logic can decide
  return undefined;
}

// localAnalyze: simple browser-only heuristic fallback when no analysis server is configured.
// It examines net material change for the mover and returns a lightweight classification.
function localAnalyze(fenBefore: string, fenAfter: string, moveUci: string) {
  // piece values
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

  function materialSum(fen: string, color: 'w' | 'b') {
    try {
      const ch = new Chess(fen);
      const board = ch.board();
      let sum = 0;
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const sq = board[r][f];
          if (!sq) continue;
          const v = values[sq.type] || 0;
          sum += sq.color === color ? v : -v;
        }
      }
      return sum;
    } catch (e) {
      // If chess.js cannot parse the fen, return 0
      return 0;
    }
  }

  // Determine which side moved: fen format '... w ...' or '... b ...' -> active color is side to move BEFORE the move
  const sideMoved: 'w' | 'b' = (fenBefore.split(' ')[1] === 'w') ? 'w' : 'b';
  const beforeMaterial = materialSum(fenBefore, sideMoved);
  const afterMaterial = materialSum(fenAfter, sideMoved);
  const delta = afterMaterial - beforeMaterial; // positive => net gain for mover
  const fullmoveNum = Number(fenBefore.split(' ')[5] || '1');
  // Additional lightweight heuristics to improve appraisals without Stockfish:
  // - center control (e4/d4/e5/d5)
  // - minor-piece development from baseline rank
  // - giving check
  // - captures (we already use material delta)
  // We'll compute a small score and map it to qualitative indicators.
  let score = 0;
  // material contribution (increased weight)
  if (delta >= 3) score += 6;
  else if (delta >= 1) score += 3;
  else if (delta <= -3) score -= 6;
  else if (delta <= -1) score -= 3;

  // parse move squares
  const from = moveUci ? moveUci.slice(0, 2) : '';
  const to = moveUci ? moveUci.slice(2, 4) : '';
  const promotion = moveUci && moveUci.length === 5 ? moveUci[4] : undefined;

  // center control bonus (increase to favor opening center moves like e4/d4)
  const centerSquares = new Set(['e4', 'd4', 'e5', 'd5']);
  if (centerSquares.has(to)) score += 3;

  // attempt to apply the move on a local Chess instance to inspect result flags
  try {
    // chess before for king-attack baseline
    const chBefore = new Chess(fenBefore);
    const beforeMoves = chBefore.moves({ verbose: true }) as any[];
    // find king square before for the mover
    let kingSquareBefore = '';
    const boardBefore = chBefore.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = boardBefore[r][f];
        if (!sq) continue;
        if (sq.type === 'k' && sq.color === sideMoved) {
          // convert r,f to algebraic
          const file = 'abcdefgh'[f];
          const rank = 8 - r;
          kingSquareBefore = `${file}${rank}`;
        }
      }
    }
    const beforeKingAttacks = beforeMoves.filter(m => m.to === kingSquareBefore).length;

    const ch = new Chess(fenBefore);
    const moveObj = ch.move({ from: from as any, to: to as any, promotion: promotion as any });
    if (moveObj) {
      // detect castling by from/to pattern
      const isCastling = (from === 'e1' && (to === 'g1' || to === 'c1')) || (from === 'e8' && (to === 'g8' || to === 'c8'));

      // compute opponent moves after the move
      const afterMoves = ch.moves({ verbose: true }) as any[];
      const movingPieceAttacks = afterMoves.filter(m => m.to === moveObj.to).length;

      // find king square after for the mover
      let kingSquareAfter = '';
      const boardAfter = ch.board();
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const sq = boardAfter[r][f];
          if (!sq) continue;
          if (sq.type === 'k' && sq.color === sideMoved) {
            const file = 'abcdefgh'[f];
            const rank = 8 - r;
            kingSquareAfter = `${file}${rank}`;
          }
        }
      }
      const afterKingAttacks = afterMoves.filter(m => m.to === kingSquareAfter).length;

      // Capture handling: avoid double-counting material (delta already reflected in score)
      if (moveObj.captured) {
        const capturedType = (moveObj.captured as string) || 'p';
        const capturedValue = values[capturedType] || 1;
        // If material delta already gave a positive score, don't add full capturedValue again.
        if (delta > 0) {
          // small bonus for a good capture unless the capturing piece is immediately attacked
          score += movingPieceAttacks > 0 ? 0 : 1;
        } else {
          // no net material gain detected (delta == 0 or negative) — reward only safe captures
          if (movingPieceAttacks > 0) {
            // risky capture: small or negative reward
            score += Math.max(-2, capturedValue - 2);
          } else {
            score += Math.max(1, capturedValue - 1);
          }
        }
      }

      // check bonus
      if (ch.in_check()) score += 2;

      // king-safety change: fewer attacks on king is good, more is bad
      if (afterKingAttacks < beforeKingAttacks) score += 2;
      else if (afterKingAttacks > beforeKingAttacks) score -= 2;

      // castling is generally good early
      if (isCastling) {
        if (fullmoveNum <= 8) score += 4;
        else score += 2;
      }

      // development bonus: minor piece from starting rank moving forward
      const piece = moveObj.piece;
      const fromRank = parseInt(from[1] || '0', 10);
      const toRank = parseInt(to[1] || '0', 10);
      if (piece === 'n' || piece === 'b') {
        if ((fromRank === 1 && toRank > fromRank) || (fromRank === 8 && toRank < fromRank)) {
          score += 2;
        }
      }

      // penalize if the moved piece is attacked after the move (hanging piece)
      if (movingPieceAttacks > 0) {
        // Stronger penalty for hanging or attacked pieces: each attacking move increases penalty.
        // Cap the penalty so it doesn't explode on highly tactical positions.
        score -= Math.min(9, movingPieceAttacks * 3);
        // If we captured and the capturing piece is immediately attacked, that's especially bad.
        if (moveObj.captured && movingPieceAttacks > 0) {
          score -= 2;
        }
      }
    }
  } catch (e) {
    // ignore invalid-move parsing here — fallback to material-only
  }

  // Map score to qualitative indicator (use 'Neutral' as default)
  let moveIndicator: Analysis['moveIndicator'];
  if (score >= 6) moveIndicator = 'Best';
  else if (score >= 3) moveIndicator = 'Good';
  else if (score <= -8) moveIndicator = 'Blunder';
  else if (score <= -4) moveIndicator = 'Mistake';
  else moveIndicator = 'Neutral';

  // If this is an early opening pawn move to center (book), mark as 'Book'
  const bookMoves = new Set([
    'e2e4','d2d4','c2c4','e2e3','d2d3','c2c3',
    'e7e5','d7d5','c7c5','e7e6','d7d6','c7c6',
  ]);
  const isEarlyBook = fullmoveNum <= 2 && bookMoves.has(moveUci || '');
  if (isEarlyBook) moveIndicator = 'Book';

  // Build analysis text summarizing key signals
  let analysisText: string[] = [];
  if (delta > 0) analysisText.push(`Net material gain of ${delta}.`);
  else if (delta < 0) analysisText.push(`Net material loss of ${Math.abs(delta)}.`);
  if (centerSquares.has(to)) analysisText.push('Move controls the center.');
  if ((moveUci && moveUci.length >= 4) && ((moveUci === 'g1f3') || (moveUci === 'b1c3') || (moveUci === 'g8f6') || (moveUci === 'b8c6'))) {
    analysisText.push('Minor piece development.');
  }
  if (analysisText.length === 0) analysisText.push('No material change. Check tactics and development.');
  analysisText.push(`Move: ${moveUci}`);
  const analysisSummary = analysisText.join(' ');

  const _serious = new Set(['Blunder', 'Mistake']);
  const nextStepHint = _serious.has(moveIndicator ?? '')
    ? 'Review the capture sequence and look for hanging pieces.'
    : 'Continue development and watch for opponent threats.';

  // Compute a rough 'centipawn-like' loss metric from material delta so callers can treat large losses as bad.
  // This is a coarse estimate: material delta is in pawn units, convert to centipawns.
  const lostCentipawns = delta < 0 ? Math.abs(delta) * 100 : 0;

  // If the move caused more than ~20 centipawns of loss (heuristic), mark it as a Mistake at least.
  if (lostCentipawns >= 200) {
    moveIndicator = 'Blunder';
  } else if (lostCentipawns >= 50) {
    moveIndicator = 'Mistake';
  } else if (lostCentipawns >= 20) {
    // small but notable loss — nudge toward Inaccuracy/Mistake
    if (moveIndicator === 'Best' || moveIndicator === 'Good') moveIndicator = 'Neutral';
    else moveIndicator = 'Mistake';
  }

  // Determine botPreference from the heuristic numeric score
  let botPreference: Analysis['botPreference'];
  if (score >= 3) botPreference = 'More';
  else if (score <= -3) botPreference = 'Less';
  else botPreference = 'Equal';

  // Is this an opening move that favors center control?
  const favorsCenter = fullmoveNum <= 8 && centerSquares.has(to);

  return {
    success: true,
    explanation: {
      moveIndicator,
      Analysis: analysisSummary,
      nextStepHint,
      botPreference,
      favorsCenter,
      score,
    } as Analysis,
    rawText: analysisSummary,
  };
}

// Helper: compute bot preference from an engine best-move and optional numeric score
function computeBotPreferenceFromEngine(bestMove: string | null | undefined, moveUci: string | undefined, score: number | null | undefined): Analysis['botPreference'] {
  if (!moveUci) return 'Unknown';
  // Require an exact UCI match (ignoring promotion suffix) for the engine to "favor" the user's move.
  const normalizeUci = (u?: string | null) => (u || '').toString().toLowerCase().replace(/[qrbn]$/, '');
  if (bestMove && normalizeUci(bestMove) === normalizeUci(moveUci)) return 'More';
  // If an engine score is provided we can heuristically decide: large negative score for the mover implies the move is worse
  // Note: engine scores are typically from side to move perspective; treat positive as good for the mover
  if (typeof score === 'number') {
    if (score >= 100) return 'More';
    if (score <= -100) return 'Less';
    return 'Equal';
  }
  if (bestMove) return 'Less';
  return 'Unknown';
}

// Compute how close the player's move is to the engine's recommendation.
// Returns a matchScore in [0,1], integer matchPoints (0..100), and a suggested botPreference.
function computeMoveScore(bestMove: string | null | undefined, moveUci: string | undefined, engineScore: number | null | undefined, fenBefore: string | undefined): { matchScore: number; points: number; botPreference: Analysis['botPreference'] } {
  if (!moveUci) return { matchScore: 0, points: 0, botPreference: 'Unknown' };
  // exact match
  // Treat as exact only when UCI (ignoring promotion suffix) matches exactly.
  const normalizeUci = (u?: string | null) => (u || '').toString().toLowerCase().replace(/[qrbn]$/, '');
  if (bestMove && normalizeUci(bestMove) === normalizeUci(moveUci)) {
    return { matchScore: 1, points: 100, botPreference: 'More' };
  }

  // Try destination similarity and piece-type similarity as fallback heuristics
  const moveTo = moveUci.length >= 4 ? moveUci.slice(2, 4) : '';
  const bestTo = bestMove && bestMove.length >= 4 ? bestMove.slice(2, 4) : '';
  let score = 0;
  if (bestTo && moveTo && bestTo === moveTo) score = 0.75; // same destination

  // if we can inspect piece types, reward same-piece moves
  try {
    if (bestMove && fenBefore) {
      const ch = new Chess(fenBefore);
      const bestFrom = bestMove.slice(0, 2);
      const movedFrom = moveUci.slice(0, 2);
      const bestPiece = ch.get(bestFrom)?.type;
      const movedPiece = ch.get(movedFrom)?.type;
      if (bestPiece && movedPiece && bestPiece === movedPiece) {
        score = Math.max(score, 0.5);
      }
    }
  } catch (e) {
    // ignore chess parsing errors
  }

  // If engine score is provided and indicates the position is close, give moderate credit
  if (typeof engineScore === 'number') {
    // engineScore is in centipawns from side-to-move perspective
    const abs = Math.abs(engineScore);
    // Be slightly more conservative: require closer agreement to award higher score.
    if (abs <= 20) {
      score = Math.max(score, 0.6);
    } else if (abs <= 60) {
      score = Math.max(score, 0.4);
    } else if (abs <= 150) {
      score = Math.max(score, 0.25);
    } else {
      score = Math.max(score, 0.1);
    }
  }

  // default small credit if none of the above applied
  if (score === 0) score = 0.2;

  const points = Math.round(Math.min(1, Math.max(0, score)) * 100);
  let pref: Analysis['botPreference'];
  if (score >= 0.95) pref = 'More';
  else if (score <= 0.15) pref = 'Less';
  else pref = 'Equal';

  return { matchScore: score, points, botPreference: pref };
}

// Infer bot preference from a qualitative moveIndicator when engine numeric data is not available
function inferBotPreferenceFromIndicator(ind?: Analysis['moveIndicator']): Analysis['botPreference'] {
  if (!ind) return 'Unknown';
  if (ind === 'Best' || ind === 'Good') return 'More';
  if (ind === 'Neutral' || ind === 'Book') return 'Equal';
  if (ind === 'Inaccuracy' || ind === 'Mistake' || ind === 'Blunder') return 'Less';
  return 'Unknown';
}

// Enforce rule: if botPreference === 'Less' then the move should be considered at least a 'Mistake'.
// If the point decrement (100 - matchPoints) is greater than 10, consider it a 'Blunder'.
function applyBotPreferenceRules(a?: Analysis | null, previousMatchPoints: number | null = null): Analysis | null {
  if (!a) return a ?? null;
  const botPref = a.botPreference;
  // Determine current matchPoints if present, otherwise derive from matchScore
  let matchPoints: number | null = null;
  if (typeof a.matchPoints === 'number') matchPoints = a.matchPoints;
  else if (typeof a.matchScore === 'number') matchPoints = Math.round(Math.max(0, Math.min(1, a.matchScore)) * 100);

  if (botPref === 'Less') {
    if (typeof matchPoints === 'number') {
      // compute decrement relative to previousMatchPoints if available, otherwise relative to 100
      const base = typeof previousMatchPoints === 'number' ? previousMatchPoints : 100;
      const decrement = base - matchPoints;
      if (decrement > 10) {
        a.moveIndicator = 'Blunder';
      } else {
        a.moveIndicator = 'Mistake';
      }
    } else {
      // no match points available: mark as Mistake by default
      a.moveIndicator = 'Mistake';
    }
  }
  // If the engine/bot has equal preference (neither favors nor disfavors), but
  // the matchPoints are low (<= 50), treat the move as 'Good' rather than 'Best'/'Neutral'.
  if (botPref === 'Equal') {
    if (typeof matchPoints === 'number') {
      if (matchPoints <= 50) {
        a.moveIndicator = 'Good';
      }
    }
  }
  return a;
}

// Helper: determine whether the move favors center control in the opening
function computeFavorsCenter(moveUci: string | undefined, fenBefore: string | undefined): boolean {
  if (!moveUci || !fenBefore) return false;
  const to = moveUci.length >= 4 ? moveUci.slice(2, 4) : '';
  const centerSquares = new Set(['e4', 'd4', 'e5', 'd5']);
  const fullmoveNum = Number(fenBefore.split(' ')[5] || '1');
  return fullmoveNum <= 8 && centerSquares.has(to);
}

// Attempt to run in-browser Stockfish if the `stockfish` package is installed.
// Returns null if Stockfish is not available or fails.
async function analyzeWithStockfish(fenBefore: string, fenAfter: string, moveUci: string, uciHistory: string, depth = 12, cancelled = false) {
  try {
    // Many projects may optionally bundle an in-browser Stockfish build that exposes a global
    // (e.g. window.Stockfish or window.stockfish). We MUST avoid forcing bundlers (webpack) to
    // attempt to resolve an optional 'stockfish' package at build time because it may not be
    // installed in developer environments. The previous dynamic import('stockfish') triggers
    // module resolution and produces the warning seen during `npm start`/build.
    //
    // Instead, detect a runtime-provided Stockfish and use it. If none is available, return null
    // and let the caller fall back to server analysis or local heuristics.
    // Check common global names where an in-browser stockfish may be exposed.
    const globalAny: any = (globalThis || window || ({} as any));
    const engineFactory = globalAny.Stockfish || globalAny.stockfish || globalAny.StockFish || null;
    if (!engineFactory) {
      // No in-browser stockfish available
      return null;
    }

    return await new Promise<any>((resolve) => {
      let bestMove: string | null = null;
      let score: number | null = null;
      let infoLines: string[] = [];
      const engine = typeof engineFactory === 'function' ? engineFactory() : engineFactory;

      const onMessage = (msg: any) => {
        if (!msg) return;
        const line = (typeof msg === 'string') ? msg : (msg.data || msg.data?.toString?.() || String(msg));
        infoLines.push(line);
        if (/^bestmove\s+/i.test(line)) {
          const parts = line.split(/\s+/);
          bestMove = parts[1] || null;
        }
        const scoreMatch = line.match(/score cp (-?\d+)/);
        if (scoreMatch) score = parseInt(scoreMatch[1], 10);
      };

      // Wire message handlers for common APIs
      try {
        if (typeof engine.onmessage === 'function') {
          engine.onmessage = (e: any) => onMessage(e.data || e);
        }
        if (typeof engine.addEventListener === 'function') {
          try { engine.addEventListener('message', (e: any) => onMessage(e.data || e)); } catch (e) {}
        }
      } catch (e) {
        // ignore
      }

      try {
        if (typeof engine.postMessage === 'function') {
          engine.postMessage('uci');
          engine.postMessage('ucinewgame');
          engine.postMessage(`position fen ${fenBefore}`);
          engine.postMessage(`go depth ${depth}`);
        } else if (typeof engine.send === 'function') {
          engine.send('uci');
          engine.send('ucinewgame');
          engine.send(`position fen ${fenBefore}`);
          engine.send(`go depth ${depth}`);
        }
      } catch (e) {
        // engine API failed; give up gracefully
        try { if (engine.terminate) engine.terminate(); } catch (ee) {}
        resolve(null);
        return;
      }

      // poll for bestmove for a limited time
      const timeout = setInterval(() => {
        if (cancelled) {
          clearInterval(timeout);
          try { if (engine.terminate) engine.terminate(); } catch (e) {}
          resolve(null);
        }
        if (bestMove !== null || infoLines.length > 0) {
          clearInterval(timeout);
          try { if (engine.terminate) engine.terminate(); } catch (e) {}
          let sfIndicator: string;
          // Require exact UCI match (ignoring promotion suffix) to mark the user's move as 'Best'
          const normalizeUciLocal = (u?: string | null) => (u || '').toString().toLowerCase().replace(/[qrbn]$/, '');
          const isExactBest = bestMove && moveUci && normalizeUciLocal(bestMove) === normalizeUciLocal(moveUci);
          if (isExactBest) {
            sfIndicator = 'Best';
          } else if (score !== null) {
            // Don't call 'Best' just from a numeric score; map numeric evaluations to a conservative label.
            if (score >= 100) sfIndicator = 'Good';
            else if (score >= 30) sfIndicator = 'Good';
            else if (score >= -20) sfIndicator = 'Neutral';
            else if (score >= -100) sfIndicator = 'Mistake';
            else sfIndicator = 'Blunder';
          } else {
            sfIndicator = 'Neutral';
          }

          resolve({ bestMove, score, explanation: `Stockfish score ${score ?? 'n/a'}`, moveIndicator: sfIndicator, nextStepHint: 'Consider reviewing the engine PV.', infoLines });
        }
      }, 150);
    });
  } catch (e) {
    // dynamic import failed or engine not present
    // eslint-disable-next-line no-console
    console.warn('StockfishTutor: in-browser stockfish unavailable or failed', e);
    return null;
  }
}

const StockfishTutor: React.FC<Props> = ({ enabled, trigger, fenBefore, fenAfter, moveUci, uciHistory }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  // store the previous turn's matchPoints so we can compute decrement relative to that
  const [prevMatchPoints, setPrevMatchPoints] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      try { setDebugLog('tutor disabled (enabled=false)'); } catch (e) {}
      return;
    }

    // allow trigger to be optional — run whenever move context is provided
    if (!fenBefore || !fenAfter || !moveUci) {
      try { setDebugLog('waiting for move context (fenBefore/fenAfter/moveUci)'); } catch (e) {}
      return;
    }

    // Debounce/delay before starting analysis to allow the board & engine to settle
    const analysisDelay = 800; // ms
    const minDisplayTime = 700; // ensure 'thinking' shows for at least this long
    let cancelled = false;
    let timer = 0 as any;

    const doAnalyze = async () => {
      if (cancelled) return;
      setIsAnalyzing(true);
      setError(null);
      setAnalysis(null);
      const startedAt = Date.now();

      try {
        // Debug: log the move context we're about to send for analysis
        // eslint-disable-next-line no-console
        console.debug('StockfishTutor: analyzing move', { fenBefore, fenAfter, moveUci, uciHistory });
        try { setDebugLog(`analyzing move ${moveUci} | fenBefore=${fenBefore.split(' ')[0]}...`); } catch (e) { /* ignore */ }
        // Safely read environment URL keys
        const urls = (environment && (environment as any).urls) || {};
        // Support multiple environment keys: prefer unified chessServerURL but
        // also accept stockfishServerURL (some deployments use that name).
        const rawBase = urls.chessServerURL || urls.stockfishServerURL || urls.chessServer || urls.stockfishServer || '';
        const baseUrl = typeof rawBase === 'string' ? rawBase.replace(/\/$/, '') : '';

                        if (!baseUrl) {
                          // Try in-browser Stockfish engine first (if installed). If unavailable or fails, fall back to localAnalyze.
                          try {
                            // eslint-disable-next-line no-console
                            console.debug('StockfishTutor: attempting in-browser Stockfish');
                            try { setDebugLog('attempting in-browser Stockfish analysis'); } catch (e) {}
                            const sfResult = await analyzeWithStockfish(fenBefore, fenAfter, moveUci || '', uciHistory || '', 12, cancelled);
                            if (sfResult) {
                              // Debug: dump the raw stockfish result so we can see what fields are present
                              // eslint-disable-next-line no-console
                              console.debug('StockfishTutor: in-browser Stockfish returned', sfResult);
                              try { setDebugLog(`in-browser SF returned: ${String(sfResult.bestMove ?? sfResult.score ?? '')}`); } catch (e) {}
                              // Build Analysis object and normalize labels
                              const explanation = {
                                moveIndicator: (normalizeIndicator(sfResult.moveIndicator) as Analysis['moveIndicator']) || (sfResult.moveIndicator as Analysis['moveIndicator']),
                                Analysis: sfResult.explanation ?? `Best move: ${sfResult.bestMove ?? 'n/a'}; score: ${sfResult.score ?? 'n/a'}`,
                                nextStepHint: sfResult.nextStepHint,
                                botPreference: computeBotPreferenceFromEngine(sfResult.bestMove, moveUci, sfResult.score),
                                favorsCenter: computeFavorsCenter(moveUci, fenBefore),
                                score: typeof sfResult.score === 'number' ? sfResult.score : null,
                              } as Analysis;

                              // compute how closely the player's move matches the engine's recommendation
                              try {
                                const moveScore = computeMoveScore(sfResult.bestMove, moveUci, typeof sfResult.score === 'number' ? sfResult.score : null, fenBefore);
                                    explanation.matchScore = moveScore.matchScore;
                                    explanation.matchPoints = moveScore.points;
                                    // prefer engine-based botPreference but fall back to moveScore suggestion
                                    explanation.botPreference = explanation.botPreference || moveScore.botPreference;
                                  } catch (e) {
                                    // ignore scoring errors
                                  }

                                      // apply user-defined botPreference rules (Less => Mistake/Blunder)
                                      const finalExplanation = applyBotPreferenceRules(explanation, prevMatchPoints) || null;
                                      setAnalysis(finalExplanation);
                                      // store current matchPoints for the next turn
                                      try {
                                        if (finalExplanation && typeof finalExplanation.matchPoints === 'number') setPrevMatchPoints(finalExplanation.matchPoints);
                                      } catch (e) {}
                              // extra debug showing the final explanation object
                              // eslint-disable-next-line no-console
                              console.debug('StockfishTutor: analysis (in-browser)', explanation);
                              try { setDebugLog(`stockfish result: ${sfResult.moveIndicator} | best=${sfResult.bestMove} score=${sfResult.score}`); } catch (e) {}
                              const elapsed = Date.now() - startedAt;
                              if (elapsed < minDisplayTime) await new Promise((r) => setTimeout(r, minDisplayTime - elapsed));
                              if (cancelled) return;
                              setIsAnalyzing(false);
                              return;
                            }
                          } catch (e) {
                            // eslint-disable-next-line no-console
                            console.warn('StockfishTutor: in-browser Stockfish failed, falling back to localAnalyze', e);
                            try { setDebugLog('in-browser Stockfish failed, using local fallback'); } catch (ee) {}
                          }

                          // Use local no-network heuristic analyzer as a fallback so the UI works without a server.
                          // Add a small delay to give the feel of real analysis and to let quick successive moves settle.
                          await new Promise((r) => setTimeout(r, 300));
                          if (cancelled) return;
                          const local = localAnalyze(fenBefore, fenAfter, moveUci || '');
                          // eslint-disable-next-line no-console
                          console.debug('StockfishTutor: local analyze result', local);
                          try { setDebugLog(`local result: ${local.explanation?.moveIndicator ?? '—'} | ${local.rawText}`); } catch (e) { /* ignore */ }
                          // normalize local result labels
                          if (local && local.explanation) {
                            const norm = { ...local.explanation } as Analysis;
                            norm.moveIndicator = normalizeIndicator(norm.moveIndicator as any) || norm.moveIndicator;
                            try {
                              const mv = computeMoveScore(undefined, moveUci, norm.score ?? null, fenBefore);
                              norm.matchScore = mv.matchScore;
                              norm.matchPoints = mv.points;
                              norm.botPreference = norm.botPreference || mv.botPreference;
                            } catch (e) {}
                            const finalNorm = applyBotPreferenceRules(norm, prevMatchPoints) || null;
                            setAnalysis(finalNorm);
                            try {
                              if (finalNorm && typeof finalNorm.matchPoints === 'number') setPrevMatchPoints(finalNorm.matchPoints);
                            } catch (e) {}
                          } else {
                            setAnalysis({ Analysis: local.rawText });
                          }
                          const elapsed = Date.now() - startedAt;
                          if (elapsed < minDisplayTime) await new Promise((r) => setTimeout(r, minDisplayTime - elapsed));
                          if (cancelled) return;
                          setIsAnalyzing(false);
                          return;
                        }

        // Try a set of common endpoints in case the server route differs (e.g. /analyze vs /api/analyze)
        const endpoints = [
          `${baseUrl}/api/analyze`,
          `${baseUrl}/analyze`,
          `${baseUrl}/api/stockfish/analyze`,
          baseUrl,
        ];

        let rawText: string | null = null;
        let res: Response | null = null;
        let usedEndpoint: string | null = null;

        for (const endpoint of endpoints) {
          try {
            // eslint-disable-next-line no-console
            console.debug('StockfishTutor: attempting analyze endpoint', endpoint);
            res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'move',
                fen_before: fenBefore,
                fen_after: fenAfter,
                move: moveUci,
                uciHistory: uciHistory || '',
                depth: 15,
              }),
            });

            rawText = await res.text();
            // Debug: show raw server response to aid debugging
            // eslint-disable-next-line no-console
            console.debug('StockfishTutor: raw analyze response (truncated)', rawText.slice(0, 200));

            // If the server returned an HTML error page or a non-OK HTTP status, skip this endpoint and try the next.
            const looksLikeHtml = /^\s*<!doctype html>|^\s*<html/i.test(rawText || '');
            const bodySignalsError = rawText && (/Cannot POST/i.test(rawText) || /Cannot GET/i.test(rawText) || /Not Found/i.test(rawText));
            if (bodySignalsError || looksLikeHtml || (res && !res.ok)) {
              // eslint-disable-next-line no-console
              console.warn('StockfishTutor: endpoint returned non-JSON or error response, trying next', endpoint, { status: res?.status, bodySignalsError });
              rawText = null;
              res = null;
              continue; // try next endpoint
            }

            // If we got here, we have a non-error textual response (likely JSON) and can use this endpoint.
            usedEndpoint = endpoint;
            break;
          } catch (fetchErr) {
            // Network error or CORS — try next
            // eslint-disable-next-line no-console
            console.warn('StockfishTutor: fetch failed for endpoint, trying next', endpoint, fetchErr?.message || fetchErr);
            rawText = null;
            res = null;
          }
        }

          if (!rawText) {
          // No usable server response from any endpoint — fall back to local heuristic so the tutor still works offline
          // eslint-disable-next-line no-console
          console.warn('StockfishTutor: no usable server response, falling back to localAnalyze');
          try { setDebugLog('no server response, using localAnalyze fallback'); } catch (e) { /* ignore */ }
          const local = localAnalyze(fenBefore, fenAfter, moveUci || '');
                          if (local && local.explanation) {
            const norm = { ...local.explanation } as Analysis;
            norm.moveIndicator = normalizeIndicator(norm.moveIndicator as any) || norm.moveIndicator;
            try {
              const mv = computeMoveScore(undefined, moveUci, norm.score ?? null, fenBefore);
              norm.matchScore = mv.matchScore;
              norm.matchPoints = mv.points;
              norm.botPreference = norm.botPreference || mv.botPreference;
            } catch (e) {}
            const finalNorm = applyBotPreferenceRules(norm, prevMatchPoints) || null;
            setAnalysis(finalNorm);
            try {
              if (finalNorm && typeof finalNorm.matchPoints === 'number') setPrevMatchPoints(finalNorm.matchPoints);
            } catch (e) {}
          } else {
            setAnalysis({ Analysis: local.rawText });
          }
          const elapsed = Date.now() - startedAt;
          if (elapsed < minDisplayTime) await new Promise((r) => setTimeout(r, minDisplayTime - elapsed));
          if (cancelled) return;
          setIsAnalyzing(false);
          return;
        }
        let data: any;
        try {
          data = JSON.parse(rawText);
        } catch (parseErr) {
          // If the response isn't pure JSON, attempt to extract a JSON substring
          // This handles servers that wrap JSON in text or code fences.
          const firstBrace = rawText.indexOf('{');
          const lastBrace = rawText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const candidate = rawText.slice(firstBrace, lastBrace + 1);
            try {
              data = JSON.parse(candidate);
              // proceed with parsed `data`
            } catch (innerErr) {
              // Couldn't recover JSON — log and fallback to raw text display
              // eslint-disable-next-line no-console
              console.error('StockfishTutor: failed to parse extracted JSON candidate:', candidate, innerErr);
              setAnalysis({ Analysis: rawText });
              setIsAnalyzing(false);
              return;
            }
          } else {
            // No JSON-looking substring — log and show raw text
            // eslint-disable-next-line no-console
            console.error('StockfishTutor: non-JSON response from analyze endpoint:', rawText);
            // If the server returned an HTML error like "Cannot POST /api/analyze" inform the user with guidance
            if (/Cannot POST/i.test(rawText) || /Cannot GET/i.test(rawText) || /Not Found/i.test(rawText)) {
              setError(`Analysis endpoint not found at ${usedEndpoint}. Server returned: ${rawText.split('\n')[0]}. Check that the analysis server is running and that the URL in your environment is correct.`);
            } else {
              setAnalysis({ Analysis: rawText });
            }
            setIsAnalyzing(false);
            return;
          }
        }

        // Debug: show parsed server response for inspection (helps determine if bestMove/score are present)
        // eslint-disable-next-line no-console
        console.debug('StockfishTutor: parsed analyze response data=', data, 'usedEndpoint=', usedEndpoint);
        try { setDebugLog(`parsed server response: ${usedEndpoint} -> ${data && (data.bestMove || data.score || data.explanation)}`); } catch (e) {}

        if (!data || !data.success) {
          setError((data && (data.error || 'Analysis failed')) || 'Analysis failed');
          setIsAnalyzing(false);
          return;
        }

        let parsed: Analysis | undefined;
        const expl = data && data.explanation;
        if (typeof expl === 'string') {
          const cleaned = expl.replace(/```json/g, '').replace(/```/g, '').trim();
          // Only attempt JSON.parse if it looks like JSON
          const looksLikeJson = cleaned.startsWith('{') || cleaned.startsWith('[');
          if (looksLikeJson) {
            try {
              parsed = JSON.parse(cleaned);
            } catch (e) {
              // parsing failed, store raw text instead
              parsed = { Analysis: cleaned };
            }
          } else {
            // not JSON — return raw explanation text
            parsed = { Analysis: cleaned };
          }
        } else if (expl && typeof expl === 'object') {
          parsed = expl as Analysis;
        }

        // Normalize legacy/other labels: prefer 'Neutral' instead of 'Inaccuracy'
        if (parsed && parsed.moveIndicator === 'Inaccuracy') {
          parsed.moveIndicator = 'Neutral';
        }

        // If server returned engine metadata, compute botPreference and favorsCenter if not provided
        try {
          // data may contain bestMove/best_move or embedded strings. Attempt to find them.
          let engineBest: string | null | undefined = null;
          if (data) engineBest = data.bestMove || data.best_move || null;
          // If parsed explanation includes a bestMove field, prefer it
          if (!engineBest && parsed) engineBest = (parsed as any).bestMove || (parsed as any).best_move || null;
          const engineScore = data && (data.score || data.eval || (parsed && ((parsed as any).score || (parsed as any).eval)));

          // Extra diagnostics: if no engineBest was returned, try extracting a bestmove token from any textual explanation
          if (!engineBest) {
            const explText = typeof data?.explanation === 'string' ? data.explanation : (typeof parsed?.Analysis === 'string' ? parsed.Analysis : '');
            const bmMatch = explText && (explText.match(/bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/i) || explText.match(/"bestmove"\s*:\s*"([^"]+)"/i));
            if (bmMatch) {
              engineBest = bmMatch[1];
            } else {
              // no bestmove found — surface helpful debug info so developers can inspect the raw response
              try {
                const snippet = String(rawText || '').slice(0, 1000);
                // set a debug log visible in the UI so users can copy it when filing issues
                setDebugLog(`No engine bestMove returned from ${usedEndpoint}. Response snippet: ${snippet.replace(/\s+/g, ' ').trim()}`);
              } catch (e) {
                // ignore
              }
            }
          }
          if (parsed) {
            parsed.botPreference = (parsed.botPreference as any) || computeBotPreferenceFromEngine(engineBest, moveUci, typeof engineScore === 'number' ? engineScore : null) || inferBotPreferenceFromIndicator(parsed.moveIndicator as any);
            parsed.favorsCenter = (parsed.favorsCenter === undefined) ? computeFavorsCenter(moveUci, fenBefore) : parsed.favorsCenter;
            parsed.score = (parsed.score === undefined || parsed.score === null) ? (typeof engineScore === 'number' ? engineScore : parsed.score ?? null) : parsed.score;

            // compute matchScore/matchPoints using engine's bestMove if available
            try {
              const mv = computeMoveScore(engineBest, moveUci, typeof engineScore === 'number' ? engineScore : null, fenBefore);
              (parsed as any).matchScore = mv.matchScore;
              (parsed as any).matchPoints = mv.points;
              parsed.botPreference = parsed.botPreference || mv.botPreference;
              // Debug: show what we computed from engineBest/engineScore
              // eslint-disable-next-line no-console
              console.debug('StockfishTutor: engineBest, engineScore, computed mv ->', { engineBest, engineScore, mv });
              try { setDebugLog(`engineBest=${engineBest} score=${engineScore} mv=${mv.points}`); } catch (e) {}
            } catch (e) {}

            // Apply user rule: botPreference 'Less' => Mistake; if (100 - matchPoints) > 10 => Blunder
            try {
              parsed = applyBotPreferenceRules(parsed, prevMatchPoints) || parsed;
            } catch (e) {}
            try {
              if (parsed && typeof (parsed as any).matchPoints === 'number') setPrevMatchPoints((parsed as any).matchPoints);
            } catch (e) {}
          }
        } catch (e) {
          // ignore compute errors
        }

        // Respect minimum thinking display time for better UX
        const elapsed = Date.now() - startedAt;
        if (elapsed < minDisplayTime) await new Promise((r) => setTimeout(r, minDisplayTime - elapsed));
        if (cancelled) return;
        setAnalysis(parsed || null);
        setIsAnalyzing(false);
      } catch (err: any) {
        setError(err?.message || 'Network error');
        if (!cancelled) setIsAnalyzing(false);
      }
    };

    // Start analysis after debounce delay
    timer = setTimeout(() => doAnalyze(), analysisDelay);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [trigger, enabled, fenBefore, fenAfter, moveUci, uciHistory]);

  if (!enabled) return <div className={styles.tutorPlaceholder}>Tutor disabled</div>;

  return (
    <div className={styles.tutorContainer}>
      <div className={styles.tutorHeader}>Stockfish Tutor</div>
      <div className={styles.tutorBody}>
        {isAnalyzing && <div className={styles.loading}>Analyzing move...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!isAnalyzing && !error && analysis && (
          <div className={styles.analysis}>
            <div className={styles.indicator}>{analysis.moveIndicator ?? '—'}</div>
            <div className={styles.text}>{analysis.Analysis ?? 'No explanation provided.'}</div>
            {analysis.botPreference && (
              <div className={styles.hint}>Bot preference: {analysis.botPreference}</div>
            )}
            {typeof analysis.matchPoints === 'number' && (
              <div className={styles.hint}>Match points: {analysis.matchPoints}/100</div>
            )}
            {typeof analysis.favorsCenter === 'boolean' && (
              <div className={styles.hint}>Favors center: {analysis.favorsCenter ? 'Yes' : 'No'}</div>
            )}
            {analysis.nextStepHint && <div className={styles.hint}>Next: {analysis.nextStepHint}</div>}
          </div>
        )}
        {!isAnalyzing && !error && !analysis && (
          <div className={styles.empty}>Make a move to get instant feedback.</div>
        )}
        {debugLog && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>Debug: {debugLog}</div>
        )}
      </div>
    </div>
  );
};

export default StockfishTutor;

