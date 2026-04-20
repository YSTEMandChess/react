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
        score -= Math.min(3, movingPieceAttacks);
      }
    }
  } catch (e) {
    // ignore invalid-move parsing here — fallback to material-only
  }

  // Map score to qualitative indicator (use 'Neutral' as default)
  let moveIndicator: Analysis['moveIndicator'];
  if (score >= 6) moveIndicator = 'Best';
  else if (score >= 3) moveIndicator = 'Good';
  else if (score <= -6) moveIndicator = 'Blunder';
  else if (score <= -3) moveIndicator = 'Mistake';
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

  return {
    success: true,
    explanation: {
      moveIndicator,
      Analysis: analysisSummary,
      nextStepHint,
    } as Analysis,
    rawText: analysisSummary,
  };
}

// Attempt to run in-browser Stockfish if the `stockfish` package is installed.
// Returns null if Stockfish is not available or fails.
async function analyzeWithStockfish(fenBefore: string, fenAfter: string, moveUci: string, uciHistory: string, depth = 12, cancelled = false) {
  try {
    // dynamic import (some projects bundle a stockfish.js that exports a factory)
    // The package name may vary; many setups use 'stockfish' that returns a function/worker.
    // We'll attempt to import and construct an engine if possible.
    // dynamically import stockfish if it's installed. It's optional for the project.
    // Use ts-ignore because the package may not be present in this repository and that's acceptable.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const stockfishModule: any = await import('stockfish').then((m: any) => (m && (m.default || m)));
    if (!stockfishModule) return null;

    return await new Promise<any>((resolve) => {
      let bestMove: string | null = null;
      let score: number | null = null;
      let infoLines: string[] = [];
      const engine = typeof stockfishModule === 'function' ? stockfishModule() : stockfishModule;

      const onMessage = (msg: string) => {
        if (!msg) return;
        const line = msg.toString();
        infoLines.push(line);
        // UCI info lines may contain 'score cp N' or 'score mate N'
        if (/^bestmove\s+/i.test(line)) {
          const parts = line.split(/\s+/);
          bestMove = parts[1] || null;
        }
        const scoreMatch = line.match(/score cp (-?\d+)/);
        if (scoreMatch) score = parseInt(scoreMatch[1], 10);
      };

      // some stockfish builds use postMessage/onmessage, others use send
      if (typeof engine.onmessage === 'function') {
        engine.onmessage = (e: any) => onMessage(e.data || e);
      }
      if (typeof engine.addEventListener === 'function') {
        try { engine.addEventListener('message', (e: any) => onMessage(e.data || e)); } catch (e) {}
      }
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

      // poll for bestmove for a limited time
      const timeout = setInterval(() => {
        if (cancelled) {
          clearInterval(timeout);
          try { if (engine.terminate) engine.terminate(); } catch (e) {}
          resolve(null);
        }
          if (bestMove !== null || infoLines.length > 0) {
          // we have info — return what we have
          clearInterval(timeout);
          try { if (engine.terminate) engine.terminate(); } catch (e) {}
          // Heuristic mapping: if bestMove equals our moveUci, it's likely good
          // Map engine centipawn score to qualitative indicator; small scores -> Neutral
          let sfIndicator: string;
          if (bestMove && moveUci && bestMove.startsWith(moveUci)) sfIndicator = 'Best';
          else if (score !== null) {
            if (score >= 100) sfIndicator = 'Best';
            else if (score >= 30) sfIndicator = 'Good';
            else if (score >= -20) sfIndicator = 'Neutral';
            else if (score >= -100) sfIndicator = 'Mistake';
            else sfIndicator = 'Blunder';
          } else {
            sfIndicator = 'Neutral';
          }

          resolve({ bestMove, score, explanation: `Stockfish score ${score ?? 'n/a'}`, moveIndicator: sfIndicator, nextStepHint: 'Consider reviewing the engine PV.' });
        }
      }, 150);
    });
  } catch (e) {
    // dynamic import failed or engine not present
    // eslint-disable-next-line no-console
    console.warn('StockfishTutor: in-browser stockfish import failed', e);
    return null;
  }
}

const StockfishTutor: React.FC<Props> = ({ enabled, trigger, fenBefore, fenAfter, moveUci, uciHistory }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
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
        const rawBase = urls.chessServerURL || urls.chessServer || '';
        const baseUrl = typeof rawBase === 'string' ? rawBase.replace(/\/$/, '') : '';

                        if (!baseUrl) {
                          // Try in-browser Stockfish engine first (if installed). If unavailable or fails, fall back to localAnalyze.
                          try {
                            // eslint-disable-next-line no-console
                            console.debug('StockfishTutor: attempting in-browser Stockfish');
                            try { setDebugLog('attempting in-browser Stockfish analysis'); } catch (e) {}
                            const sfResult = await analyzeWithStockfish(fenBefore, fenAfter, moveUci || '', uciHistory || '', 12, cancelled);
                            if (sfResult) {
                              // Build Analysis object and normalize labels
                              const explanation = {
                                moveIndicator: (normalizeIndicator(sfResult.moveIndicator) as Analysis['moveIndicator']) || (sfResult.moveIndicator as Analysis['moveIndicator']),
                                Analysis: sfResult.explanation ?? `Best move: ${sfResult.bestMove ?? 'n/a'}; score: ${sfResult.score ?? 'n/a'}`,
                                nextStepHint: sfResult.nextStepHint,
                              } as Analysis;
                              setAnalysis(explanation);
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
                            setAnalysis(norm);
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
            setAnalysis(norm);
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
  }, [trigger, enabled, fenBefore, fenAfter, moveUci]);

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

