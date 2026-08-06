import React, { useEffect, useState, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { io, Socket } from "socket.io-client";
import { useLocation, useNavigate } from "react-router";
import { Move } from "../../core/types/chess";
import ChessBoard, {
  ChessBoardRef,
} from "../../components/ChessBoard/ChessBoard";
import { environment } from "../../environments/environment";
import { useSocketChessEngine } from "../lessons/piece-lessons/lesson-overlay/hooks/useSocketChessEngine";
import { useChessSocket } from "../lessons/piece-lessons/lesson-overlay/hooks/useChessSocket";
import type { GameMetaData } from "./SelectGame";
import type { User } from "./SelectGame";
import { useCookies } from "react-cookie";
import { SetPermissionLevel } from "../../globals";
//Ideas
//check login validation for if we need to retrieve games
//change all of this to talk to the server have the server do the retireval  saving and editing of information
//if someones logged in call thesavestate function otherwise just talk to the server and the server wull delete the socketid game info on disconnect


//TODO: Add a way to update the game fully when we recieve info from the chess server to keep gamemetadata up to date
type Difficulty = 1 | 5 | 10 | 15 | 20;

const controlBtnClass =
  "bg-light border-solid border-dark text-dark font-semibold px-5 py-2 rounded-xl " +
  "transition-all duration-200 enabled:hover:text-white enabled:hover:border-primary enabled:hover:bg-primary " +
  "enabled:hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed";

const PlayComputer: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<Boolean>(false);
  const [cookies, setCookie, removeCookie] = useCookies(["login"]);

  const user = useRef<User>(null);
  const navigate = useNavigate();

  //chessboard, socket, player color, difficulty , sessionstart, movehistory, highlighted sqaures, gamemodal toggle, game end message toggle , fen
  const chessBoardRef = useRef<ChessBoardRef>(null);
  const gameRef = useRef<Chess>(new Chess());
  const movesContainerRef = useRef<HTMLDivElement>(null);
  const chessSocketRef = useRef<any>(null);

  const [fen, setFen] = useState<string>(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  );
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [difficulty, setDifficulty] = useState<number>(10);
  const location = useLocation();
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [gameEndMessage, setGameEndMessage] = useState("");
  const gameMetaData = useRef<GameMetaData>(null);
  const [backendVersionIsCreated, setBackendVersionIsCreated] = useState<Boolean>(false);
 
//write an onboardstate change to fully sync gamemetadata according to chess server 

const onOpponentMove = (data:{fen:string; move?:Move, gameMetaData: GameMetaData}) => {
  try {

    // ignore duplicate state
    if (data.fen === gameRef.current.fen()) {
      setFen(null)
      setFen(data.fen)
      console.log('setting fen')
      return;
    }

    // full sync
    if (!data.move?.from || !data.move?.to) {
      gameRef.current = new Chess(data.fen);
      setFen(data.fen);
      applyGameState(data.gameMetaData)

      return;
    }


    const result = gameRef.current.move({
      from:data.move.from,
      to:data.move.to,
      promotion:data.move.promotion
    });


    if (!result) {
      console.log("Invalid server move");
      return;
    }


    setFen(gameRef.current.fen());

    setHighlightSquares([
      data.move.from,
      data.move.to
    ]);


    setMoveHistory(prev=>[
      ...prev,
      `${data.move.from} -> ${data.move.to}`
    ]);

    checkGameStatus();

  } catch(err){
    console.error(err);
  }
}

const endGame = useCallback(
  (outcome: "won" | "lost" | "ongoing" | "draw") => {
    if (!gameMetaData.current) {
      return;
    }

    gameMetaData.current.status = outcome;
    chessSocketRef.current.endGame(gameMetaData.current);
  },
  []
);

  //functions to write
  //start game

  //reset function
  //handle player move function
  //handle opponent move


 useEffect(() => {
  if (!cookies.login) {
    setIsLoggedIn(false);
    return;
  }

  const verifyAndLoad = async () => {
    try {
      const userInfo = await SetPermissionLevel(cookies, removeCookie);

      if (!userInfo || userInfo.error) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);

      const {
        username,
        firstName,
        lastName,
        role,
        email,
        id,
      } = userInfo;

      user.current = {
        username,
        firstName,
        lastName,
        role,
        email,
        id,
      };
    } catch (err) {
      console.error("Auth check failed:", err);
      setIsLoggedIn(false);
    }
  };

  verifyAndLoad();
}, [cookies.login]);

const chessSocket = useChessSocket({
  serverUrl: environment.urls.chessServerURL,
  onMove: onOpponentMove,
  onLastMove: endGame,
  backendConnected: setBackendVersionIsCreated
});

useEffect(() => {
  if (!chessSocket.connected) {
    return;
  }

  chessSocketRef.current = chessSocket;
  console.log("Chess socket connected:", chessSocketRef.current);

  const initializeGame = async () => {
    resetGame();
    await loadGame();
    checkGameStatus();
  };
  initializeGame();
}, [location.key, chessSocket.connected]);


const maybeTriggerComputerMove = useCallback(() => {

  const meta = gameMetaData.current;
  if (!meta) return;
  if (meta.gameType !== "computer" && meta.gameType !== "guest") return;
  if (!chessSocketRef.current) return;
  if (gameRef.current.isGameOver()) return; // don't ask the engine to move into a finished game

  const currentTurn = gameRef.current.turn(); // 'w' | 'b'
  const isComputerTurn =
    (meta.playerColor === "white" && currentTurn === "b") ||
    (meta.playerColor === "black" && currentTurn === "w");

  if (!isComputerTurn) return;

  chessSocketRef.current.sendMove({
    from: null,
    to: null,
    promotion: null,
    piece: null,
    captured: null,
    flags: null,
    computerMove: true,
    username: meta.user?.username ?? "",
    credentials: null,
    uuid: gameMetaData.current.uuid ?? null
  });
}, []);

// Runs whenever a real move lands (player move or relayed opponent/engine move)
useEffect(() => {
  maybeTriggerComputerMove();
}, [fen, backendVersionIsCreated]);

  useEffect(() => {
    if (movesContainerRef.current) {
      movesContainerRef.current.scrollTop =
        movesContainerRef.current.scrollHeight;
    }
  }, [moveHistory]);

  const handleMove = useCallback((move: Move) => {
  const currentTurn = gameRef.current.turn();

  const isPlayerTurn =
    (playerColor === "white" && currentTurn === "w") ||
    (playerColor === "black" && currentTurn === "b");

  if (!isPlayerTurn) {
    return;
  }

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

    if (gameMetaData.current) {
      gameMetaData.current.movesList.push(moveStr);
      gameMetaData.current.fen = newFen;
      gameMetaData.current.updatedAt = Date.now().toString();
    }

    chessSocketRef.current.sendMove({
      from: moveResult.from,
      to: moveResult.to,
      promotion: moveResult.promotion,
      piece: moveResult.piece,
      captured: moveResult.captured,
      flags: moveResult.flags,
      computerMove:false,
      username: gameMetaData.current?.user?.username ?? "",
    });

  } catch(error) {
    console.error(error);
  }

}, [playerColor]);

const checkGameStatus = useCallback((): boolean => {
  const game = gameRef.current;

  if (game.isCheckmate()) {
    const winner = game.turn() === "w" ? "black" : "white";

    setGameEndMessage(`Checkmate! ${winner} wins!`);
    setShowGameEndModal(true);
    if (gameMetaData.current.status !="ongoing"){
      endGame(gameMetaData.current.status)
      return true

    }
    let userColor: "white" | "black";
    if ((user.current && gameMetaData.current) && ((user.current.id == gameMetaData.current.user.id)|| (!user.current) || (gameMetaData.current.opponentId=="stockfish"))) {
      userColor = playerColor;
      console.log("my color", userColor)
      console.log("the winner", winner)
    } else {
      userColor = playerColor === "white" ? "black" : "white";
    }
    endGame(userColor == winner ? "won" : "lost");

    return true;
  }

  if (game.isStalemate()) {
    setGameEndMessage("Stalemate! Draw!");
    setShowGameEndModal(true);
    endGame("draw");
    return true;
  }

  if (game.isThreefoldRepetition()) {
    setGameEndMessage("Draw by threefold repetition!");
    setShowGameEndModal(true);
    endGame("draw");
    return true;
  }

  if (game.isInsufficientMaterial()) {
    setGameEndMessage("Draw by insufficient material!");
    setShowGameEndModal(true);
    endGame("draw");
    return true;
  }

  if (game.isDraw()) {
    setGameEndMessage("Game over: Draw!");
    setShowGameEndModal(true);
    endGame("draw");
    return true;
  }

  return false;
}, [endGame, playerColor]);

  const resetGame = useCallback(() => {
    gameRef.current.reset();
    if (chessBoardRef.current) chessBoardRef.current.reset();
    setDifficulty(10);
    setMoveHistory([]);
    const startFen = gameRef.current.fen();
    setFen(startFen);
    setMoveHistory([]);
    setHighlightSquares([]);
    setFen(gameRef.current.fen())
    setShowGameEndModal(false);
    setPlayerColor("white")
    setGameEndMessage("");


  }, []);



 const loadGame = async () => {
  // Existing game (loaded from navigation) 
  if (location.state) {
    gameMetaData.current = location.state;
    applyGameState(location.state);
    console.log(gameMetaData.current)
    chessSocketRef.current.startNewGame(gameMetaData.current);
      maybeTriggerComputerMove();

    return;
  }

  // Logged-in user starts a new computer game
  if (user.current) {
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

    chessSocketRef.current.saveNewGame(newGame);

    gameMetaData.current = newGame;
    applyGameState(newGame);
    chessSocketRef.current.startNewGame(gameMetaData.current);
      maybeTriggerComputerMove();
    return;
  }

  // Guest game
  const guestGame: GameMetaData = {
    userId: null,
    user: null,
    opponent: null,
    uuid: null,
    opponentId: null,
    gameName: "Guest Game",
    gameType: "guest",
    computerLevel: difficulty,
    fen,
    movesList: [],
    playerColor,
    status: "ongoing",
    createdAt: Date.now().toString(),
    updatedAt: Date.now().toString(),
  };

  gameMetaData.current = guestGame;
  applyGameState(guestGame);
  chessSocketRef.current.startNewGame(gameMetaData.current);
    maybeTriggerComputerMove();

};

  const applyGameState = (game: GameMetaData) => {
  gameRef.current = new Chess(game.fen);
  chessBoardRef.current.setPosition(game.fen);
  setFen(game.fen);                 // was missing
  setDifficulty(game.computerLevel);
  setMoveHistory(game.movesList);
  setHighlightSquares([]);
  setPlayerColor(game.playerColor); // was missing
  const [, activeColor] = game.fen.split(" ");
  setShowGameEndModal(false);
  setGameEndMessage("");
  location.state = game;
  gameMetaData.current = game;
  return;
};
const isYourTurn = () => {
  if (!gameRef.current) return false;

  return gameRef.current.turn() === (playerColor === "white" ? "w" : "b");
};
  const undoMove = useCallback(() => {
    //need to work on undo functionality
    if (moveHistory.length < 2) return;
    if (gameMetaData.current) {
      if (gameMetaData.current.gameType =="friend" || gameMetaData.current.gameName=="mentor") {
        return;
      }
    } 
  }, [moveHistory.length]);


  return (
    <div className="flex flex-col items-center mt-8 px-4 py-8 bg-soft">
      <h1 className="text-3xl font-bold text-dark mb-8 text-center">
        Y Stem and Chess Match
      </h1>

          {/* ── Game controls ── */}
          <div className="flex gap-3 mb-8 flex-wrap justify-center">
            <button
              className={controlBtnClass}
              onClick={undoMove}
              disabled={moveHistory.length < 2 || !isYourTurn}
            >
              Undo
            </button>
            <button
              className={controlBtnClass}
              onClick={() => {
                  navigate("/select-game");}}
              disabled={!isYourTurn}
            >
              New Game
            </button>
            <button
              className={controlBtnClass}
              onClick={() => chessBoardRef.current?.flip()}
            >
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
              disabled={!isYourTurn}
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
              {moveHistory.reduce(
                (acc: JSX.Element[], move, idx) => {
                  if (idx % 2 === 0) {
                    const moveNumber =
                      Math.floor(idx / 2) + 1;
                    acc.push(
                      <div
                        key={idx}
                        className="grid grid-cols-[40px_1fr_1fr] gap-2 px-3 py-2 rounded-lg border border-borderLight items-center hover:border-primary transition-colors duration-150"
                      >
                        <span className="text-primary font-bold text-right text-sm">
                          {moveNumber}.
                        </span>
                        <span className="bg-white text-dark border-2 border-primary px-3 py-1 rounded font-mono text-sm">
                          {move}
                        </span>
                        {moveHistory[idx + 1] && (
                          <span className="bg-dark text-light border-2 border-primary px-3 py-1 rounded font-mono text-sm">
                            {moveHistory[idx + 1]}
                          </span>
                        )}
                      </div>,
                    );
                  }
                  return acc;
                },
                [],
              )}
            </div>
          </div>
        
      

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
            <h2 className="text-2xl font-bold text-dark mb-8">
              {gameEndMessage}
            </h2>
            <div className="flex gap-3">
              <button
                className="btn-green flex-1"
                onClick={() => {
                  navigate("/select-game");
                }}
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