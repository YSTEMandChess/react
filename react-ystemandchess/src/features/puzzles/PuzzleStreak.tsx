import React, { useRef, useState, useEffect } from "react";
import Modal, { ModalProps } from "../../components/modal/Modal";
import { environment } from "../../environments/environment";
import { useCookies } from "react-cookie";
import ChessBoard, { ChessBoardRef } from "../../components/ChessBoard/ChessBoard";
import { useChessSocket } from "../lessons/piece-lessons/lesson-overlay/hooks/useChessSocket";
import { Move } from "../../core/types/chess";
import { SetPermissionLevel } from "../../globals";

// Mirrors the types exported from Puzzles.tsx / PuzzleDash.tsx. If they live in
// the same folder, drop these two and import them instead.
import { PuzzleMetaData } from "../../core/types/puzzlemetadata";
import { User } from "../../core/types/puzzlemetadata";

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

const PuzzleStreak: React.FC = () => {
  // Refs
  const user = useRef<User | null>(null);
  const chessSocketRef = useRef<any>(null);
  const chessBoardRef = useRef<ChessBoardRef>(null);
  const moveListRef = useRef<string[]>([]);
  const isPuzzleEndRef = useRef(false);
  const currentPuzzleRef = useRef<PuzzleMetaData | null>(null);
  const initializeStreakRef = useRef<(() => Promise<void>) | undefined>(undefined);

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

  // Streak-specific state
  const [currentStreak, setCurrentStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  // ============================================================================
  // USER IDENTIFICATION (pulls saved high streak, same pattern as PuzzleDash)
  // ============================================================================
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
          // NOTE: adjust this field name to whatever your backend actually
          // stores the saved streak high score under.
          if (data?.highestPuzzleStreak) {
            setHighestStreak(data.highestPuzzleStreak);
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

  // Escalating difficulty based on streak length
  const fetchSinglePuzzle = async (streakNumber: number) => {
    const minRating = 600 + streakNumber * 50;
    const maxRating = minRating + 200;

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

  const resetStreakSession = () => {
    chessBoardRef.current?.clearHighlights();
    moveListRef.current = [];
    currentPuzzleRef.current = null;
    isPuzzleEndRef.current = false;
    setCurrentFEN("");
    setHidePieces(true);
    setHighlightSquares([]);
    setIsInitialized(false);
    setBackendConnected(false);
    setShowHint(false);
    closeModal();
  };

  initializeStreakRef.current = async () => {
    if (isFailed) return;
    if (isInitialized) return;
    try {
      const puzzle = await fetchSinglePuzzle(currentStreak);
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
    setShowHint(false);
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
    // Don't highlight locally here — the server echoes the move back through
    // onLastMove, same as PuzzleDash does.
    chessSocketRef.current.sendMove(computerMove);
  };

  const handlePlayerMove = (move: Move) => {
    if (isPuzzleEndRef.current || moveListRef.current.length === 0) return;

    const playerAttemptedMove = `${move.from}${move.to}${move.promotion || ""}`;
    const expectedPlayerMove = moveListRef.current[0];

    const isCorrect =
      playerAttemptedMove === expectedPlayerMove ||
      playerAttemptedMove === expectedPlayerMove.substring(0, 4);

    if (isCorrect) {
      moveListRef.current.shift();
      setHighlightSquares([move.from, move.to]);

      const newFen = chessBoardRef.current?.getFen();
      if (newFen) setCurrentFEN(newFen);

      const backendMove: Move = {
        ...move,
        uuid: currentPuzzleRef.current?.socketId,
        username: user.current?.username ?? null,
        credentials: cookies.login,
        computerMove: false,
      };
      chessSocketRef.current.sendMove(backendMove);

      if (moveListRef.current.length === 0) {
        // Puzzle solved — bump the streak and load the next one
        isPuzzleEndRef.current = true;
        setCurrentStreak((s) => {
          const next = s + 1;
          setHighestStreak((hs) => Math.max(hs, next));
          return next;
        });

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
      // STREAK ENDS!
      isPuzzleEndRef.current = true; // Lock the board
      setIsFailed(true); // Trigger the UI restart button
      setShowHint(true); // Auto-show the hint text
      saveHighScore(currentStreak);

      // Snap the incorrectly placed piece back so they can study the board
      chessBoardRef.current?.undo();

      setModal({
        type: "error",
        title: "Streak Broken!",
        message: `Incorrect move! Your final streak was ${currentStreak}.`,
        onConfirm: () => closeModal(),
      });
    }
  };

  // ============================================================================
  // GAME FLOW
  // ============================================================================

  const handleStartStreak = () => {
    resetStreakSession();
    setCurrentStreak(0);
    setIsFailed(false);
  };

  const saveHighScore = async (finalStreak: number) => {
    if (!user.current?.username || finalStreak === 0) return;
    try {
      await fetch(`${environment.urls.middlewareURL}/user/updateHighScore`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.login}`,
        },
        body: JSON.stringify({ streakScore: finalStreak }),
      });
    } catch (err) {
      console.error("Failed to save high score", err);
    }
  };

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

  // Fetch the next puzzle whenever we're not initialized and not showing the
  // "streak broken" screen
  useEffect(() => {
    if (!isInitialized && !isFailed) {
      initializeStreakRef.current?.();
    }
  }, [isInitialized, isFailed]);

  // Once we have a puzzle queued up and the socket is connected, tell the
  // backend to start a room for it
  useEffect(() => {
    if (
      socket.connected &&
      isInitialized &&
      !backendConnected &&
      currentPuzzleRef.current
    ) {
      chessSocketRef.current.startNewPuzzle(currentPuzzleRef.current);
    }
  }, [socket.connected, isInitialized, backendConnected]);

  // Once the backend confirms the room is live, actually start the round
  useEffect(() => {
    if (!backendConnected) return;
    startRound();
  }, [backendConnected]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col items-center mt-12 w-full max-w-4xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-dark uppercase tracking-widest">Puzzle Streak</h1>
        <p className="text-gray mt-2 text-lg">Solve as many puzzles in a row as you can without making a mistake.</p>

        <div className="mt-4 text-3xl font-bold text-primary transition-all">
          🔥 Streak: {currentStreak}
        </div>
        {highestStreak > 0 && (
          <div className="mt-1 text-sm font-bold text-gray uppercase tracking-wide">
            Best: {highestStreak}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center w-full max-w-[600px]">
        <div
          className={`w-full aspect-square transition-transform duration-200 [&_svg_*]:transition-opacity [&_svg_*]:duration-700 ${
            hidePieces ? "[&_svg_*]:opacity-0" : "[&_svg_*]:opacity-100"
          }`}
        >
          <ChessBoard
            mode="puzzle"
            ref={chessBoardRef}
            fen={currentFEN || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
            orientation={playerColor}
            highlightSquares={highlightSquares}
            onMove={handlePlayerMove}
            disabled={isPuzzleEndRef.current || !backendConnected || hidePieces}
          />
        </div>

        <div className="mt-6 flex flex-col items-center gap-4 w-full">
          {isFailed ? (
            <button
              className="btn-green text-xl px-12 py-3 shadow-lg hover:scale-105 transition-transform animate-fade-in"
              onClick={handleStartStreak}
            >
              Start New Streak
            </button>
          ) : (
            <button
              className="btn-green w-full md:w-auto px-8 py-3"
              onClick={() => setShowHint(!showHint)}
              disabled={!backendConnected}
            >
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
          )}

          {showHint && currentPuzzleRef.current && (
            <div className="w-full p-6 bg-light rounded-lg shadow border-2 border-primary text-base leading-relaxed text-dark text-center animate-fade-in">
              <div className="mb-2">
                <span className="font-bold text-primary">Puzzle Rating:</span>{" "}
                {currentPuzzleRef.current.Rating || "N/A"}
              </div>
              <div>
                <span className="font-bold text-primary">Themes:</span>{" "}
                {currentPuzzleRef.current.Themes
                  ? currentPuzzleRef.current.Themes.split(" ").join(", ")
                  : "Mixed"}
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && <Modal {...modal} onClose={closeModal} />}
    </div>
  );
};

export default PuzzleStreak;