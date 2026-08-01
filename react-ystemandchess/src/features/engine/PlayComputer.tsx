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
  const [yourTurn, setYourTurn] = useState<boolean>(true);


const onOpponentMove = (data: { fen: string; move?: Move }) => {
  console.log("received opponent move", data);

  try {
    // If server only sends a board sync
    if (!data.move || !data.move.from || !data.move.to) {
      gameRef.current = new Chess(data.fen);
      setFen(data.fen);

      const history = gameRef.current.history();

      setMoveHistory(
        history.map((move) => move)
      );

      return;
    }
if (data.fen==gameMetaData.current.fen){
  return
}

    const { from, to, promotion } = data.move;


    const moveResult = gameRef.current.move({
      from,
      to,
      promotion,
    });


    if (!moveResult) {
      console.log(
        "Invalid opponent move",
        from,
        to,
        promotion
      );
      return;
    }


    const newFen = gameRef.current.fen();


    setFen(newFen);

    setHighlightSquares([
      from,
      to
    ]);


    const moveStr = promotion
      ? `${from} -> ${to} (${promotion})`
      : `${from} -> ${to}`;


    setMoveHistory(prev => [
      ...prev,
      moveStr
    ]);


    checkGameStatus();


  } catch(error) {
    console.error(
      "Opponent move error:",
      error
    );
  }
};

const endGame = useCallback(
  (outcome: "won" | "lost" | "ongoing" | "draw") => {
    if (!gameMetaData.current) {
      return;
    }

    gameMetaData.current.status = outcome;
    chessSocketRef.current.endGame();
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
  student: gameMetaData.current?.user?.firstName || "",
  serverUrl: environment.urls.chessServer,
  onMove: onOpponentMove,
  onLastMove: endGame,
});


useEffect(() => {
  if (!chessSocket.connected) {
    console.log("Waiting for chess socket to connect...");
    return;
  }
  

  chessSocketRef.current = chessSocket;
  console.log("Chess socket connected:", chessSocketRef.current);

  const initializeGame = async () => {
    resetGame();

    await loadGame();

    console.log("Checking chess socket:", chessSocket);

    checkGameStatus();
  };

  initializeGame();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [location.key, chessSocket.connected]);


useEffect(() => {
  if (!fen) return;
  setYourTurn(isPlayersTurn(fen, playerColor));
}, [fen, playerColor]);


  useEffect(() => {
    if (movesContainerRef.current) {
      movesContainerRef.current.scrollTop =
        movesContainerRef.current.scrollHeight;
    }
  }, [moveHistory]);

   useEffect(() => {
  if (
   !yourTurn  &&
   ( gameMetaData.current?.gameType === "computer" || gameMetaData.current?.gameType === "guest" )
  ) {
    chessSocketRef.current.sendMove({
      from:null,
      to:null,
      promotion:null,
      piece:null,
      captured:null,
      flags:null,
      computerMove:true,
      username: gameMetaData.current.user?.username ?? "",
      credenitals: null
    });
  }
}, [yourTurn, fen]);




 
const isPlayersTurn = (
  fen: string,
  playerColor: "white" | "black",
): boolean => {
  const turn = fen.split(" ")[1]; // "w" or "b"

  return (
    (turn === "w" && playerColor === "white") ||
    (turn === "b" && playerColor === "black")
  );
};

  
  const handleMove = useCallback((move: Move) => {
    if (yourTurn) {
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

        setMoveHistory((prev) => [...prev, moveStr]);

        if (checkGameStatus()) return;

        if (gameMetaData.current) {
          console.log(moveHistory)
          gameMetaData.current.movesList.push(moveStr);
          gameMetaData.current.fen = newFen;
          gameMetaData.current.updatedAt = Date.now().toString();
        }

        const moveType: Move = {
          from: moveResult.from,
          to: moveResult.to,
          promotion: moveResult.promotion,
          piece: moveResult.piece,
          captured: moveResult.captured,
          flags: moveResult.flags,
          computerMove: false,
          username: gameMetaData.current?.user?.username ?? "",
        }
        chessSocketRef?.current.sendMove(moveType);
      } catch (error) {
        console.error("Error handling move:", error);
      }
    } else {
      console.log("It's not your turn");
    }
  }, [yourTurn]);


const checkGameStatus = useCallback((): boolean => {
  const game = gameRef.current;

  if (game.isCheckmate()) {
    const winner = game.turn() === "w" ? "Black" : "White";

    setGameEndMessage(`Checkmate! ${winner} wins!`);
    setShowGameEndModal(true);
    endGame("won");

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
}, [endGame]);

  const resetGame = useCallback(() => {
    gameRef.current.reset();
    if (chessBoardRef.current) chessBoardRef.current.reset();
    setDifficulty(10);
    setMoveHistory([]);
    const startFen = gameRef.current.fen();
    setFen(startFen);
    setMoveHistory([]);
    setHighlightSquares([]);
    setYourTurn(true);
    setShowGameEndModal(false);
    setPlayerColor("white")
    if (chessSocketRef) {
      chessSocketRef.current.mentorRef = "mentor"
      chessSocketRef.current.studentRef = "student"
      chessSocketRef.current.roleRef = "guest"
    }
    setGameEndMessage("");


  }, []);



 const loadGame = async () => {
  // Existing game (loaded from navigation) 
  if (location.state) {
    gameMetaData.current = location.state;
    applyGameState(location.state);
    console.log(gameMetaData.current)
    chessSocketRef.current.startNewGame(gameMetaData.current);
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
};

  const applyGameState = (game: GameMetaData) => {
    gameRef.current = new Chess(game.fen);
    chessBoardRef.current.setPosition(game.fen); 
    setDifficulty(game.computerLevel);
    setMoveHistory(game.movesList);
    setHighlightSquares([]);
    const [, activeColor] = game.fen.split(" ");
    setYourTurn((activeColor === "w" ? "white" : "black") === playerColor);
    setShowGameEndModal(false);
    setGameEndMessage("");
    location.state = game
    chessSocketRef.current.mentorRef = "mentor"
    chessSocketRef.current.studentRef = game.user?.username ?? ""
    chessSocketRef.current.roleRef = "student"
    gameMetaData.current=game
    return
  };

  const undoMove = useCallback(() => {
    //need to work on undo functionality
    if (moveHistory.length < 2) return;
    if (gameMetaData.current) {
      if (gameMetaData.current.gameType != "computer") {
        return;
      }
    } /*
    gameRef.current.undo();
    gameRef.current.undo();
    const newFen = gameRef.current.fen();
    setFen(newFen);
    setMoveHistory(prev => prev.slice(0, -2));
    setHighlightSquares([]);
    if (chessBoardRef.current) chessBoardRef.current.setPosition(newFen);
    if (socketRef.current) socketRef.current.emit('update-fen', { fen: newFen }); */
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
              disabled={moveHistory.length < 2 || !yourTurn}
            >
              Undo
            </button>
            <button
              className={controlBtnClass}
              onClick={resetGame}
              disabled={!yourTurn}
            >
              Reset
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