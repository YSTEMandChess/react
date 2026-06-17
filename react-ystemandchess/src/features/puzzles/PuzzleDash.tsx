import React, { useRef, useState, useEffect, useCallback } from "react";
import Modal, { ModalProps } from "../../components/modal/Modal";
import { environment } from "../../environments/environment";
import { v4 as uuidv4 } from "uuid";
import { useCookies } from "react-cookie";
import ChessBoard, { ChessBoardRef } from "../../components/ChessBoard/ChessBoard";
import { useChessSocket } from "../lessons/piece-lessons/lesson-overlay/hooks/useChessSocket";
import { Move } from "../../core/types/chess";
import { SetPermissionLevel } from "../../globals";

const normalizeFen = (fen: string): string => {
  if (!fen || typeof fen !== "string") 
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const trimmed = fen.trim().toLowerCase();
  if (trimmed === "start") 
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  
  const parts = fen.trim().split(/[\s,]+/);
  if (parts.length === 6) return parts.join(" ");
  if (parts.length === 1 && parts[0].split("/").length === 8) return `${parts[0]} w KQkq - 0 1`;
  
  const defaults = ["w", "KQkq", "-", "0", "1"];
  const paddedParts = [...parts];
  while (paddedParts.length < 6) paddedParts.push(defaults[paddedParts.length - 1]);
  return paddedParts.join(" ");
};

// Formats seconds into M:SS
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const PuzzleDash = () => {
  const chessBoardRef = useRef<ChessBoardRef>(null);
  const moveListRef = useRef<string[]>([]);
  const isPuzzleEndRef = useRef(false);
  const currentPuzzleRef = useRef<any>(null);

  const [currentFEN, setCurrentFEN] = useState<string>("");
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [status, setStatus] = useState<string>("");
  const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
  const [cookies] = useCookies(["login"]);
  const [modal, setModal] = useState<Omit<ModalProps, "onClose"> | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // --- DASH SPECIFIC STATE ---
  type DashState = "selection" | "playing" | "results";
  const [dashState, setDashState] = useState<DashState>("selection");
  const [isInitialized, setIsInitialized] = useState(false); 

  // Timer State
  const [timeLimit, setTimeLimit] = useState(60); // Starting selected time
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Stats State
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [highestCombo, setHighestCombo] = useState(0);
  const [blunders, setBlunders] = useState(0);
  const [highestElo, setHighestElo] = useState(0);
  
  // UI Animations
  const [showPenalty, setShowPenalty] = useState(false);

  const studentId = cookies.login?.studentId || uuidv4();
  const mentorId = "puzzle_mentor_" + studentId;

  const closeModal = () => setModal(null);

  // SOCKET INITIALIZATION (Must be at the top!)
  const socket = useChessSocket({
    student: studentId,
    mentor: mentorId,
    role: "student",
    serverUrl: environment.urls.chessServerURL,
    mode: "puzzle",
    onBoardStateChange: (newFEN) => setCurrentFEN(newFEN),
    onRoleAssigned: (r) => setStatus(r),
    onLastMove: (from, to) => {
      setHighlightSquares([from, to]);
      chessBoardRef.current?.highlightMove(from, to);
    },
  });

  useEffect(() => {
    SetPermissionLevel(cookies).then((uInfo) => {
      if (!uInfo?.error) setUsername(uInfo.username);
    });
  }, [cookies]);

  // Fetch the user's permanent high combo from the database
  useEffect(() => {
    if (username) {
      fetch(`${environment.urls.middlewareURL}/user/getUser?username=${username}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.highestDashCombo) {
            setHighestCombo(data.highestDashCombo);
          }
        })
        .catch((err) => console.error("Failed to fetch user data", err));
    }
  }, [username]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Trigger end of game when time hits 0
  useEffect(() => {
    if (timeLeft <= 0 && dashState === "playing") {
      endDash();
    }
  }, [timeLeft, dashState]);


  // --- PUZZLE LOADING LOGIC ---
  const fetchSinglePuzzle = async (currentScore: number) => {
    // Scales up much faster than Streak to challenge them as they go fast!
    const minRating = 600 + (currentScore * 40);
    const maxRating = minRating + 250; 

    try {
      const res = await fetch(`${environment.urls.middlewareURL}/puzzles/random?limit=1&minRating=${minRating}&maxRating=${maxRating}`);
      if (res.ok) {
        const data = await res.json();
        return data[0];
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const loadNextPuzzle = async (currentScore: number) => {
    const puzzle = await fetchSinglePuzzle(currentScore);
    if (puzzle) {
      currentPuzzleRef.current = puzzle;
      moveListRef.current = puzzle.Moves.split(" ");
      
      const normalizedFen = normalizeFen(puzzle.FEN);
      const sideToMove = normalizedFen.split(" ")[1]; 
      const newPlayerColor = sideToMove === "w" ? "black" : "white";

      setPlayerColor(newPlayerColor);
      setCurrentFEN(normalizedFen);

      isPuzzleEndRef.current = false;
      setHighlightSquares([]);
      
      socket.setGameStateWithColor(normalizedFen, newPlayerColor, puzzle.Themes);
      chessBoardRef.current?.clearHighlights();
      
      setTimeout(playComputerMove, 300);
    } else {
      setModal({ type: "error", title: "Error", message: "Failed to load puzzle." });
    }
  };

  // Wait for the backend socket to be completely ready before loading the puzzle
  useEffect(() => {
    if (dashState === "playing" && socket.connected && status === "host" && !isInitialized) {
      setIsInitialized(true);
      loadNextPuzzle(score);
    }
  }, [dashState, socket.connected, status, isInitialized, score, socket]);


  // --- GAME FLOW CONTROLS ---
  const handleStartDash = (minutes: number) => {
    const seconds = minutes * 60;
    setTimeLimit(seconds);
    setTimeLeft(seconds);
    setScore(0);
    setCombo(0);
    setBlunders(0);
    setHighestElo(0);
    
    setDashState("playing");
    setIsInitialized(false);
    setIsTimerRunning(false); // Timer waits for their first move!
    
    if (socket.connected) socket.startNewPuzzle(); 
  };

  const saveHighScore = async (finalScore: number, finalCombo: number) => {
    if (!username) return;
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

  const playComputerMove = () => {
    if (moveListRef.current.length === 0) return;
    const computerMoveStr = moveListRef.current.shift();
    if (!computerMoveStr) return;

    const computerMove: Move = {
      from: computerMoveStr.substring(0, 2),
      to: computerMoveStr.substring(2, 4),
      promotion: computerMoveStr.length > 4 ? (computerMoveStr[4] as any) : undefined,
    };

    socket.sendMove(computerMove);
    socket.sendLastMove(computerMove.from, computerMove.to);
    setHighlightSquares([computerMove.from, computerMove.to]);
    chessBoardRef.current?.highlightMove(computerMove.from, computerMove.to);
  };

  const handlePlayerMove = (move: Move) => {
    if (isPuzzleEndRef.current || moveListRef.current.length === 0 || dashState !== "playing") return;

    // START TIMER ON FIRST MOVE!
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
      if (newFen) setCurrentFEN(newFen);
      
      move.username = username;
      move.credentials = cookies.login;
      socket.sendMove(move);
      socket.sendLastMove(move.from, move.to);

      if (moveListRef.current.length === 0) {
        // PUZZLE SOLVED! Update stats!
        isPuzzleEndRef.current = true;
        
        setScore((s) => s + 1);
        setCombo((c) => {
          const newCombo = c + 1;
          setHighestCombo((hc) => Math.max(hc, newCombo));
          return newCombo;
        });
        
        if (currentPuzzleRef.current?.Rating) {
          setHighestElo((e) => Math.max(e, currentPuzzleRef.current.Rating));
        }
        
        setTimeout(() => {
          setIsInitialized(false); 
          socket.startNewPuzzle(); 
        }, 400); // Shorter delay than streak so they can play faster
      } else {
        setTimeout(playComputerMove, 200);
      }
    } else {
      // WRONG MOVE! Penalty applies!
      chessBoardRef.current?.undo(); // Snap piece back
      
      setBlunders((b) => b + 1);
      setCombo(0); // Break the combo
      setTimeLeft((t) => Math.max(0, t - 5)); // Subtract 5 seconds
      
      // Flash red animation
      setShowPenalty(true);
      setTimeout(() => setShowPenalty(false), 500);
    }
  };

  // --- RENDER SCREENS ---

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
              onClick={() => handleStartDash(mins)}
              className="flex flex-col items-center p-8 bg-light border-2 border-dark rounded-2xl shadow-lg hover:-translate-y-2 hover:bg-soft transition-all group"
            >
              <span className="text-4xl mb-2">⏱️</span>
              <h2 className="text-3xl font-extrabold text-dark">{mins} Min</h2>
              <span className="mt-4 text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Start Dash
              </span>
            </button>
          ))}
        </div>
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
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-8 w-full max-w-4xl mx-auto px-4">
      
      {/* TOP DASHBOARD BAR */}
      <div className="w-full max-w-[600px] flex justify-between items-center mb-6 px-4 py-3 bg-light rounded-xl shadow-md border-b-4 border-dark">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray uppercase">Score</span>
          <span className="text-3xl font-extrabold text-primary">{score}</span>
        </div>
        
        {/* TIMER DISPLAY */}
        <div className={`flex flex-col items-center transition-all ${showPenalty ? "scale-110 text-red-500" : "text-dark"} ${timeLeft <= 10 && isTimerRunning ? "animate-pulse text-red-500" : ""}`}>
          <span className="text-xs font-bold text-gray uppercase">Time Left</span>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-extrabold">{formatTime(timeLeft)}</span>
            {showPenalty && <span className="absolute ml-24 text-red-500 font-bold animate-bounce">-5s</span>}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-gray uppercase">Combo</span>
          <span className="text-2xl font-bold text-dark">🔥 {combo}</span>
        </div>
      </div>

      {/* THE CHESS BOARD */}
      <div className={`w-full max-w-[600px] aspect-square transition-transform duration-200 ${showPenalty ? "rotate-1" : ""}`}>
        <ChessBoard
          mode="puzzle"
          ref={chessBoardRef}
          fen={currentFEN}
          orientation={playerColor}
          highlightSquares={highlightSquares}
          onMove={handlePlayerMove}
          disabled={isPuzzleEndRef.current || !socket.connected || dashState !== "playing"}
        />
      </div>

      {!isTimerRunning && timeLeft === timeLimit && (
        <p className="mt-6 text-xl font-bold text-primary animate-pulse">Make your first move to start the timer!</p>
      )}

      {modal && <Modal {...modal} onClose={closeModal} />}
    </div>
  );
};

export default PuzzleDash;
