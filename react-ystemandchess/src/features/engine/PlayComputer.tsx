import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { io, Socket } from 'socket.io-client';
import { Move } from '../../core/types/chess';
import ChessBoard, { ChessBoardRef } from '../../components/ChessBoard/ChessBoard';
import { environment } from "../../environments/environment";
import styles from './PlayComputer.module.scss';

type Difficulty = 1 | 5 | 10 | 15 | 20;

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

  // Update refs whenever state changes
  useEffect(() => {
    playerColorRef.current = playerColor;
  }, [playerColor]);

  useEffect(() => {
    sessionStartedRef.current = sessionStarted;
  }, [sessionStarted]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

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

  // Initialize socket connection
  useEffect(() => {
    const socket = io(environment.urls.stockfishServerURL, {
      transports: ['websocket'],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

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

    socket.on('evaluation-complete', ({ mode, move, moveDetails, newFEN }) => {
      if (mode === 'move' && move) {
        console.log('Computer move:', move);
        
        // Apply the move to our local game
        try {
          const moveResult = gameRef.current.move(move);
          
          if (moveResult) {
            const updatedFen = gameRef.current.fen();
            setFen(updatedFen);
            setHighlightSquares([moveResult.from, moveResult.to]);
            setMoveHistory(prev => [...prev, `${moveResult.from} -> ${moveResult.to}`]);
            
            // Update chessboard
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

    return () => {
      socket.disconnect();
    };
  }, [requestComputerMove]);

  // Start a new session when settings are confirmed
  const startSession = useCallback(() => {
    if (!connected || !socketRef.current) {
      alert('Not connected to server');
      return;
    }

    const initialFen = gameRef.current.fen();
    
    socketRef.current.emit('start-session', {
      sessionType: 'player-vs-computer',
      fen: initialFen,
    });

    setShowSettings(false);
  }, [connected]);

  // Handle player move
  const handleMove = useCallback((move: Move) => {
    try {
      const moveResult = gameRef.current.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });

      if (!moveResult) {
        console.error('Invalid move');
        return;
      }

      const newFen = gameRef.current.fen();
      setFen(newFen);
      setHighlightSquares([move.from, move.to]);
      setMoveHistory(prev => [...prev, `${move.from} -> ${move.to}`]);

      // Check if game ended
      if (checkGameStatus()) {
        return;
      }

      // Update server FEN and request computer move
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

    if (game.isDraw()) {
      setGameEndMessage('Game over: Draw!');
      setShowGameEndModal(true);
      return true;
    }

    if (game.isStalemate()) {
    setGameEndMessage('Stalemate! Draw!');
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
      const sideInCheck = game.turn() === 'w' ? 'White' : 'Black';
      setGameStatus(`${sideInCheck} is in Check!`);
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

    if (chessBoardRef.current) {
      chessBoardRef.current.reset();
    }

    // Update server
    if (socketRef.current && sessionStartedRef.current) {
      socketRef.current.emit('update-fen', { fen: startFen });
      
      // If player is black, request computer move
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

  // Undo move
  const undoMove = useCallback(() => {
    if (moveHistory.length < 2) return; // Need at least 2 moves (player + computer)

    // Undo computer move
    gameRef.current.undo();
    // Undo player move
    gameRef.current.undo();

    const newFen = gameRef.current.fen();
    setFen(newFen);
    setMoveHistory(prev => prev.slice(0, -2));
    setHighlightSquares([]);
    setGameStatus('');

    if (chessBoardRef.current) {
      chessBoardRef.current.setPosition(newFen);
    }

    // Update server
    if (socketRef.current) {
      socketRef.current.emit('update-fen', { fen: newFen });
    }
  }, [moveHistory.length]);

  return (
    <div className={styles.playComputerContainer}>
      <div className={styles.header}>
        <h1>Play vs Computer</h1>
      </div>

      {showSettings ? (
        <div className={styles.settingsPanel}>
          <h2>Game Settings</h2>
          
          <div className={styles.setting}>
            <label>Play as</label>
            <div className={styles.colorButtons}>
              <button
                className={playerColor === 'white' ? styles.active : ''}
                onClick={() => setPlayerColor('white')}
              >
                White
              </button>
              <button
                className={playerColor === 'black' ? styles.active : ''}
                onClick={() => setPlayerColor('black')}
              >
                Black
              </button>
            </div>
          </div>

          <div className={styles.setting}>
            <label>Difficulty</label>
            <div className={styles.difficultyButtons}>
              <button
                className={difficulty === 1 ? styles.active : ''}
                onClick={() => setDifficulty(1)}
              >
                Easy
              </button>
              <button
                className={difficulty === 5 ? styles.active : ''}
                onClick={() => setDifficulty(5)}
              >
                Medium
              </button>
              <button
                className={difficulty === 10 ? styles.active : ''}
                onClick={() => setDifficulty(10)}
              >
                Hard
              </button>
              <button
                className={difficulty === 15 ? styles.active : ''}
                onClick={() => setDifficulty(15)}
              >
                Expert
              </button>
              <button
                className={difficulty === 20 ? styles.active : ''}
                onClick={() => setDifficulty(20)}
              >
                Master
              </button>
            </div>
          </div>

          <button
            className={styles.startButton}
            onClick={startSession}
            disabled={!connected}
          >
            {connected ? 'Start Game' : 'Connecting...'}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.controls}>
            <button onClick={undoMove} disabled={moveHistory.length < 2 || isThinking}>
              Undo
            </button>
            <button onClick={resetGame} disabled={isThinking}>
              Reset
            </button>
            <button onClick={newGame}>
              New Game
            </button>
            <button onClick={() => chessBoardRef.current?.flip()}>
              Flip Board
            </button>
          </div>

          <div className={styles.statusBarFixed}>
            {gameStatus && (
              <div className={`${styles.statusMessage} ${styles.check}`}>
                {gameStatus}
              </div>
            )}
          </div>

          <div className={styles.chessboardContainer}>
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

          <div className={styles.moveHistory}>
            <h3>Move History</h3>
            <div className={styles.moves} ref={movesContainerRef}>
              {moveHistory.reduce((acc: JSX.Element[], move, idx) => {
                const moveNumber = Math.floor(idx / 2) + 1;
                const isWhiteMove = idx % 2 === 0;
                
                if (isWhiteMove) {
                  acc.push(
                    <div key={idx} className={styles.movePair}>
                      <span className={styles.moveNumber}>{moveNumber}.</span>
                      <span className={styles.whiteMove}>{move}</span>
                      {moveHistory[idx + 1] && (
                        <span className={styles.blackMove}>{moveHistory[idx + 1]}</span>
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
              <button onClick={() => {setShowGameEndModal(false); newGame()}} className={styles.primaryButton}>
                New Game
              </button>
              <button 
                onClick={() => setShowGameEndModal(false)}
                className={styles.secondaryButton}
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
