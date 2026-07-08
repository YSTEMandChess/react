import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { io, Socket } from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router';
import { Move } from '../../core/types/chess';
import ChessBoard, { ChessBoardRef } from '../../components/ChessBoard/ChessBoard';
import { environment } from "../../environments/environment";
import { useSocketChessEngine } from '../lessons/piece-lessons/lesson-overlay/hooks/useSocketChessEngine';
import { useChessSocket } from '../lessons/piece-lessons/lesson-overlay/hooks/useChessSocket';
import type { GameMetaData } from './SelectGame';
import type { User } from './SelectGame';
import { useCookies } from 'react-cookie';
import { SetPermissionLevel } from "../../globals"
//Ideas
//check login validation for if we need to retrieve games 
//change all of this to talk to the server have the server do the retireval  saving and editing of information 
//if someones logged in call thesavestate function otherwise just talk to the server and the server wull delete the socketid game info on disconnect

type Difficulty = 1 | 5 | 10 | 15 | 20;

const controlBtnClass =
  "bg-light border-solid border-dark text-dark font-semibold px-5 py-2 rounded-xl " +
  "transition-all duration-200 enabled:hover:text-white enabled:hover:border-primary enabled:hover:bg-primary " +
  "enabled:hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed";

const PlayComputer: React.FC = () => {
const [isLoggedIn, setIsLoggedIn] = useState<Boolean>(false)
    const [cookies, setCookie, removeCookie] = useCookies(["login"])

    const user = useRef<User>(null)
    const navigate = useNavigate()

  //chessboard, socket, player color, difficulty , sessionstart, movehistory, highlighted sqaures, gamemodal toggle, game end message toggle , fen
  const chessBoardRef = useRef<ChessBoardRef>(null);
  const socketRef = useRef<any | null>(null);
  const gameRef = useRef<Chess>(new Chess());
  const movesContainerRef = useRef<HTMLDivElement>(null);

  const [fen, setFen] = useState<string>("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [difficulty, setDifficulty] = useState<number>(10);
  const location = useLocation();
  const [connected, setConnected] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(true);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [gameEndMessage, setGameEndMessage] = useState('');
  const gameMetaData = useRef<GameMetaData>(null);
  const [yourTurn, setYourTurn]= useState<boolean>(false);



useEffect(() => {
        if (!cookies.login) {
            setIsLoggedIn(false);
            return;
        }
        const verifyAndLoad = async () => {
            try {
                const UInfo = await SetPermissionLevel(cookies, removeCookie);

                if (UInfo?.error) {
                    setIsLoggedIn(false);
                    return;
                }
                setIsLoggedIn(true);
                const { username, firstName, lastName, role, email, id } = UInfo
                user.current = { username, firstName, lastName, role, email, id }

            } catch (err) {
                console.error("Auth check failed:", err);
                setIsLoggedIn(false);
            }
        };
        verifyAndLoad();
        console.log("Logged in")
    }, [cookies.login]);



  useEffect(() => {

    resetGame();
    connectToServer();
    loadGame();
    if (checkGameStatus()) return;
  }, [location.key]);

  useEffect(() => {
    if (movesContainerRef.current) {
      movesContainerRef.current.scrollTop = movesContainerRef.current.scrollHeight;
    }
  }, [moveHistory]);

const connectToServer = () =>{
  const socketSettings = {
      student: gameMetaData.current.user?.firstName || "",
      serverUrl: environment.urls.chessServerURL,
      onMove: onOpponentMove,
      onLastMove : endGame
      
    }
    const socket = useChessSocket(socketSettings)
    socketRef.current = socket;
    setConnected(socketRef.current.connected)
    return true
}

const startGame = () =>{
  connected ? setShowSettings(false) : setShowSettings(true)
}

  const onOpponentMove = (data: { fen: string; move?: Move }) =>{
    if (!yourTurn){
      const moveResult = gameRef.current.move({
        from: data.move.from,
        to: data.move.to,
        promotion: data.move.promotion,
      });
      if (!moveResult) return;

      setFen(gameRef.current.fen())
      setYourTurn(prev=> !prev)
      setHighlightSquares([data.move.from, data.move.to]);
const moveStr = data.move.promotion 
  ? `${data.move.from} -> ${data.move.to} (${data.move.promotion})`
  : `${data.move.from} -> ${data.move.to}`;

setMoveHistory(prev => [...prev, moveStr]);

      gameMetaData.current.movesList=moveHistory
      gameMetaData.current.fen= gameRef.current.fen()
      gameMetaData.current.updatedAt= Date.now().toString()
      socketRef.current.saveGame(gameMetaData)
            if (checkGameStatus()) return;

    }
    else{
      console.log("Not the Opponent's turn")
    }
  }

  const handleMove = useCallback((move: Move) => {
    if (yourTurn){
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
      const moveStr = move.promotion 
  ? `${move.from} -> ${move.to} (${move.promotion})`
  : `${move.from} -> ${move.to}`;

setMoveHistory(prev => [...prev, moveStr]);
      

      

      gameMetaData.current.movesList=moveHistory
      gameMetaData.current.fen=fen
      gameMetaData.current.updatedAt= Date.now().toString()
      socketRef.current.saveGame(gameMetaData)
      if (checkGameStatus()) return;

      if (socketRef.current) {
        socketRef.current.playMove(gameMetaData)
        setYourTurn(prev => !prev) 
      }
    } catch (error) {
      console.error('Error handling move:', error);
    }
  }
  else{
    console.log("It's not your turn")
  }
}, []);

  const checkGameStatus = useCallback((): boolean => {
    const game = gameRef.current;
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? 'Black' : 'White';
      setGameEndMessage(`Checkmate! ${winner} wins!`);
      setShowGameEndModal(true);
      endGame("won")
      return true;
    }
    if (game.isDraw() || game.isStalemate()) {
      setGameEndMessage(game.isStalemate() ? 'Stalemate! Draw!' : 'Game over: Draw!');
      setShowGameEndModal(true);
      endGame("draw")

      return true;
    }
    if (game.isThreefoldRepetition()) {
      setGameEndMessage('Draw by threefold repetition!');
      setShowGameEndModal(true);
      endGame("draw")

      return true;
    }
    if (game.isInsufficientMaterial()) {
      setGameEndMessage('Draw by insufficient material!');
      setShowGameEndModal(true);
      endGame("draw")

      return true;
    }
    return false;
  }, []);
 
  const resetGame = useCallback(() => {
    gameRef.current.reset();
    if (chessBoardRef.current) chessBoardRef.current.reset();
    setDifficulty(10)
    setMoveHistory([])
    const startFen = gameRef.current.fen();
    setFen(startFen);
    setMoveHistory([]);
    setHighlightSquares([]);
    playerColor == "white" ? setYourTurn(true) : setYourTurn(false);
    setShowSettings(true);
    setShowGameEndModal(false);
    setGameEndMessage("");
    socketRef.current= null
  }, []);

  const endGame = (outcome : "won" | "lost" | "ongoing" | "draw" ) =>{
    if (location.state){
      gameMetaData.current.status= outcome;
      socketRef.current.saveGame(gameMetaData);
      socketRef.current.endGame()
      return
    }
    else{
      return
    }
  }


const loadGame = () => {
  if (!socketRef.current) return;

  if (location.state) {
    const savedMeta: GameMetaData = location.state;
    const newGame = socketRef.current.getMostRecentGameInfo(savedMeta);
    applyGameState(newGame);
  } else if (user.current) {
    const newGame: GameMetaData = {
      userId: user.current.id,
      user: user.current,
      gameName: "Me vs Computer",
      gameType: "computer",
      computerLevel: difficulty,
      fen,
      movesList: moveHistory,
      playerColor,
      status: "ongoing",
      createdAt: Date.now().toString(),
      updatedAt: Date.now().toString(),
    };
    gameMetaData.current = newGame;
    socketRef.current.saveNewGame(newGame);
    navigate(location.pathname, { state: newGame, replace: true });
    applyGameState(newGame);
  } else {
    socketRef.current.createNewGameNoSaveState();
  }
};

const applyGameState = (game: GameMetaData) => {
  gameRef.current = new Chess(game.fen);
  chessBoardRef.current.setPosition(game.fen); // use game.fen, not stale fen
  setDifficulty(game.computerLevel);
  setMoveHistory(game.movesList);
  setHighlightSquares([]);
  const [, activeColor] = game.fen.split(" ");
  setYourTurn((activeColor === "w" ? "white" : "black") === playerColor);
  setShowSettings(false);
  setShowGameEndModal(false);
  setGameEndMessage("");
};

  const undoMove = useCallback(() => {

    //need to work on undo functionality 
    if (moveHistory.length < 2) return;
    if (gameMetaData.current) {
      if (gameMetaData.current.gameType != "computer"){
        return
      }
    }/*
    gameRef.current.undo();
    gameRef.current.undo();
    const newFen = gameRef.current.fen();
    setFen(newFen);
    setMoveHistory(prev => prev.slice(0, -2));
    setHighlightSquares([]);
    if (chessBoardRef.current) chessBoardRef.current.setPosition(newFen);
    if (socketRef.current) socketRef.current.emit('update-fen', { fen: newFen }); */
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


          <button className="btn-green w-full mt-8 mb-4" onClick={()=>{startGame()}}>
            {!connected ? 'Start Game' : 'Connecting...'}
          </button>
        </div>
      ) : (
        <>
          {/* ── Game controls ── */}
          <div className="flex gap-3 mb-8 flex-wrap justify-center">
            <button className={controlBtnClass} onClick={undoMove} disabled={moveHistory.length < 2 || !yourTurn}>
              Undo
            </button>
            <button className={controlBtnClass} onClick={resetGame} disabled={!yourTurn}>
              Reset
            </button>
            <button className={controlBtnClass} onClick={() => chessBoardRef.current?.flip()}>
              Flip Board
            </button>
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
              disabled={!yourTurn}
            />
          </div>

          {/* ── Move history ── */}
          <div className="bg-light border-2 border-dark rounded-2xl p-6 w-full max-w-xl my-3">
            <h3 className="font-bold text-dark text-lg mb-3">
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
                      <span className="bg-white text-dark border-2 border-primary px-3 py-1 rounded font-mono text-sm">
                        {move}
                      </span>
                      {moveHistory[idx + 1] && (
                        <span className="bg-dark text-light border-2 border-primary px-3 py-1 rounded font-mono text-sm">
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
                onClick={() => {navigate("/play")}}
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
