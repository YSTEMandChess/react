import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  themesName,
  themesDescription,
} from "../../core/services/themesService";
import Modal, { ModalProps } from "../../components/modal/Modal";
import { environment } from "../../environments/environment";
import { v4 as uuidv4 } from "uuid";
import { SetPermissionLevel } from "../../globals";
import { useCookies } from "react-cookie";
import ChessBoard, {
  ChessBoardRef,
} from "../../components/ChessBoard/ChessBoard";
import { useChessSocket } from "../lessons/piece-lessons/lesson-overlay/hooks/useChessSocket";
import { Move } from "../../core/types/chess";

type PuzzlesProps = {
  student?: any;
  mentor?: any;
  role?: any;
  styleType?: any;
};

type PuzzleThemeKey = keyof typeof themesName;

const FEATURED_PUZZLE_THEMES: PuzzleThemeKey[] = [
  "mateIn1",
  "mateIn2",
  "fork",
  "pin",
  "skewer",
  "discoveredAttack",
  "deflection",
  "sacrifice",
  "promotion",
  "endgame",
  "opening",
  "middlegame",
  "zugzwang",
  "advancedPawn",
  "Endgame",
];

const getThemeName = (theme: PuzzleThemeKey | string) =>
  themesName[theme as PuzzleThemeKey] || theme;

const getThemeDescription = (theme: PuzzleThemeKey | string) =>
  themesDescription[theme as keyof typeof themesDescription] ||
  "Practice puzzles in this category.";

// Helper function to normalize FEN (same as in socket)
const normalizeFen = (fen: string): string => {
  if (!fen || typeof fen !== "string") {
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  }

  const trimmed = fen.trim().toLowerCase();
  if (trimmed === "start") {
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  }

  const parts = fen.trim().split(" ");

  if (parts.length === 6) return fen.trim();
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

const Puzzles: React.FC<PuzzlesProps> = ({
  student = null,
  mentor = null,
  role = "student",
  styleType = "page",
}) => {
  const isProfile = styleType === "profile";

  // Refs
  const chessBoardRef = useRef<ChessBoardRef>(null);
  const moveListRef = useRef<string[]>([]);
  const isPuzzleEndRef = useRef(false);
  const currentPuzzleRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const handleUnloadRef = useRef(() => {});
  const puzzleArrayRef = useRef<any[]>([]);
  const dbIndexRef = useRef(0);
  const getNextPuzzleRef = useRef<(() => void) | undefined>(undefined);
  const initializeComponentRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // State
  const [puzzleArray, setPuzzleArray] = useState<any[]>([]);
  const [currentFEN, setCurrentFEN] = useState<string>("");
  const [hidePieces, setHidePieces] = useState(true);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [themeList, setThemeList] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<PuzzleThemeKey | null>(null);
  const [cookies] = useCookies(["login"]);
  const [modal, setModal] = useState<Omit<ModalProps, "onClose"> | null>(null);
  const closeModal = () => setModal(null);

  // Time tracking
  const [eventID, setEventID] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [username, setUsername] = useState(null);

  // User identification
  const studentId = student || cookies.login?.studentId || uuidv4();
  const mentorId = mentor || "puzzle_mentor_" + studentId;

  // ============================================================================
  // PUZZLE LOADING
  // ============================================================================

  const getPuzzleFetchUrl = () => {
    const params = new URLSearchParams({ limit: "20" });
    if (selectedTheme) {
      params.set("theme", selectedTheme);
    }

    return `${environment.urls.middlewareURL}/puzzles/random?${params.toString()}`;
  };

  const resetPuzzleSession = () => {
    setPuzzleArray([]);
    puzzleArrayRef.current = [];
    dbIndexRef.current = 0;
    moveListRef.current = [];
    currentPuzzleRef.current = null;
    isPuzzleEndRef.current = false;
    setCurrentFEN("");
    setHidePieces(true);
    setHighlightSquares([]);
    setThemeList([]);
    setIsInitialized(false);
    closeModal();

    const hintText = document.getElementById("hint-text");
    if (hintText) {
      hintText.innerHTML = "";
      hintText.style.display = "none";
    }
  };

  const handleThemeSelect = (theme: PuzzleThemeKey) => {
    resetPuzzleSession();
    setSelectedTheme(theme);
  };

  const handleBackToThemes = () => {
    resetPuzzleSession();
    setSelectedTheme(null);
  };

  const initPuzzleArray = async () => {
    try {
      if (!selectedTheme) return [];

      const response = await fetch(getPuzzleFetchUrl());
      if (response.ok) {
        const jsonData = await response.json();
        setPuzzleArray(jsonData);
        puzzleArrayRef.current = jsonData;
        return jsonData;
      } else {
        throw new Error("Failed to fetch puzzles from backend");
      }
    } catch (error) {
      console.error("Error fetching puzzles:", error);
      setPuzzleArray([]);
      puzzleArrayRef.current = [];
      return [];
    }
  };

  const prefetchPuzzles = async () => {
    try {
      if (!selectedTheme) return;

      const response = await fetch(getPuzzleFetchUrl());
      if (response.ok) {
        const jsonData = await response.json();
        setPuzzleArray((prev) => {
          const newArray = [...prev, ...jsonData];
          puzzleArrayRef.current = newArray;
          return newArray;
        });
      }
    } catch (error) {
      console.error("Error prefetching puzzles:", error);
    }
  };

  // Reveal pieces once the first puzzle FEN arrives
  useEffect(() => {
    if (currentFEN && hidePieces) {
      setHidePieces(false);
    }
  }, [currentFEN, hidePieces]);

  // Prefetch when running low
  useEffect(() => {
    if (
      puzzleArray.length > 0 &&
      dbIndexRef.current >= puzzleArray.length - 5
    ) {
      prefetchPuzzles();
    }
  }, [puzzleArray.length]);

  initializeComponentRef.current = async () => {
    if (!selectedTheme) return;
    if (isInitialized || isInitializingRef.current) return;

    isInitializingRef.current = true;
    setIsInitialized(true);

    try {
      const puzzles = await initPuzzleArray();
      if (puzzles && puzzles.length > 0) {
        const firstPuzzle = puzzles[0];
        currentPuzzleRef.current = firstPuzzle;
        moveListRef.current = firstPuzzle?.Moves?.split(" ") || [];

        if (moveListRef.current.length === 0) {
          console.warn("No valid moves in initial puzzle:", firstPuzzle);
          isInitializingRef.current = false;
          setIsInitialized(false);
          return;
        }

        setThemeList(firstPuzzle.Themes.split(" "));
        setStateAsActive(firstPuzzle);
        updateInfoBox(firstPuzzle.Themes.split(" "));
      } else {
        setIsInitialized(false);
        setModal({
          type: "error",
          title: "No puzzles found",
          message: `No puzzles were found for ${getThemeName(selectedTheme)}.`,
        });
      }
    } finally {
      isInitializingRef.current = false;
    }
  };

  const setStateAsActive = (state: any) => {
    if (!state?.FEN || !state?.Moves || !state?.Themes) {
      console.warn("Puzzle is missing required fields:", state);
      return;
    }

    const sideToMove = state.FEN.split(" ")[1];
    const newPlayerColor = sideToMove === "w" ? "black" : "white";
    setPlayerColor(newPlayerColor);

    currentPuzzleRef.current = state;
    startLesson(state, newPlayerColor);
  };

  const startLesson = (puzzle: any, color: "white" | "black") => {
    console.log("StartLesson called... ");

    const fen = puzzle.FEN;

    if (!fen || fen.split("/").length !== 8) {
      console.warn("Invalid or missing FEN:", fen);
      return;
    }

    const normalizedFen = normalizeFen(fen);
    setCurrentFEN(normalizedFen);

    moveListRef.current = puzzle?.Moves?.split(" ") || [];
    isPuzzleEndRef.current = false;
    setHighlightSquares([]);

    socket.setGameStateWithColor(normalizedFen, color, puzzle.Themes);

    if (chessBoardRef.current) {
      chessBoardRef.current.clearHighlights();
    }

    // Play first computer move
    setTimeout(() => {
      playComputerMove();
    }, 500);
  };

  getNextPuzzleRef.current = () => {
    if (!puzzleArrayRef.current || puzzleArrayRef.current.length === 0) {
      console.error("Puzzle array is empty - reinitializing");
      initPuzzleArray().then((puzzles) => {
        if (puzzles && puzzles.length > 0) {
          dbIndexRef.current = 0;
          setStateAsActive(puzzles[0]);
          updateInfoBox(puzzles[0].Themes.split(" "));
        }
      });
      return;
    }

    dbIndexRef.current =
      (dbIndexRef.current + 1) % puzzleArrayRef.current.length;
    const nextPuzzle = puzzleArrayRef.current[dbIndexRef.current];

    if (!nextPuzzle?.Moves) {
      console.error("Selected puzzle has no moves");
      return;
    }

    currentPuzzleRef.current = nextPuzzle;
    isPuzzleEndRef.current = false;
    setHighlightSquares([]);
    setThemeList(nextPuzzle.Themes.split(" "));

    setStateAsActive(nextPuzzle);
    updateInfoBox(nextPuzzle.Themes.split(" "));
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
    };

    socket.sendMove(computerMove);
    socket.sendLastMove(computerMove.from, computerMove.to);

    // Optimistically update highlights
    setHighlightSquares([computerMove.from, computerMove.to]);

    if (chessBoardRef.current) {
      chessBoardRef.current.highlightMove(computerMove.from, computerMove.to);
    }
  };

  const handlePlayerMove = (move: Move) => {
    if (
      isPuzzleEndRef.current ||
      !moveListRef.current ||
      moveListRef.current.length === 0
    ) {
      return;
    }

    const playerAttemptedMove = `${move.from}${move.to}${move.promotion || ""}`;
    const expectedPlayerMove = moveListRef.current[0];

    const isCorrect =
      playerAttemptedMove === expectedPlayerMove ||
      playerAttemptedMove === expectedPlayerMove.substring(0, 4);

    if (isCorrect) {
      moveListRef.current.shift();
      setHighlightSquares([move.from, move.to]);

      // Get new FEN from ChessBoard (it already made the move)
      const newFen = chessBoardRef.current?.getFen();
      if (newFen) {
        setCurrentFEN(newFen);
      }
      move.username = username;
      move.credentials = cookies.login;
      socket.sendMove(move);
      socket.sendLastMove(move.from, move.to);

      if (moveListRef.current.length === 0) {
        isPuzzleEndRef.current = true;
        socket.sendMessage("puzzle completed");
        setTimeout(() => {
          setModal({
            type: "success",
            title: "Puzzle completed",
            message: "Good job!",
            onConfirm: () => socket.sendMessage("next puzzle"),
          });
        }, 200);
      } else {
        setTimeout(() => {
          playComputerMove();
        }, 300);
      }
    } else {
      // Wrong move - reset to current position
      setModal({
        type: "error",
        title: "Incorrect move",
        message: "Try again!",
        onConfirm: () => {
          if (currentPuzzleRef.current) {
            startLesson(currentPuzzleRef.current, playerColor);
          }
        },
      });
    }
  };

  const handleInvalidMove = () => {};

  // ============================================================================
  // SOCKET HANDLERS
  // ============================================================================

  const handleSocketMessage = useCallback(
    (msg: string) => {
      if (msg === "puzzle completed") {
        if (status === "guest") {
          setModal({
            type: "success",
            title: "Puzzle completed",
            message: "Good job!",
            onConfirm: () => socket.sendMessage("next puzzle"),
          });
        }
      } else if (msg === "next puzzle") {
        closeModal();

        if (status === "guest") {
          setModal({ type: "loading", title: "Loading next puzzle", message: "Please wait…" });
        }

        getNextPuzzleRef.current?.();
      } else if (msg === "new game received") {
        closeModal();
      } else if (msg.startsWith("<div")) {
        if (status === "guest") {
          const hintText = document.getElementById("hint-text");
          if (hintText) {
            hintText.innerHTML = msg;
            hintText.style.display = "none";
          }
        }
      }
    },
    [status]
  );

  const socket = useChessSocket({
    student: studentId,
    mentor: mentorId,
    role: role,
    serverUrl: environment.urls.chessServerURL,
    mode: "puzzle",

    onBoardStateChange: (newFEN) => {
      setCurrentFEN(newFEN);
      // ChessBoard will sync its own gameRef from the fen prop
    },

    onMessage: handleSocketMessage,

    onRoleAssigned: (assignedRole) => {
      if (assignedRole === "host") {
        setStatus("host");
        initializeComponentRef.current?.();

        if (styleType === "profile" && status !== "") {
          setModal({
            type: "success",
            title: role === "student" ? "Your mentor has left!" : "Your student has left!",
            message: "Creating a new puzzle for you.",
          });
        }
      } else if (assignedRole === "guest") {
        const wasHost = status === "host";
        setStatus("guest");

        if (wasHost) {
          setModal({
            type: "success",
            title: role === "student" ? "Your mentor has joined you!" : "Your student has joined you!",
            message: "You can now also see their moves.",
          });
        } else {
          setModal({
            type: "success",
            title: role === "student" ? "You joined your mentor's puzzle!" : "You joined your student's puzzle!",
            message: "Have fun collaborating.",
          });
        }
      }
    },

    onLastMove: (from, to) => {
      setHighlightSquares([from, to]);
      if (chessBoardRef.current) {
        chessBoardRef.current.highlightMove(from, to);
      }
    },

    onError: (msg) => {
      console.error("Socket error:", msg);
    },
  });

  // ============================================================================
  // HINT SYSTEM
  // ============================================================================

  const updateInfoBox = (themes?: string[]) => {
    const currentThemes = themes || themeList;
    if (!currentThemes || currentThemes.length === 0) return;

    const rating = currentPuzzleRef.current?.Rating || "N/A";

    let hints = `<div style="margin-bottom: 14px;"><b>Puzzle Rating:</b> ${rating}</div>`;

    for (const key of currentThemes) {
      const name = themesName[key] || key;
      const desc = themesDescription[key];

      if (!desc || desc === "No description available") continue;
      hints += `<div style="margin-bottom: 14px;"><b>${name}:</b> ${desc}</div>`;
    }

    socket.sendMessage(hints);

    const hintText = document.getElementById("hint-text");
    if (hintText) {
      hintText.innerHTML = hints;
      hintText.style.display = "none";
    }
  };

  const openDialog = () => {
    const hintText = document.getElementById("hint-text");
    if (hintText) {
      hintText.style.display =
        hintText.style.display === "block" ? "none" : "block";
    }
  };

  // ============================================================================
  // TIME TRACKING
  // ============================================================================

  async function startRecording() {
    const uInfo = await SetPermissionLevel(cookies);
    if (uInfo?.error) return;

    setUsername(uInfo?.username);

    try {
      const response = await fetch(
        `${environment.urls.middlewareURL}/timeTracking/start?username=${uInfo.username}&eventType=puzzle`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${cookies.login}` },
        }
      );

      if (response.status !== 200) {
        console.error("Time tracking error:", response);
        return;
      }

      const data = await response.json();
      setEventID(data.eventId);
      setStartTime(data.startTime);
    } catch (err) {
      console.error("Failed to start time tracking:", err);
    }
  }

  handleUnloadRef.current = async () => {
    if (!startTime || !username || !eventID) return;

    try {
      const startDate = new Date(startTime);
      const endDate = new Date();
      const diffInSeconds = Math.floor(
        (endDate.getTime() - startDate.getTime()) / 1000
      );

      const response = await fetch(
        `${environment.urls.middlewareURL}/timeTracking/update?username=${username}&eventType=puzzle&eventId=${eventID}&totalTime=${diffInSeconds}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${cookies.login}` },
        }
      );

      if (response.status !== 200) {
        console.error("Time tracking update error:", response);
      }
    } catch (err) {
      console.error("Time tracking error:", err);
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    startRecording();
    window.addEventListener("beforeunload", handleUnloadRef.current);

    return () => {
      window.removeEventListener("beforeunload", handleUnloadRef.current);
      handleUnloadRef.current();
    };
  }, []);

  useEffect(() => {
    if (
      selectedTheme &&
      socket.connected &&
      status === "" &&
      !isInitialized &&
      !isInitializingRef.current
    ) {
      socket.startNewPuzzle();
    }
  }, [selectedTheme, socket.connected, status, isInitialized, socket]);

  useEffect(() => {
    if (
      selectedTheme &&
      socket.connected &&
      status === "host" &&
      !isInitialized &&
      !isInitializingRef.current
    ) {
      initializeComponentRef.current?.();
    }
  }, [selectedTheme, socket.connected, status, isInitialized]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const puzzleButtonClass = "btn-green w-full md:w-auto";
  const selectedThemeName = selectedTheme ? getThemeName(selectedTheme) : "";

  if (!selectedTheme) {
    return (
      <>
      <section
        className={
          isProfile
            ? "w-full px-4 py-8"
            : "w-full px-6 py-12 md:px-10"
        }
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 text-left">
          <div className="rounded-3xl border-2 border-dark bg-light p-6 shadow-lg md:p-8">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-primary">
              Puzzle Themes
            </p>
            <h1 className="text-3xl font-extrabold text-dark md:text-5xl">
              Choose what you want to practice
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray md:text-lg">
              Pick a theme to load puzzles tagged with that tactic or game phase.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_PUZZLE_THEMES.map((theme) => {
              return (
                <button
                  key={theme}
                  type="button"
                  className="group min-h-[150px] rounded-2xl border-2 border-dark bg-light p-5 text-left shadow-md transition-transform hover:-translate-y-1 hover:bg-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                  onClick={() => handleThemeSelect(theme)}
                  data-testid={`puzzle-theme-${theme}`}
                >
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                    {theme}
                  </span>
                  <h2 className="mt-3 text-2xl font-extrabold text-dark">
                    {getThemeName(theme)}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-gray">
                    {getThemeDescription(theme)}
                  </p>
                  <span className="mt-5 inline-flex font-bold text-dark group-hover:text-primary">
                    Play this theme
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {modal && <Modal {...modal} onClose={closeModal} />}
      </>
    );
  }

  return (
    <>
    <div className="mx-auto mt-8 flex w-full max-w-5xl flex-col gap-3 px-4 text-left">
      <button
        type="button"
        className="w-fit text-sm font-bold text-primary hover:text-dark"
        onClick={handleBackToThemes}
      >
        Back to puzzle themes
      </button>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Selected Theme
        </p>
        <h1 className="text-3xl font-extrabold text-dark">{selectedThemeName}</h1>
      </div>
    </div>

    <div
      className={
        isProfile
          ? "flex flex-col items-center justify-center mt-8 gap-8 px-4"
          : "flex flex-wrap justify-center items-start mt-8 p-8 gap-12 w-full max-w-5xl mx-auto"
      }
    >
      <div
        className={`w-full max-w-[600px] aspect-square flex-shrink-0 [&_svg_*]:transition-opacity [&_svg_*]:duration-700 ${
          hidePieces ? "[&_svg_*]:opacity-0" : "[&_svg_*]:opacity-100"
        }`}
        data-testid="chess-board-container"
      >
        <ChessBoard
          mode="puzzle"
          ref={chessBoardRef}
          fen={currentFEN || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
          orientation={playerColor}
          highlightSquares={highlightSquares}
          onMove={handlePlayerMove}
          onInvalidMove={handleInvalidMove}
          disabled={isPuzzleEndRef.current || !socket.connected || hidePieces}
        />
      </div>

      <div
        className={
          isProfile
            ? "flex flex-col items-center gap-6 w-full max-w-[600px]"
            : "flex flex-col items-center gap-4 flex-1 min-w-[250px]"
        }
      >
        <div className="flex flex-col gap-4 w-full md:flex-row md:justify-center">
          <button
            className={puzzleButtonClass}
            data-testid="next-puzzle-button"
            onClick={() => {
              isPuzzleEndRef.current = false;
              socket.sendMessage("next puzzle");
            }}
            disabled={!socket.connected}
          >
            Get New Puzzle
          </button>

          <button
            className={puzzleButtonClass}
            data-testid="hint-button"
            onClick={openDialog}
            disabled={!socket.connected}
          >
            Show Hint
          </button>
        </div>

        <div
          id="hint-text"
          className="w-full max-w-[600px] p-6 bg-light rounded-lg shadow text-base leading-relaxed text-dark text-left"
          style={{ display: "none" }}
        ></div>
      </div>
    </div>

    {modal && <Modal {...modal} onClose={closeModal} />}
    </>
  );
};

export default Puzzles;
