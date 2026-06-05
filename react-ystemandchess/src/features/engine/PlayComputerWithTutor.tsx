import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Chess as ChessClass } from 'chess.js';
import { io } from 'socket.io-client';
import { Move } from '../../core/types/chess';
import ChessBoard, { ChessBoardRef } from '../../components/ChessBoard/ChessBoard';
import { environment } from '../../environments/environment';
import StockfishTutor from './StockfishTutor';
import styles from './PlayComputer.module.scss';

// Normalize chess.js named export to local constructor
const Chess: any = ChessClass;

type Difficulty = 1 | 5 | 10 | 15 | 20;

const PlayComputerWithTutor: React.FC = () => {
  const chessBoardRef = useRef<ChessBoardRef>(null);
  const socketRef = useRef<any>(null);
  const gameRef = useRef<any>(new Chess());
  const playerColorRef = useRef<'white' | 'black'>('white');
  const sessionStartedRef = useRef<boolean>(false);
  const difficultyRef = useRef<Difficulty>(10);
  const movesContainerRef = useRef<HTMLDivElement>(null);

  const [fen, setFen] = useState<string>(gameRef.current.fen());
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [difficulty, setDifficulty] = useState<Difficulty>(10);
  const [isThinking, setIsThinking] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [fenHistory, setFenHistory] = useState<string[]>([gameRef.current.fen()]);
  const [uciHistoryArr, setUciHistoryArr] = useState<string[]>([]); // list of UCI strings per ply
  const [navDebug, setNavDebug] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(true);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [gameEndMessage, setGameEndMessage] = useState('');

  // tutor state
  const [tutorEnabled, setTutorEnabled] = useState(true);
  const [tutorTrigger, setTutorTrigger] = useState(0);
  const [lastMoveData, setLastMoveData] = useState<{fenBefore?: string; fenAfter?: string; moveUci?: string; uciHistory?: string}>({});

  useEffect(() => { playerColorRef.current = playerColor; }, [playerColor]);
  useEffect(() => { sessionStartedRef.current = sessionStarted; }, [sessionStarted]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  useEffect(() => {
    if (movesContainerRef.current) {
      movesContainerRef.current.scrollTop = movesContainerRef.current.scrollHeight;
    }
  }, [moveHistory]);

  const requestComputerMove = useCallback((currentFen: string) => {
    if (!socketRef.current || !sessionStartedRef.current) return;
    setIsThinking(true);
    socketRef.current.emit('evaluate-fen', { fen: currentFen, move: '', level: difficultyRef.current });
  }, []);

  useEffect(() => {
    const socket = io(environment.urls.stockfishServerURL, { transports: ['websocket'], reconnection: true });
    socketRef.current = socket;

    socket.on('connect', () => { console.debug('PlayComputerWithTutor: socket connected'); setConnected(true); });
    socket.on('disconnect', (reason: any) => { console.debug('PlayComputerWithTutor: socket disconnected', reason); setConnected(false); setSessionStarted(false); sessionStartedRef.current = false; });

    socket.on('session-started', ({ success }: any) => {
      console.debug('PlayComputerWithTutor: session-started', { success });
      setSessionStarted(true); sessionStartedRef.current = true;
      if (success && playerColorRef.current === 'black') requestComputerMove(gameRef.current.fen());
    });

    socket.on('evaluation-complete', ({ mode, move }: any) => {
      console.debug('PlayComputerWithTutor: evaluation-complete', { mode, move });
      if (mode === 'move' && move) {
        try {
          const moveResult = gameRef.current.move(move);
          if (moveResult) {
            const updatedFen = gameRef.current.fen();
            setFen(updatedFen);
            setHighlightSquares([moveResult.from, moveResult.to]);
            setMoveHistory(prev => [...prev, `${moveResult.from} -> ${moveResult.to}`]);
            // record fen/uci history for navigation
            setFenHistory(prev => [...prev, updatedFen]);
            setUciHistoryArr(prev => [...prev, `${moveResult.from}${moveResult.to}${moveResult.promotion ?? ''}`]);
            if (chessBoardRef.current) {
              chessBoardRef.current.setPosition(updatedFen);
              chessBoardRef.current.highlightMove(moveResult.from, moveResult.to);
            }
          }
        } catch (err) { console.error('Failed to apply computer move:', err); }
        setIsThinking(false);
      }
    });

    socket.on('evaluation-error', ({ error }: any) => { console.error('Evaluation error:', error); setIsThinking(false); alert('Engine error: ' + error); });

    return () => { socket.disconnect(); };
  }, [requestComputerMove]);

  const startSession = useCallback(() => {
    if (!connected || !socketRef.current) { alert('Not connected to server'); return; }
    const initialFen = gameRef.current.fen();
    socketRef.current.emit('start-session', { sessionType: 'player-vs-computer', fen: initialFen });
    setShowSettings(false);
  }, [connected]);

  const handleMove = useCallback((move: Move) => {
    try {
      const fenBefore = gameRef.current.fen();
      const moveResult = gameRef.current.move({ from: move.from, to: move.to, promotion: move.promotion });
      if (!moveResult) { console.error('Invalid move'); return; }

      const newFen = gameRef.current.fen();
      setFen(newFen);
      setHighlightSquares([move.from, move.to]);
      setMoveHistory(prev => [...prev, `${move.from} -> ${move.to}`]);
      // record fen/uci history for navigation
      setFenHistory(prev => [...prev, newFen]);
      setUciHistoryArr(prev => [...prev, `${move.from}${move.to}${move.promotion ?? ''}`]);

      // trigger tutor analysis with fen before/after and uci
      const currentMoveUci = `${move.from}${move.to}${move.promotion ?? ''}`;
      const uciHistory = moveHistory.join(' ');
      setLastMoveData({ fenBefore, fenAfter: newFen, moveUci: currentMoveUci, uciHistory });
      setTutorTrigger(t => t + 1);

      if (checkGameStatus()) return;

      if (socketRef.current) {
        socketRef.current.emit('update-fen', { fen: newFen });
        requestComputerMove(newFen);
      }
    } catch (error) { console.error('Error handling move:', error); }
  }, [moveHistory, requestComputerMove]);

  const checkGameStatus = useCallback((): boolean => {
    const game = gameRef.current;
    if (game.isCheckmate()) { const winner = game.turn() === 'w' ? 'Black' : 'White'; setGameEndMessage(`Checkmate! ${winner} wins!`); setShowGameEndModal(true); return true; }
    if (game.isDraw()) { setGameEndMessage('Game over: Draw!'); setShowGameEndModal(true); return true; }
    if (game.isStalemate()) { setGameEndMessage('Stalemate! Draw!'); setShowGameEndModal(true); return true; }
    if (game.isThreefoldRepetition()) { setGameEndMessage('Draw by threefold repetition!'); setShowGameEndModal(true); return true; }
    if (game.isInsufficientMaterial()) { setGameEndMessage('Draw by insufficient material!'); setShowGameEndModal(true); return true; }
    if (game.isCheck()) { const sideInCheck = game.turn() === 'w' ? 'White' : 'Black'; setGameStatus(`${sideInCheck} is in Check!`); setTimeout(() => setGameStatus(''), 5000); } else { setGameStatus(''); }
    return false;
  }, []);

  const resetGame = useCallback(() => {
    gameRef.current.reset();
    const startFen = gameRef.current.fen();
    setFen(startFen); setMoveHistory([]); setHighlightSquares([]); setGameStatus(''); setIsThinking(false);
    if (chessBoardRef.current) chessBoardRef.current.reset();
    // Reset tutor feedback/state: clear last move context and nudge the tutor trigger
    try {
      setLastMoveData({});
      setTutorTrigger(t => t + 1);
    } catch (e) {}
    setFenHistory([startFen]);
    setUciHistoryArr([]);
    if (socketRef.current && sessionStartedRef.current) {
      socketRef.current.emit('update-fen', { fen: startFen });
      if (playerColorRef.current === 'black') setTimeout(() => requestComputerMove(startFen), 500);
    }
  }, [requestComputerMove]);

  const newGame = useCallback(() => { if (socketRef.current && sessionStartedRef.current) socketRef.current.emit('end-session'); resetGame(); setShowSettings(true); setSessionStarted(false); sessionStartedRef.current = false; }, [resetGame]);

  const undoMove = useCallback(() => {
    if (moveHistory.length < 2) return;
    gameRef.current.undo(); gameRef.current.undo();
    const newFen = gameRef.current.fen(); setFen(newFen); setMoveHistory(prev => prev.slice(0, -2)); setHighlightSquares([]); setGameStatus('');
    if (chessBoardRef.current) chessBoardRef.current.setPosition(newFen);
    if (socketRef.current) socketRef.current.emit('update-fen', { fen: newFen });
    try {
      setFenHistory(prev => prev.slice(0, -2));
      setUciHistoryArr(prev => prev.slice(0, -2));
      // nudge tutor to react to shorter history
      setTutorTrigger(t => t + 1);
      setLastMoveData({});
    } catch (e) {}
  }, [moveHistory.length]);

  // Navigate to a particular ply (0-based). plyIndex corresponds to the move index in uciHistoryArr/moveHistory
  const gotoPly = useCallback((plyIndex: number) => {
    try {
      // Recompute the target FEN by replaying UCIs up to plyIndex inclusive.
      let ucisToReplay: string[];
      if (uciHistoryArr && uciHistoryArr.length > plyIndex) {
        ucisToReplay = uciHistoryArr.slice(0, plyIndex + 1);
      } else {
        // fallback: try to parse from moveHistory entries like 'e2 -> e4'
        const parsed: string[] = [];
        for (let i = 0; i <= plyIndex && i < moveHistory.length; i++) {
          const mv = moveHistory[i];
          if (!mv) continue;
          // mv format expected 'e2 -> e4' or similar
          const parts = mv.split('->').map(s => s.trim());
          if (parts.length >= 2 && parts[0].length >= 2 && parts[1].length >= 2) {
            const from = parts[0].slice(0, 2);
            const to = parts[1].slice(0, 2);
            parsed.push(`${from}${to}`);
          }
        }
        ucisToReplay = parsed;
      }

      const ch = new Chess();
      let lastUci: string | undefined = undefined;
      for (const m of ucisToReplay) {
        if (!m) continue;
        lastUci = m;
        const from = m.slice(0, 2);
        const to = m.slice(2, 4);
        const prom = m.length === 5 ? m[4] : undefined;
        try { ch.move({ from, to, promotion: prom } as any); } catch (e) { /* ignore invalid during replay */ }
      }
      const targetFen = ch.fen();
      const uci = lastUci;
      // Debug
      // eslint-disable-next-line no-console
      console.debug('PlayComputerWithTutor: gotoPly recomputed', { plyIndex, targetFen, uci, fenHistoryLength: fenHistory.length, uciHistoryLength: uciHistoryArr.length });

      // Load the computed FEN into the engine so subsequent moves continue from here
      try {
        if (gameRef.current && typeof gameRef.current.load === 'function') {
          gameRef.current.load(targetFen);
        } else {
          try { gameRef.current = new Chess(targetFen); } catch (e) {}
        }
      } catch (e) {}

      // Force update board immediately via ref then set parent fen state
      if (chessBoardRef.current) {
        try { chessBoardRef.current.loadPosition(targetFen); } catch (e) {}
        try { chessBoardRef.current.setPosition(targetFen); } catch (e) {}
        try { chessBoardRef.current.clearHighlights(); } catch (e) {}
      }
      setFen(targetFen);

      // Highlight the move if we have UCI
      if (uci && uci.length >= 4) {
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        setHighlightSquares([from, to]);
        if (chessBoardRef.current) {
          try { chessBoardRef.current.highlightMove(from, to); } catch (e) {}
        }
      } else {
        setHighlightSquares([]);
      }

      // As a robust fallback, also schedule an async update to the board in case immediate ref calls
      // didn't take effect due to event ordering. This often fixes UI racy behavior.
      try {
        setTimeout(() => {
          if (!chessBoardRef.current) return;
          try { chessBoardRef.current.loadPosition(targetFen); } catch (e) {}
          try { chessBoardRef.current.setPosition(targetFen); } catch (e) {}
          if (uci && uci.length >= 4) {
            const from = uci.slice(0, 2);
            const to = uci.slice(2, 4);
            try { chessBoardRef.current.highlightMove(from, to); } catch (e) {}
          } else {
            try { chessBoardRef.current.clearHighlights(); } catch (e) {}
          }
        }, 50);
      } catch (e) {}

      // Trim histories so the app reflects continuing from this ply
      try {
        setFenHistory(prev => prev.slice(0, plyIndex + 2));
        setUciHistoryArr(prev => prev.slice(0, plyIndex + 1));
        setMoveHistory(prev => prev.slice(0, plyIndex + 1));
      } catch (e) {}

      // Set tutor context and nudge analysis
      const fenBefore = fenHistory[plyIndex] ?? undefined;
      const uciHistoryStr = uciHistoryArr.slice(0, plyIndex + 1).join(' ');
      setLastMoveData({ fenBefore, fenAfter: targetFen, moveUci: uci, uciHistory: uciHistoryStr });
      setTutorTrigger(t => t + 1);

      // Notify server of the updated FEN so remote engine state stays in sync
      try { if (socketRef.current) socketRef.current.emit('update-fen', { fen: targetFen }); } catch (e) {}

      try {
        const boardFen = chessBoardRef.current ? (() => { try { return chessBoardRef.current.getFen(); } catch (e) { return 'n/a'; } })() : 'ref null';
        setNavDebug(`gotoPly ${plyIndex} -> targetFen(${String(targetFen).slice(0,20)}) boardFen(${String(boardFen).slice(0,20)}) uci=${uci} fenHistory=${fenHistory.length} uciHistory=${uciHistoryArr.length}`);
      } catch (e) {}
    } catch (e) { console.error('gotoPly failed', e); }
  }, [fenHistory, uciHistoryArr, moveHistory]);

  // Fast path navigation: use stored fenHistory when available (fenHistory[0] is start, fenHistory[ply+1] is position after ply)
  const gotoPlySimple = useCallback((plyIndex: number) => {
    try {
      const targetFen = fenHistory[plyIndex + 1];
      if (!targetFen) {
        // fallback to the more robust gotoPly if stored fen isn't available
        gotoPly(plyIndex);
        return;
      }
      if (chessBoardRef.current) {
        try { chessBoardRef.current.loadPosition(targetFen); } catch (e) {}
        try { chessBoardRef.current.setPosition(targetFen); } catch (e) {}
        try { chessBoardRef.current.clearHighlights(); } catch (e) {}
      }
      setFen(targetFen);
      // set highlight if available in uciHistoryArr
      const uci = uciHistoryArr[plyIndex];
      if (uci && uci.length >= 4) {
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        setHighlightSquares([from, to]);
        if (chessBoardRef.current) try { chessBoardRef.current.highlightMove(from, to); } catch (e) {}
      } else {
        setHighlightSquares([]);
      }
      // set tutor context
      const fenBefore = fenHistory[plyIndex] ?? undefined;
      const uciHistoryStr = uciHistoryArr.slice(0, plyIndex + 1).join(' ');
      setLastMoveData({ fenBefore, fenAfter: targetFen, moveUci: uciHistoryArr[plyIndex], uciHistory: uciHistoryStr });
      setTutorTrigger(t => t + 1);
      try { setNavDebug(`gotoPlySimple ${plyIndex} -> ${String(targetFen).slice(0,20)}`); } catch (e) {}
    } catch (e) { console.error('gotoPlySimple failed', e); }
  }, [fenHistory, uciHistoryArr, gotoPly]);

  // shared handler to jump to a FEN and optionally highlight a move; used by the tutor and move-history UI
  const handleGotoFen = useCallback((targetFen: string, highlights?: string[] | null) => {
    try {
      if (!targetFen) return;
      // Update board immediately via ref
      if (chessBoardRef.current) {
        try { chessBoardRef.current.loadPosition(targetFen); } catch (e) {}
        try { chessBoardRef.current.setPosition(targetFen); } catch (e) {}
        try { chessBoardRef.current.clearHighlights(); } catch (e) {}
        if (highlights && highlights.length === 2) {
          try { chessBoardRef.current.highlightMove(highlights[0], highlights[1]); } catch (e) {}
        }
      }
      // update local state
      setFen(targetFen);
      setHighlightSquares(highlights || []);
      // set tutor context so the tutor can analyze this position if visible
      try {
        // attempt to find a corresponding ply index and set lastMoveData so tutor shows related info
        const plyIndex = fenHistory.findIndex(f => f === targetFen);
        const uci = plyIndex >= 0 ? uciHistoryArr[plyIndex - 1] : undefined; // fenHistory[0] is start
        const fenBefore = plyIndex > 0 ? fenHistory[plyIndex - 1] : undefined;
        const uciHistoryStr = uciHistoryArr.slice(0, Math.max(0, plyIndex)).join(' ');
        setLastMoveData({ fenBefore, fenAfter: targetFen, moveUci: uci, uciHistory: uciHistoryStr });
        // nudge tutor to react to the new context
        setTutorTrigger(t => t + 1);
      } catch (e) {}
    } catch (e) { console.error('handleGotoFen failed', e); }
  }, [fenHistory, uciHistoryArr]);

  // Click handler used by move buttons: navigate and then capture resulting board FEN for debug/UI
  const handleHistoryClick = useCallback((plyIndex: number) => {
    try {
      // Prefer jumping to after the opponent's reply so the user can continue from that branch.
      const hasOpponent = moveHistory.length > plyIndex + 1;
      const target = hasOpponent ? plyIndex + 1 : plyIndex;
      gotoPlySimple(target);
      // After a short delay allow the board to update then reflect internal fen in navDebug/UI
      setTimeout(() => {
        try {
          const boardFen = chessBoardRef.current ? (() => { try { return chessBoardRef.current.getFen(); } catch (e) { return 'n/a'; } })() : 'ref null';
          setNavDebug(`clicked ply ${plyIndex}; parentFen=${fen} boardFen=${boardFen}`);
        } catch (e) {}
      }, 120);
    } catch (e) { console.error('handleHistoryClick failed', e); }
  }, [gotoPlySimple, fen]);

  return (
    <div className={styles.playComputerContainer}>
      <div className={styles.header}><h1>Play vs Computer (with Tutor)</h1></div>

      {showSettings ? (
        <div className={styles.settingsPanel}>
          <h2>Game Settings</h2>
          <div className={styles.setting}>
            <label>Play as</label>
            <div className={styles.colorButtons}>
              <button className={playerColor === 'white' ? styles.active : ''} onClick={() => setPlayerColor('white')}>White</button>
              <button className={playerColor === 'black' ? styles.active : ''} onClick={() => setPlayerColor('black')}>Black</button>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
              <div>fenHistory: {fenHistory.length} entries; uciHistory: {uciHistoryArr.length} entries</div>
              {navDebug && (<div style={{ marginTop: 6 }}>{navDebug}</div>)}
            </div>
          </div>
          <div className={styles.setting}>
            <label>Difficulty</label>
            <div className={styles.difficultyButtons}>
              <button className={difficulty === 1 ? styles.active : ''} onClick={() => setDifficulty(1)}>Easy</button>
              <button className={difficulty === 5 ? styles.active : ''} onClick={() => setDifficulty(5)}>Medium</button>
              <button className={difficulty === 10 ? styles.active : ''} onClick={() => setDifficulty(10)}>Hard</button>
              <button className={difficulty === 15 ? styles.active : ''} onClick={() => setDifficulty(15)}>Expert</button>
              <button className={difficulty === 20 ? styles.active : ''} onClick={() => setDifficulty(20)}>Master</button>
            </div>
          </div>
          <button className={styles.startButton} onClick={startSession} disabled={!connected}>{connected ? 'Start Game' : 'Connecting...'}</button>
        </div>
      ) : (
        <>
          <div className={styles.controls}>
            <button onClick={undoMove} disabled={moveHistory.length < 2 || isThinking}>Undo</button>
            <button onClick={resetGame} disabled={isThinking}>Reset</button>
            <button onClick={newGame}>New Game</button>
            <button onClick={() => chessBoardRef.current?.flip()}>Flip Board</button>
          </div>

          {/* Simple connection/status panel to aid debugging when opponent doesn't move */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 13 }}>Socket: <strong>{connected ? 'Connected' : 'Disconnected'}</strong></div>
            <div style={{ fontSize: 13 }}>Session: <strong>{sessionStarted ? 'Started' : 'Stopped'}</strong></div>
            <div style={{ fontSize: 13 }}>Engine: <strong>{isThinking ? 'Thinking...' : 'Idle'}</strong></div>
            <button onClick={() => {
              // attempt a lightweight reconnect
              try {
                if (socketRef.current && socketRef.current.disconnect) socketRef.current.disconnect();
              } catch (e) {}
              try { socketRef.current = io(environment.urls.stockfishServerURL, { transports: ['websocket'], reconnection: true }); } catch (e) { console.error('Reconnect failed', e); }
            }}>Reconnect</button>
          </div>

          <div className={styles.statusBarFixed}>{gameStatus && (<div className={`${styles.statusMessage} ${styles.check}`}>{gameStatus}</div>)}</div>

          <div className={styles.chessAndTutor} style={{ display: 'flex', gap: 12 }}>
            <div className={styles.chessboardContainer}>
              <ChessBoard mode="engine" ref={chessBoardRef} fen={fen} orientation={playerColor} highlightSquares={highlightSquares} onMove={handleMove} disabled={isThinking || gameStatus.includes('wins') || gameStatus === 'Draw!'} />
            </div>

            <div className={styles.tutorWrapper} style={{ width: 360 }}>
              <div style={{ marginBottom: 8 }}>
                <label><input type="checkbox" checked={tutorEnabled} onChange={(e) => setTutorEnabled(e.target.checked)} /> Show Tutor</label>
              </div>
              <StockfishTutor
                enabled={tutorEnabled}
                trigger={tutorTrigger}
                fenBefore={lastMoveData.fenBefore}
                fenAfter={lastMoveData.fenAfter}
                moveUci={lastMoveData.moveUci}
                uciHistory={lastMoveData.uciHistory}
                onRequestGotoFen={(fen: string, highlights?: string[] | null) => handleGotoFen(fen, highlights)}
              />
            </div>
          </div>

          <div style={{ marginTop: 8, fontSize: 12, color: '#333' }}>
            <div>Parent fen prop: {fen}</div>
            <div>ChessBoard internal fen: {chessBoardRef.current ? (() => { try { return chessBoardRef.current.getFen(); } catch (e) { return 'n/a'; } })() : 'ref null'}</div>
          </div>

          <div className={styles.moveHistory}>
            <h3>Move History</h3>
            <div className={styles.moves} ref={movesContainerRef}>
              {moveHistory.reduce((acc: JSX.Element[], move, idx) => {
                const moveNumber = Math.floor(idx / 2) + 1; const isWhiteMove = idx % 2 === 0;
                if (isWhiteMove) {
                  acc.push(
                    <div key={idx} className={styles.movePair}>
                      <span className={styles.moveNumber}>{moveNumber}.</span>
                      <button type="button" draggable={false} aria-label={`Jump to move ${moveNumber} white`} className={styles.whiteMove} onMouseDown={() => handleHistoryClick(idx)} onClick={() => handleHistoryClick(idx)}>{move}</button>
                      {/* View: prefer the position after opponent's reply (fenHistory[idx+2]) if it exists, otherwise fenHistory[idx+1] */}
                      <button type="button" draggable={false} className={styles.viewButton} onClick={() => {
                        const fenAfterOpponent = fenHistory[idx + 2];
                        const fenAfter = fenAfterOpponent || fenHistory[idx + 1];
                        // If we have fenAfter, try to highlight the last UCI (opponent move if present)
                        const uciIndex = fenAfterOpponent ? idx + 1 : idx;
                        handleGotoFen(fenAfter, uciHistoryArr[uciIndex] && uciHistoryArr[uciIndex].length >= 4 ? [uciHistoryArr[uciIndex].slice(0,2), uciHistoryArr[uciIndex].slice(2,4)] : undefined);
                      }}>View</button>
                      {moveHistory[idx + 1] && (
                        <>
                          <button type="button" draggable={false} aria-label={`Jump to move ${moveNumber} black`} className={styles.blackMove} onMouseDown={() => handleHistoryClick(idx + 1)} onClick={() => handleHistoryClick(idx + 1)}>{moveHistory[idx + 1]}</button>
                          <button type="button" draggable={false} className={styles.viewButton} onClick={() => {
                            const fenAfterB = fenHistory[idx + 2] || fenHistory[idx + 1];
                            const uciIdxB = fenHistory[idx + 2] ? idx + 1 : idx;
                            handleGotoFen(fenAfterB, uciHistoryArr[uciIdxB] && uciHistoryArr[uciIdxB].length >= 4 ? [uciHistoryArr[uciIdxB].slice(0,2), uciHistoryArr[uciIdxB].slice(2,4)] : undefined);
                          }}>View</button>
                        </>
                      )}
                    </div>
                  );
                }
                return acc;
              }, [])}
            </div>
          </div>
        </>
      )}

      {showGameEndModal && (
        <div className={styles.modalOverlay} onClick={() => setShowGameEndModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{gameEndMessage}</h2>
            <div className={styles.modalButtons}>
              <button onClick={() => { setShowGameEndModal(false); newGame(); }} className={styles.primaryButton}>New Game</button>
              <button onClick={() => setShowGameEndModal(false)} className={styles.secondaryButton}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayComputerWithTutor;

