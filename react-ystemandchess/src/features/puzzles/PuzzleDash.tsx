import React, { useRef, useState, useEffect } from "react";
import Modal, { ModalProps } from "../../components/modal/Modal";
import { environment } from "../../environments/environment";
import { useCookies } from "react-cookie";
import ChessBoard, { ChessBoardRef } from "../../components/ChessBoard/ChessBoard";
import { useChessSocket } from "../lessons/piece-lessons/lesson-overlay/hooks/useChessSocket";
import { Move } from "../../core/types/chess";
import { SetPermissionLevel } from "../../globals";

// Mirrors the types exported from Puzzles.tsx. If that file lives in the same
// folder, drop these two and use: import { User, PuzzleMetaData } from "./Puzzles";
export type User = {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  id: number;
  _id?: number;
};

export type PuzzleMetaData = {
  userId?: number;
  user?: User;
  socketId?: string;

  PuzzleId: string;
  FEN: string;
  Moves: string;

  Rating?: number;
  RatingDeviation?: number;
  Popularity?: number;
  NbPlays?: number;

  Themes?: string;
  GameUrl?: string;
  OpeningTags?: string;
};

const normalizeFen = (fen: string): string => {
  if (!fen || typeof fen !== "string") {
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  }
  const trimmed = fen.trim().toLowerCase();
  if (trimmed === "start") {
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  }
  const parts = fen.trim().split(/[\s,]+/);
  if (parts.length === 6) return parts.join(" ");
  if (parts.length === 1 && parts[0].split("/").length === 8) {
    return `${parts[0]} w KQkq - 0 1`;
  }
  const defaults = ["w", "KQkq", "-", "0", "1"];
  const paddedParts = [...parts];
  while (paddedParts.length < 6) {
    paddedParts.push(defaults[paddedParts.length - 1]);
  }
  return paddedParts.join(" ");
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

type DashState = "selection" | "playing" | "results";

const PuzzleDash: React.FC = () => {
  // Refs
  const user = useRef<User | null>(null);
  const chessSocketRef = useRef<any>(null);
  const chessBoardRef = useRef<ChessBoardRef>(null);
  const moveListRef = useRef<string[]>([]);
  const isPuzzleEndRef = useRef(false);
  const currentPuzzleRef = useRef<PuzzleMetaData | null>(null);
  const initializeDashRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // State
  const [cookies, , removeCookie] = useCookies(["login"]);
  const [backendConnected, setBackendConnected] = useState(false);

  const [currentFEN, setCurrentFEN] = useState<string>("");
  const [hidePieces, setHidePieces] = useState(true);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [modal, setModal] = useState<Omit<ModalProps, "onClose"> | null>(null);
  const closeModal = () => setModal(null);

  // Dash flow
  const [dashState, setDashState] = useState<DashState>("selection");

  // Timer
  const [timeLimit, setTimeLimit] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Stats
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [highestCombo, setHighestCombo] = useState(0);
  const [blunders, setBlunders] = useState(0);
  const [highestElo, setHighestElo] = useState(0);

  // UI animation
  const [showPenalty, setShowPenalty] = useState(false);

  // User identification (also pulls the user's saved high combo)
  useEffect(() => {
    if (!cookies.login) return;

    const verifyAndLoad = async () => {
      try {
        const userInfo = await SetPermissionLevel(cookies, removeCookie);
        if (!userInfo || userInfo.error) return;

        const { username, firstName, lastName, role, email, id } = userInfo;
        user.current = { username, firstName, lastName, role, email, id };

        const res = await fetch(
          `${environment.urls.middlewareURL}/user/getUser?username=${username}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.highestDashCombo) {
            setHighestCombo(data.highestDashCombo);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    };

    verifyAndLoad();
  }, [cookies.login]);

  // Reveal pieces once the FEN for this round actually arrives
  useEffect(() => {
    if (currentFEN !== "") {
      setHidePieces(false);
    }
  }, [currentFEN]);

  const handleBoardStateChange = (puzzleMetaData: PuzzleMetaData) => {
    if (!currentPuzzleRef.current) return;
    currentPuzzleRef.current = puzzleMetaData;
    setCurrentFEN(puzzleMetaData.FEN);
  };

  // ============================================================================
  // PUZZLE LOADING
  // ============================================================================

  const fetchSinglePuzzle = async (currentScore: number) => {
    // Scales faster than a themed set so the dash keeps getting harder
    const minRating = 600 + currentScore * 40;
    const maxRating = minRating + 250;

    try {
      const res = await fetch(
        `${environment.urls.middlewareURL}/puzzles/random?limit=1&minRating=${minRating}&maxRating=${maxRating}`
      );
      if (res.ok) {
        const data = await res.json();
        return data[0] as PuzzleMetaData;
      }
    } catch (err) {
      console.error("Error fetching puzzle:", err);
    }
    return null;
  };

  const updatePuzzleEnvironment = (puzzle: PuzzleMetaData) => {
    moveListRef.current = puzzle.Moves.split(" ");
    const normalizedFen = normalizeFen(puzzle.FEN);
    puzzle.FEN = normalizedFen;

    const sideToMove = normalizedFen.split(" ")[1];
    const newPlayerColor = sideToMove === "w" ? "black" : "white";
    setPlayerColor(newPlayerColor);

    currentPuzzleRef.current = {
      ...puzzle,
      userId: user.current?.id ?? null,
      user: user.current ?? null,
      socketId: chessSocketRef.current?.getSocketId(),
    };
  };

  const resetDashSession = () => {
    chessBoardRef.current?.clearHighlights();
    moveListRef.current = [];
    currentPuzzleRef.current = null;
    isPuzzleEndRef.current = false;
    setCurrentFEN("");
    setHidePieces(true);
    setHighlightSquares([]);
    setIsInitialized(false);
    setBackendConnected(false);
    closeModal();
  };

  initializeDashRef.current = async () => {
    if (dashState !== "playing") return;
    if (isInitialized) return;
    try {
      const puzzle = await fetchSinglePuzzle(score);
      if (puzzle) {
        updatePuzzleEnvironment(puzzle);
        setIsInitialized(true);
      } else {
        setModal({
          type: "error",
          title: "Puzzle unavailable",
          message: "Could not reach the puzzle server. Make sure the middleware is running.",
        });
      }
    } catch (err) {
      console.error("Error loading puzzle:", err);
    }
  };

  const startRound = () => {
    if (!currentPuzzleRef.current) return;
    setCurrentFEN(currentPuzzleRef.current.FEN);
    isPuzzleEndRef.current = false;
    setHighlightSquares([]);
    chessBoardRef.current?.clearHighlights();
    setTimeout(() => {
      playComputerMove();
    }, 500);
  };

  // ============================================================================
  // MOVE HANDLING
  // ============================================================================

  const playComputerMove = () => {
    if (moveListRef.current.length === 0) return;
    const computerMoveStr = moveListRef.current.shift();
    if (!computerMoveStr) return;

    const computerMove: Move = {
      from: computerMoveStr.substring(0, 2),
      to: computerMoveStr.substring(2, 4),
      promotion:
        computerMoveStr.length > 4
          ? (computerMoveStr[4] as "q" | "r" | "b" | "n")
          : undefined,
      uuid: currentPuzzleRef.current?.socketId,
      username: user.current?.username ?? null,
      credentials: null,
      computerMove: false,
    };
    chessSocketRef.current.sendMove(computerMove);
  };

  const handlePlayerMove = (move: Move) => {
    if (
      isPuzzleEndRef.current ||
      !moveListRef.current ||
      moveListRef.current.length === 0 ||
      dashState !== "playing"
    ) {
      return;
    }

    if (!isTimerRunning) setIsTimerRunning(true);

    const playerAttemptedMove = `${move.from}${move.to}${move.promotion || ""}`;
    const expectedPlayerMove = moveListRef.current[0];

    const isCorrect =
      playerAttemptedMove === expectedPlayerMove ||
      playerAttemptedMove === expectedPlayerMove.substring(0, 4);

    if (isCorrect) {
      moveListRef.current.shift();
      setHighlightSquares([move.from, move.to]);

      const newFen = chessBoardRef.current?.getFen();
      if (newFen) {
        setCurrentFEN(newFen);
      }

      const backendMove: Move = {
        ...move,
        uuid: currentPuzzleRef.current?.socketId,
        username: user.current?.username ?? null,
        credentials: cookies.login,
        computerMove: false,
      };
      chessSocketRef.current.sendMove(backendMove);

      if (moveListRef.current.length === 0) {
        isPuzzleEndRef.current = true;

        setScore((s) => s + 1);
        setCombo((c) => {
          const newCombo = c + 1;
          setHighestCombo((hc) => Math.max(hc, newCombo));
          return newCombo;
        });
        if (currentPuzzleRef.current?.Rating) {
          const rating = currentPuzzleRef.current.Rating;
          setHighestElo((e) => Math.max(e, rating));
        }

        setTimeout(() => {
          setIsInitialized(false);
          setBackendConnected(false);
        }, 400);
      } else {
        setTimeout(() => {
          playComputerMove();
        }, 300);
      }
    } else {
      chessBoardRef.current?.undo();
      setBlunders((b) => b + 1);
      setCombo(0);
      setTimeLeft((t) => Math.max(0, t - 5));
      setShowPenalty(true);
      setTimeout(() => setShowPenalty(false), 500);
    }
  };

  // ============================================================================
  // GAME FLOW
  // ============================================================================

  const handleStartDash = (minutes: number) => {
    resetDashSession();
    const seconds = minutes * 60;
    setTimeLimit(seconds);
    setTimeLeft(seconds);
    setScore(0);
    setCombo(0);
    setBlunders(0);
    setHighestElo(0);
    setIsTimerRunning(false);
    setDashState("playing");
  };

  const saveHighScore = async (finalScore: number, finalCombo: number) => {
    if (!user.current?.username) return;
    try {
      await fetch(`${environment.urls.middlewareURL}/user/updateHighScore`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.login}`,
        },
        body: JSON.stringify({ dashScore: finalScore, dashCombo: finalCombo }),
      });
    } catch (err) {
      console.error("Failed to save high score", err);
    }
  };

  const endDash = () => {
    setIsTimerRunning(false);
    setDashState("results");
    saveHighScore(score, highestCombo);
  };

  // ============================================================================
  // TIMER
  // ============================================================================

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0 && dashState === "playing") {
      endDash();
    }
  }, [timeLeft, dashState]);

  // ============================================================================
  // SOCKET
  // ============================================================================

  const socket = useChessSocket({
    serverUrl: environment.urls.chessServerURL,
    mode: "puzzle",
    onBoardStateChange: handleBoardStateChange,
    backendConnected: setBackendConnected,
    onLastMove: (from, to) => {
      setHighlightSquares([from, to]);
      chessBoardRef.current?.highlightMove(from, to);
    },
    onError: (msg) => {
      console.error("Socket error:", msg);
    },
  });

  useEffect(() => {
    if (!chessSocketRef.current) {
      chessSocketRef.current = socket;
    }
  }, [socket]);

  useEffect(() => {
    if (dashState === "playing" && !isInitialized) {
      initializeDashRef.current?.();
    }
  }, [dashState, isInitialized]);

  useEffect(() => {
    if (
      dashState === "playing" &&
      socket.connected &&
      isInitialized &&
      !backendConnected &&
      currentPuzzleRef.current
    ) {
      chessSocketRef.current.startNewPuzzle(currentPuzzleRef.current);
    }
  }, [dashState, socket.connected, isInitialized, backendConnected]);

  useEffect(() => {
    if (!backendConnected) return;
    startRound();
  }, [backendConnected]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (dashState === "selection") {
    return (
      <div className="flex flex-col items-center justify-center mt-12 w-full max-w-4xl mx-auto px-4 min-h-[60vh]">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-dark uppercase tracking-widest mb-4">Puzzle Dash</h1>
          <p className="text-gray text-xl">Solve as many puzzles as you can before the time runs out.</p>
          <p className="text-primary font-bold mt-2">Wrong moves subtract 5 seconds!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
          {[1, 3, 5].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => handleStartDash(mins)}
              className="flex flex-col items-center p-8 bg-light border-2 border-dark rounded-2xl shadow-lg hover:-translate-y-2 hover:bg-soft transition-all group"
              data-testid={`dash-start-${mins}min`}
            >
              <span className="text-4xl mb-2">⏱️</span>
              <h2 className="text-3xl font-extrabold text-dark">{mins} Min</h2>
              <span className="mt-4 text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Start Dash
              </span>
            </button>
          ))}
        </div>

        {modal && <Modal {...modal} onClose={closeModal} />}
      </div>
    );
  }

  if (dashState === "results") {
    return (
      <div className="flex flex-col items-center mt-12 w-full max-w-2xl mx-auto px-4">
        <h1 className="text-5xl font-extrabold text-dark uppercase tracking-widest mb-8">Time's Up!</h1>

        <div className="w-full bg-light border-2 border-dark rounded-2xl p-8 shadow-xl mb-8">
          <div className="grid grid-cols-2 gap-8 text-center">
            <div className="p-4 bg-soft rounded-lg">
              <p className="text-gray font-bold uppercase tracking-wide text-sm">Total Score</p>
              <p className="text-5xl font-extrabold text-primary">{score}</p>
            </div>
            <div className="p-4 bg-soft rounded-lg">
              <p className="text-gray font-bold uppercase tracking-wide text-sm">Highest Combo</p>
              <p className="text-4xl font-bold text-dark">{highestCombo}</p>
            </div>
            <div className="p-4 bg-soft rounded-lg">
              <p className="text-gray font-bold uppercase tracking-wide text-sm">Blunders (-5s)</p>
              <p className="text-3xl font-bold text-red-500">{blunders}</p>
            </div>
            <div className="p-4 bg-soft rounded-lg">
              <p className="text-gray font-bold uppercase tracking-wide text-sm">Highest Elo Solved</p>
              <p className="text-3xl font-bold text-dark">{highestElo || "N/A"}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setDashState("selection")}
          className="btn-green text-xl px-12 py-4 shadow-lg hover:scale-105 transition-transform"
          data-testid="dash-play-again-button"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-8 w-full max-w-4xl mx-auto px-4">
      <div className="w-full max-w-[600px] flex justify-between items-center mb-6 px-4 py-3 bg-light rounded-xl shadow-md border-b-4 border-dark">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray uppercase">Score</span>
          <span className="text-3xl font-extrabold text-primary">{score}</span>
        </div>

        <div
          className={`flex flex-col items-center transition-all ${
            showPenalty ? "scale-110 text-red-500" : "text-dark"
          } ${timeLeft <= 10 && isTimerRunning ? "animate-pulse text-red-500" : ""}`}
        >
          <span className="text-xs font-bold text-gray uppercase">Time Left</span>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-extrabold">{formatTime(timeLeft)}</span>
            {showPenalty && (
              <span className="absolute ml-24 text-red-500 font-bold animate-bounce">-5s</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-gray uppercase">Combo</span>
          <span className="text-2xl font-bold text-dark">🔥 {combo}</span>
        </div>
      </div>

      <div
        className={`w-full max-w-[600px] aspect-square transition-transform duration-200 [&_svg_*]:transition-opacity [&_svg_*]:duration-700 ${
          hidePieces ? "[&_svg_*]:opacity-0" : "[&_svg_*]:opacity-100"
        } ${showPenalty ? "rotate-1" : ""}`}
        data-testid="puzzle-dash-board-container"
      >
        <ChessBoard
          mode="puzzle"
          ref={chessBoardRef}
          fen={currentFEN || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
          orientation={playerColor}
          highlightSquares={highlightSquares}
          onMove={handlePlayerMove}
          disabled={isPuzzleEndRef.current || !backendConnected || hidePieces || dashState !== "playing"}
        />
      </div>

      {!isTimerRunning && timeLeft === timeLimit && !hidePieces && (
        <p className="mt-6 text-xl font-bold text-primary animate-pulse">Make your first move to start the timer!</p>
      )}

      {modal && <Modal {...modal} onClose={closeModal} />}
    </div>
  );
};

export default PuzzleDash;