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
  moveIndicator?: 'Best' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder';
  Analysis?: string;
  nextStepHint?: string;
};

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

  let moveIndicator: Analysis['moveIndicator'];
  if (delta >= 3) moveIndicator = 'Best';
  else if (delta >= 1) moveIndicator = 'Good';
  else if (delta <= -3) moveIndicator = 'Blunder';
  else if (delta <= -1) moveIndicator = 'Mistake';
  else moveIndicator = 'Inaccuracy';

  let analysisText: string;
  if (delta > 0) {
    analysisText = `Net material gain of ${delta}. This was a favorable capture. Move: ${moveUci}`;
  } else if (delta < 0) {
    analysisText = `Net material loss of ${Math.abs(delta)}. This move lost material and may be a ${moveIndicator}. Move: ${moveUci}`;
  } else {
    analysisText = `No material change. Move appears neutral; check tactics and development. Move: ${moveUci}`;
  }

  const nextStepHint = (moveIndicator === 'Blunder' || moveIndicator === 'Mistake')
    ? 'Review the capture sequence and look for hanging pieces.'
    : 'Continue development and watch for opponent threats.';

  return {
    success: true,
    explanation: {
      moveIndicator,
      Analysis: analysisText,
      nextStepHint,
    } as Analysis,
    rawText: analysisText,
  };
}

const StockfishTutor: React.FC<Props> = ({ enabled, trigger, fenBefore, fenAfter, moveUci, uciHistory }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!trigger) return;
    if (!fenBefore || !fenAfter || !moveUci) return;

    const doAnalyze = async () => {
      setIsAnalyzing(true);
      setError(null);
      setAnalysis(null);

      try {
        // Debug: log the move context we're about to send for analysis
        // eslint-disable-next-line no-console
        console.debug('StockfishTutor: analyzing move', { fenBefore, fenAfter, moveUci, uciHistory });
        // Safely read environment URL keys
        const urls = (environment && (environment as any).urls) || {};
        const rawBase = urls.chessServerURL || urls.chessServer || '';
        const baseUrl = typeof rawBase === 'string' ? rawBase.replace(/\/$/, '') : '';

        if (!baseUrl) {
          // Use local no-network heuristic analyzer as a fallback so the UI works without a server.
          const local = localAnalyze(fenBefore, fenAfter, moveUci || '');
          setAnalysis(local.explanation || { Analysis: local.rawText });
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
          setError('No reachable analysis endpoint found. Check your analysis server URL and that the server is running.');
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

        setAnalysis(parsed || null);
        setIsAnalyzing(false);
      } catch (err: any) {
        setError(err?.message || 'Network error');
        setIsAnalyzing(false);
      }
    };

    doAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, enabled]);

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
      </div>
    </div>
  );
};

export default StockfishTutor;

