import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { io, Socket } from 'socket.io-client';
import { Move } from '../../core/types/chess';
import ChessBoard, { ChessBoardRef } from '../../components/ChessBoard/ChessBoard';
import { environment } from "../../environments/environment";

type Difficulty = 1 | 5 | 10 | 15 | 20;

const controlBtnClass =
  "bg-light border-solid border-dark text-dark font-semibold px-5 py-2 rounded-xl " +
  "transition-all duration-200 enabled:hover:text-white enabled:hover:border-primary enabled:hover:bg-primary " +
  "enabled:hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed";

const PlayComputer: React.FC = () => {
  const chessBoardRef = useRef<ChessBoardRef>(null);
  const socketRef = useRef<Socket | null>(null);
  const gameRef = useRef<Chess>(new Chess());
  const playerColorRef = useRef<'white' | 'black'>('white');
  const sessionStartedRef = useRef<boolean>(false);
  const difficultyRef = useRef<Difficulty>(10);
  const movesContainerRef = useRef<HTMLDivElement>(null);

  const [fen, setFen] = useState<string>("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [difficulty, setDifficulty] = useState<Difficulty>(10);
  const [isThinking, setIsThinking] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<string>("");
  const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(true);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [gameEndMessage, setGameEndMessage] = useState('');

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
    socketRef.current.emit('evaluate-fen', {
      fen: currentFen,
      move: '',
      level: difficultyRef.current,
    });
  }, []);

  useEffect(() => {
    const socket = io(environment.urls.stockfishServerURL, {
      transports: ['websocket'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => {
      setConnected(false);
      setSessionStarted(false);
      sessionStartedRef.current = false;
    });
    socket.on('session-started', ({ success }) => {
      setSessionStarted(true);
      sessionStartedRef.current = true;
      if (success && playerColorRef.current === 'black') {
        requestComputerMove(gameRef.current.fen());
      }
    });
    socket.on('session-error', ({ error }) => {
      console.error('Session error:', error);
      alert('Failed to start session: ' + error);
    });
    socket.on('evaluation-complete', ({ mode, move }) => {
      if (mode === 'move' && move) {
        try {
          const moveResult = gameRef.current.move(move);
          if (moveResult) {
            const updatedFen = gameRef.current.fen();
            setFen(updatedFen);
            setHighlightSquares([moveResult.from, moveResult.to]);
            setMoveHistory(prev => [...prev, `${moveResult.from} -> ${moveResult.to}`]);
            if (chessBoardRef.current) {
              chessBoardRef.current.setPosition(updatedFen);
              chessBoardRef.current.highlightMove(moveResult.from, moveResult.to);
            }
            checkGameStatus();
          }
        } catch (err) {
          console.error('Failed to apply computer move:', err);
        }
        setIsThinking(false);
      }
    });
    socket.on('evaluation-error', ({ error }) => {
      console.error('Evaluation error:', error);
      setIsThinking(false);
      alert('Engine error: ' + error);
    });

    return () => { socket.disconnect(); };
  }, [requestComputerMove]);

  const startSession = useCallback(() => {
    if (!connected || !socketRef.current) {
      alert('Not connected to server');
      return;
    }
    socketRef.current.emit('start-session', {
      sessionType: 'player-vs-computer',
      fen: gameRef.current.fen(),
    });
    setShowSettings(false);
  }, [connected]);

  const handleMove = useCallback((move: Move) => {
    try {
      const moveResult = gameRef.current.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      if (!moveResult) return;

      const newFen = gameRef.current.fen();
      setFen(newFen);
      setHighlightSquares([move.from, move.to]);
      setMoveHistory(prev => [...prev, `${move.from} -> ${move.to}`]);

      if (checkGameStatus()) return;

      if (socketRef.current) {
        socketRef.current.emit('update-fen', { fen: newFen });
        requestComputerMove(newFen);
      }
    } catch (error) {
      console.error('Error handling move:', error);
    }
  }, [requestComputerMove]);

  const checkGameStatus = useCallback((): boolean => {
    const game = gameRef.current;
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? 'Black' : 'White';
      setGameEndMessage(`Checkmate! ${winner} wins!`);
      setShowGameEndModal(true);
      return true;
    }
    if (game.isDraw() || game.isStalemate()) {
      setGameEndMessage(game.isStalemate() ? 'Stalemate! Draw!' : 'Game over: Draw!');
      setShowGameEndModal(true);
      return true;
    }
    if (game.isThreefoldRepetition()) {
      setGameEndMessage('Draw by threefold repetition!');
      setShowGameEndModal(true);
      return true;
    }
    if (game.isInsufficientMaterial()) {
      setGameEndMessage('Draw by insufficient material!');
      setShowGameEndModal(true);
      return true;
    }
    if (game.isCheck()) {
      const side = game.turn() === 'w' ? 'White' : 'Black';
      setGameStatus(`${side} is in Check!`);
      setTimeout(() => setGameStatus(''), 5000);
    } else {
      setGameStatus('');
    }
    return false;
  }, []);

  const resetGame = useCallback(() => {
    gameRef.current.reset();
    const startFen = gameRef.current.fen();
    setFen(startFen);
    setMoveHistory([]);
    setHighlightSquares([]);
    setGameStatus('');
    setIsThinking(false);
    if (chessBoardRef.current) chessBoardRef.current.reset();
    if (socketRef.current && sessionStartedRef.current) {
      socketRef.current.emit('update-fen', { fen: startFen });
      if (playerColorRef.current === 'black') {
        setTimeout(() => requestComputerMove(startFen), 500);
      }
    }
  }, [requestComputerMove]);

  const newGame = useCallback(() => {
    if (socketRef.current && sessionStartedRef.current) {
      socketRef.current.emit('end-session');
    }
    resetGame();
    setShowSettings(true);
    setSessionStarted(false);
    sessionStartedRef.current = false;
  }, [resetGame]);

  const undoMove = useCallback(() => {
    if (moveHistory.length < 2) return;
    gameRef.current.undo();
    gameRef.current.undo();
    const newFen = gameRef.current.fen();
    setFen(newFen);
    setMoveHistory(prev => prev.slice(0, -2));
    setHighlightSquares([]);
    setGameStatus('');
    if (chessBoardRef.current) chessBoardRef.current.setPosition(newFen);
    if (socketRef.current) socketRef.current.emit('update-fen', { fen: newFen });
  }, [moveHistory.length]);

  const difficulties: { label: string; value: Difficulty }[] = [
    { label: 'Easy', value: 1 },
    { label: 'Medium', value: 5 },
    { label: 'Hard', value: 10 },
    { label: 'Expert', value: 15 },
    { label: 'Master', value: 20 },
  ];

  return (
    <div className="flex flex-col items-center mt-8 px-4 py-8 bg-soft">

      <h1 className="text-3xl font-bold text-dark mb-8 text-center">Play vs Computer</h1>

      {showSettings ? (
        /* ── Settings card ── */
        <div className="bg-light border-2 border-dark rounded-2xl shadow-md p-10 flex flex-col items-center w-full max-w-lg">
          <h2 className="text-2xl font-bold text-dark mb-8 text-center">Game Settings</h2>

          {/* Play as */}
          <div className="w-full">
            <label className="block mb-3 font-semibold text-lg text-muted">Play as</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`py-5 font-semibold text-lg rounded-xl border-solid bg-white text-dark
                  transition-all duration-200 hover:-translate-y-0.5
                  ${playerColor === 'white' ? 'border-primary shadow-md scale-[1.02]' : 'border-borderLight'}`}
                onClick={() => setPlayerColor('white')}
              >
                White
              </button>
              <button
                className={`py-5 font-semibold text-lg rounded-xl border-solid bg-dark text-light
                  transition-all duration-200 hover:-translate-y-0.5
                  ${playerColor === 'black' ? 'border-primary shadow-md scale-[1.02]' : 'border-borderLight'}`}
                onClick={() => setPlayerColor('black')}
              >
                Black
              </button>
            </div>
          </div>

          {/* Difficulty */}
          <div className="w-full mt-6">
            <label className="block mb-3 font-semibold text-lg text-muted">Difficulty</label>
            <div className="grid grid-cols-3 gap-3 w-full">
              {difficulties.slice(0, 3).map(({ label, value }) => (
                <button
                  key={value}
                  className={`py-3 rounded-xl border-solid font-semibold
                    transition-all duration-200 hover:-translate-y-0.5
                    ${difficulty === value
                      ? 'bg-primary text-light border-primary'
                      : 'bg-white text-dark border-borderLight hover:border-primary'}`}
                  onClick={() => setDifficulty(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 w-full mt-3">
              {difficulties.slice(3).map(({ label, value }) => (
                <button
                  key={value}
                  className={`py-3 rounded-xl border-solid font-semibold
                    transition-all duration-200 hover:-translate-y-0.5
                    ${difficulty === value
                      ? 'bg-primary text-light border-primary'
                      : 'bg-white text-dark border-borderLight hover:border-primary'}`}
                  onClick={() => setDifficulty(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>


          <button className="btn-green w-full mt-8 mb-4" onClick={startSession} disabled={!connected}>
            {connected ? 'Start Game' : 'Connecting...'}
          </button>
        </div>
      ) : (
        <>
          {/* ── Game controls ── */}
          <div className="flex gap-3 mb-6 flex-wrap justify-center">
            <button className={controlBtnClass} onClick={undoMove} disabled={moveHistory.length < 2 || isThinking}>
              Undo
            </button>
            <button className={controlBtnClass} onClick={resetGame} disabled={isThinking}>
              Reset
            </button>
            <button className={controlBtnClass} onClick={newGame}>
              New Game
            </button>
            <button className={controlBtnClass} onClick={() => chessBoardRef.current?.flip()}>
              Flip Board
            </button>
          </div>

          {/* ── Check status banner ── */}
          <div className="w-full max-w-xl h-16 flex items-center justify-center mb-4">
            {gameStatus && (
              <div className="text-red bg-red/10 border-solid border-red px-6 py-2 rounded-xl font-semibold text-lg animate-shake">
                {gameStatus}
              </div>
            )}
          </div>

          {/* ── Chessboard ── */}
          <div className="mb-8 shadow-xl rounded-lg overflow-hidden">
            <ChessBoard
              mode="engine"
              ref={chessBoardRef}
              fen={fen}
              orientation={playerColor}
              highlightSquares={highlightSquares}
              onMove={handleMove}
              disabled={isThinking || gameStatus.includes('wins') || gameStatus === 'Draw!'}
            />
          </div>

          {/* ── Move history ── */}
          <div className="bg-light border-solid border-borderLight rounded-2xl p-6 w-full max-w-xl">
            <h3 className="font-bold text-dark text-lg border-b border-borderLight pb-2 mb-3">
              Move History
            </h3>
            <div
              ref={movesContainerRef}
              className="flex flex-col gap-1 max-h-48 overflow-y-auto activity-scrollbar"
            >
              {moveHistory.reduce((acc: JSX.Element[], move, idx) => {
                if (idx % 2 === 0) {
                  const moveNumber = Math.floor(idx / 2) + 1;
                  acc.push(
                    <div
                      key={idx}
                      className="grid grid-cols-[40px_1fr_1fr] gap-2 px-3 py-2 rounded-lg border border-borderLight items-center hover:border-primary transition-colors duration-150"
                    >
                      <span className="text-primary font-bold text-right text-sm">{moveNumber}.</span>
                      <span className="bg-white text-dark border-solid border-borderLight px-3 py-1 rounded font-mono text-sm">
                        {move}
                      </span>
                      {moveHistory[idx + 1] && (
                        <span className="bg-dark text-light border-solid border-gray px-3 py-1 rounded font-mono text-sm">
                          {moveHistory[idx + 1]}
                        </span>
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

      {/* ── Game end modal ── */}
      {showGameEndModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/50"
          onClick={() => setShowGameEndModal(false)}
        >
          <div
            className="bg-light w-full max-w-sm rounded-2xl border-solid border-primary shadow-xl p-10 text-center animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-dark mb-8">{gameEndMessage}</h2>
            <div className="flex gap-3">
              <button
                className="btn-green flex-1"
                onClick={() => { setShowGameEndModal(false); newGame(); }}
              >
                New Game
              </button>
              <button
                className="flex-1 py-3 px-4 rounded-xl border-solid border-borderLight font-semibold text-gray hover:border-dark hover:text-dark transition-colors duration-200"
                onClick={() => setShowGameEndModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayComputer;
