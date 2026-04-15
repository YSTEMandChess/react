import React, { useEffect, useState } from 'react';
import { environment } from '../../environments/environment';
import styles from './StockfishTutor.module.scss';

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
        // environment uses chessServerURL (not chessServer)
        const baseUrl = (environment.urls.chessServerURL || environment.urls.chessServer || '').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/api/analyze`, {
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

        const data = await res.json();
        if (!data.success) {
          setError(data.error || 'Analysis failed');
          setIsAnalyzing(false);
          return;
        }

        let parsed: Analysis | undefined;
        if (typeof data.explanation === 'string') {
          try {
            parsed = JSON.parse(data.explanation.replace(/```json/g, '').replace(/```/g, '').trim());
          } catch (e) {
            // fall back to raw text
            parsed = { Analysis: data.explanation };
          }
        } else if (data.explanation && typeof data.explanation === 'object') {
          parsed = data.explanation;
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

