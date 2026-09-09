import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router';
import { Chess as ChessClass } from 'chess.js';
import { io } from 'socket.io-client';
import { Move } from '../../core/types/chess';
import ChessBoard, { ChessBoardRef } from '../../components/ChessBoard/ChessBoard';
import { environment } from '../../environments/environment';
import { cn } from '../../core/utils/cn';
import StockfishTutor from './StockfishTutor';

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
  const location = useLocation();
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
  // When the user navigates while a game is active, end session and reset to settings
  useEffect(() => {
    if (!sessionStartedRef.current) return;
    try { socketRef.current?.emit('end-session'); } catch (e) {}
    try { gameRef.current.reset(); } catch (e) {}
    try { setFen(gameRef.current.fen()); } catch (e) {}
    try { setMoveHistory([]); setHighlightSquares([]); setIsThinking(false); } catch (e) {}
    try { if (chessBoardRef.current) chessBoardRef.current.reset(); } catch (e) {}
    setShowSettings(true);
    setSessionStarted(false);
    sessionStartedRef.current = false;
  }, [location.key]);

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

    socket.on('session-error', ({ error }: any) => {
      console.error('PlayComputerWithTutor: session-error', error);
      alert('Failed to start session: ' + error);
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
            // check for game end after applying the computer move
            try { checkGameStatus(); } catch (e) { /* ignore */ }
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
      const currentMoveUci = `${move.from}${move.to}${move.promotion ?? ''}`;
      // Build the new UCI history array and store it so we can pass a correct uciHistory string to the tutor
      const newUciArr = [...uciHistoryArr, currentMoveUci];
      setFenHistory(prev => [...prev, newFen]);
      setUciHistoryArr(newUciArr);

      // trigger tutor analysis with fen before/after and uci; pass a proper UCI-history string
      const uciHistory = newUciArr.join(' ');
      setLastMoveData({ fenBefore, fenAfter: newFen, moveUci: currentMoveUci, uciHistory });
      setTutorTrigger(t => t + 1);

      if (checkGameStatus()) return;

      if (socketRef.current) {
        socketRef.current.emit('update-fen', { fen: newFen });
        requestComputerMove(newFen);
      }
    } catch (error) { console.error('Error handling move:', error); }
  }, [moveHistory, requestComputerMove, uciHistoryArr]);

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
    <div className="flex min-h-[calc(100vh-100px)] w-full flex-col items-center justify-center bg-[#e2f0d9] px-4 py-10 font-sans">
      <div className="mb-4 text-2xl font-extrabold text-[#1F1F1F]">Play vs Computer (with Tutor)</div>

      {showSettings ? (
        <div className="w-full max-w-[520px] rounded-[24px] border-[3px] border-[#1F1F1F] bg-white p-10 shadow-[6px_6px_0_rgba(31,31,31,0.15)]">
          <h2 className="mb-6 text-center text-2xl font-extrabold text-[#1F1F1F]">Game Settings</h2>
          <div className="mb-6 w-full">
            <label className="mb-3 block text-[16px] font-bold uppercase tracking-[0.5px] text-slate-600">Play as</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={cn('rounded-2xl border-[3px] border-[#1F1F1F] outline outline-[3px] outline-[#1F1F1F] bg-white px-4 py-4 text-lg font-extrabold text-[#1F1F1F] transition-all hover:-translate-y-0.5', playerColor === 'white' && 'border-[#7FCC26] outline-[#7FCC26]')}
                onClick={() => setPlayerColor('white')}
              >
                White
              </button>
              <button
                className={cn('rounded-2xl border-[3px] border-[#1F1F1F] outline outline-[3px] outline-[#1F1F1F] bg-[#1F1F1F] px-4 py-4 text-lg font-extrabold text-white transition-all hover:-translate-y-0.5', playerColor === 'black' && 'border-[#7FCC26] outline-[#7FCC26]')}
                onClick={() => setPlayerColor('black')}
              >
                Black
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              <div>fenHistory: {fenHistory.length} entries; uciHistory: {uciHistoryArr.length} entries</div>
              {navDebug && <div className="mt-1">{navDebug}</div>}
            </div>
          </div>
          <div className="mb-6 w-full">
            <label className="mb-3 block text-[16px] font-bold uppercase tracking-[0.5px] text-slate-600">Difficulty</label>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {[1,5,10,15,20].map((value) => (
                <button
                  key={value}
                  className={cn('rounded-xl border-[2px] border-[#1F1F1F] outline outline-2 outline-[#1F1F1F] bg-white px-2 py-3 text-sm font-bold text-[#1F1F1F] transition-all hover:-translate-y-0.5', difficulty === value && 'bg-[#7FCC26]')}
                  onClick={() => setDifficulty(value as Difficulty)}
                >
                  {value === 1 ? 'Easy' : value === 5 ? 'Medium' : value === 10 ? 'Hard' : value === 15 ? 'Expert' : 'Master'}
                </button>
              ))}
            </div>
          </div>
          <button className="mt-2 w-full rounded-2xl border-[3px] border-[#1F1F1F] bg-[#7FCC26] px-0 py-4 text-[20px] font-extrabold text-[#1F1F1F] shadow-[4px_4px_0_#1F1F1F] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1F1F1F] disabled:cursor-not-allowed disabled:opacity-50" onClick={startSession} disabled={!connected}>{connected ? 'Start Game' : 'Connecting...'}</button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
            <button className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-[#1F1F1F] shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40" onClick={undoMove} disabled={moveHistory.length < 2 || isThinking}>Undo</button>
            <button className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-[#1F1F1F] shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40" onClick={resetGame} disabled={isThinking}>Reset</button>
            <button className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-[#1F1F1F] shadow-sm transition hover:-translate-y-0.5" onClick={newGame}>New Game</button>
            <button className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-[#1F1F1F] shadow-sm transition hover:-translate-y-0.5" onClick={() => chessBoardRef.current?.flip()}>Flip Board</button>
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <div>Socket: <strong>{connected ? 'Connected' : 'Disconnected'}</strong></div>
            <div>Session: <strong>{sessionStarted ? 'Started' : 'Stopped'}</strong></div>
            <div>Engine: <strong>{isThinking ? 'Thinking...' : 'Idle'}</strong></div>
            <button className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-[#1F1F1F]" onClick={() => { try { if (socketRef.current && socketRef.current.disconnect) socketRef.current.disconnect(); } catch (e) {} try { socketRef.current = io(environment.urls.stockfishServerURL, { transports: ['websocket'], reconnection: true }); } catch (e) { console.error('Reconnect failed', e); } }}>Reconnect</button>
          </div>

          {gameStatus && <div className="mb-3 w-full max-w-[800px] rounded-lg border-[1.5px] border-[#FC8181] bg-[#FFF5F5] px-3 py-2 text-center text-sm font-bold text-[#C53030]">{gameStatus}</div>}

          <div className="flex w-full max-w-[1200px] flex-wrap items-start justify-center gap-4">
            <div className="min-w-0 flex-1 rounded-[20px] border-2 border-[#1F1F1F] bg-white p-3">
              <ChessBoard mode="engine" ref={chessBoardRef} fen={fen} orientation={playerColor} highlightSquares={highlightSquares} onMove={handleMove} disabled={isThinking || gameStatus.includes('wins') || gameStatus === 'Draw!'} />
            </div>

            <div className="w-[360px] max-w-full rounded-[20px] border-2 border-[#1F1F1F] bg-white p-4">
              <div className="mb-2 text-sm font-bold text-slate-700">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={tutorEnabled} onChange={(e) => setTutorEnabled(e.target.checked)} /> Show Tutor</label>
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

          <div className="mt-4 text-[12px] text-slate-700">
            <div>Parent fen prop: {fen}</div>
            <div>ChessBoard internal fen: {chessBoardRef.current ? (() => { try { return chessBoardRef.current.getFen(); } catch (e) { return 'n/a'; } })() : 'ref null'}</div>
          </div>

          <div className="mt-4 w-full max-w-[1200px] rounded-[20px] border-2 border-[#1F1F1F] bg-white p-4">
            <h3 className="mb-3 text-lg font-extrabold text-[#1F1F1F]">Move History</h3>
            <div className="flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1.5" ref={movesContainerRef}>
              {moveHistory.reduce((acc: JSX.Element[], move, idx) => {
                const moveNumber = Math.floor(idx / 2) + 1; const isWhiteMove = idx % 2 === 0;
                if (isWhiteMove) {
                  acc.push(
                    <div key={idx} className="grid grid-cols-[32px_1fr_1fr_1fr] items-center gap-2">
                      <span className="text-right text-[13px] font-extrabold text-[#7FCC26]">{moveNumber}.</span>
                      <button type="button" draggable={false} aria-label={`Jump to move ${moveNumber} white`} className="rounded-lg border border-[#1F1F1F] bg-white px-3 py-1.5 font-mono text-[13px] font-bold text-[#1F1F1F] transition-all hover:-translate-y-0.5" onMouseDown={() => handleHistoryClick(idx)} onClick={() => handleHistoryClick(idx)}>{move}</button>
                      <button type="button" draggable={false} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-bold text-[#1F1F1F]" onClick={() => {
                        const fenAfterOpponent = fenHistory[idx + 2];
                        const fenAfter = fenAfterOpponent || fenHistory[idx + 1];
                        const uciIndex = fenAfterOpponent ? idx + 1 : idx;
                        handleGotoFen(fenAfter, uciHistoryArr[uciIndex] && uciHistoryArr[uciIndex].length >= 4 ? [uciHistoryArr[uciIndex].slice(0,2), uciHistoryArr[uciIndex].slice(2,4)] : undefined);
                      }}>View</button>
                      {moveHistory[idx + 1] && (
                        <>
                          <button type="button" draggable={false} aria-label={`Jump to move ${moveNumber} black`} className="rounded-lg border border-[#1F1F1F] bg-[#1F1F1F] px-3 py-1.5 font-mono text-[13px] font-bold text-white transition-all hover:-translate-y-0.5" onMouseDown={() => handleHistoryClick(idx + 1)} onClick={() => handleHistoryClick(idx + 1)}>{moveHistory[idx + 1]}</button>
                          <button type="button" draggable={false} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-bold text-[#1F1F1F]" onClick={() => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1F1F]/40 p-4 backdrop-blur-sm" onClick={() => setShowGameEndModal(false)}>
          <div className="w-full max-w-[380px] rounded-[24px] border-[3px] border-[#1F1F1F] bg-white p-10 text-center shadow-[8px_8px_0_#1F1F1F]" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-6 text-[24px] font-black text-[#1F1F1F]">{gameEndMessage}</h2>
            <div className="flex gap-3">
              <button className="flex-1 rounded-xl border-2 border-[#1F1F1F] bg-[#7FCC26] px-0 py-3 font-extrabold text-[#1F1F1F] shadow-[2px_2px_0_#1F1F1F] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1F1F1F]" onClick={() => { setShowGameEndModal(false); newGame(); }}>New Game</button>
              <button className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-0 py-3 font-bold text-slate-600 transition-all hover:border-[#1F1F1F] hover:text-[#1F1F1F]" onClick={() => setShowGameEndModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayComputerWithTutor;
