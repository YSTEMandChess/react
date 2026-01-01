import React, { useRef, useState, useEffect, useCallback } from "react";
import pageStyles from "./Puzzles.module.scss";
import profileStyles from "./Puzzles-profile.module.scss";
import { themesName, themesDescription } from "../../../core/services/themesService";
import Swal from 'sweetalert2';
import { environment } from "../../../environments/environment";
import { v4 as uuidv4 } from "uuid";
import { SetPermissionLevel } from "../../../globals";
import { useCookies } from 'react-cookie';
import ChessBoard, { ChessBoardRef } from '../../../components/ChessBoard/ChessBoard';
import { useChessSocket } from '../../../features/lessons/piece-lessons/lesson-overlay/hooks/useChessSocket';
import { Move } from "../../../core/types/chess";

type PuzzlesProps = {
  student?: any;
  mentor?: any;
  role?: any;
  styleType?: any;
};

// Helper function to normalize FEN (same as in socket)
const normalizeFen = (fen: string): string => {
  if (!fen || typeof fen !== 'string') {
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  }

  const trimmed = fen.trim();
  const parts = trimmed.split(" ");

  if (parts.length === 6) return trimmed;
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
  styleType = "page"
}) => {
  const styles = styleType === "profile" ? profileStyles : pageStyles;

  // Refs
  const chessBoardRef = useRef<ChessBoardRef>(null);
  const swalRef = useRef<string>("");
  const moveListRef = useRef<string[]>([]);
  const isPuzzleEndRef = useRef(false);
  const currentPuzzleRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const handleUnloadRef = useRef(() => { });
  const puzzleArrayRef = useRef<any[]>([]);
  const dbIndexRef = useRef(0);
  const getNextPuzzleRef = useRef<() => void>();
  const initializeComponentRef = useRef<() => Promise<void>>();

  // State
  const [puzzleArray, setPuzzleArray] = useState<any[]>([]);
  const [currentFEN, setCurrentFEN] = useState<string>('');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [themeList, setThemeList] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cookies] = useCookies(['login']);

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

  const initPuzzleArray = async () => {
    try {
      const response = await fetch(`${environment.urls.middlewareURL}/puzzles/random?limit=20`);
      if (response.ok) {
        const jsonData = await response.json();
        setPuzzleArray(jsonData);
        puzzleArrayRef.current = jsonData;
        return jsonData;
      } else {
        throw new Error('Failed to fetch puzzles from backend');
      }
    } catch (error) {
      console.error('Error fetching puzzles:', error);
      setPuzzleArray([]);
      puzzleArrayRef.current = [];
      return [];
    }
  };

  const prefetchPuzzles = async () => {
    try {
      const response = await fetch(`${environment.urls.middlewareURL}/puzzles/random?limit=20`);
      if (response.ok) {
        const jsonData = await response.json();
        setPuzzleArray(prev => {
          const newArray = [...prev, ...jsonData];
          puzzleArrayRef.current = newArray;
          return newArray;
        });
      }
    } catch (error) {
      console.error('Error prefetching puzzles:', error);
    }
  };

  // Prefetch when running low
  useEffect(() => {
    if (puzzleArray.length > 0 && dbIndexRef.current >= puzzleArray.length - 5) {
      prefetchPuzzles();
    }
  }, [puzzleArray.length]);

  initializeComponentRef.current = async () => {
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
    const newPlayerColor = sideToMove === 'w' ? 'black' : 'white';
    setPlayerColor(newPlayerColor);

    currentPuzzleRef.current = state;
    startLesson(state, newPlayerColor);
  };

  const startLesson = (puzzle: any, color: 'white' | 'black') => {
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
      initPuzzleArray().then(puzzles => {
        if (puzzles && puzzles.length > 0) {
          dbIndexRef.current = 0;
          setStateAsActive(puzzles[0]);
          updateInfoBox(puzzles[0].Themes.split(" "));
        }
      });
      return;
    }

    dbIndexRef.current = (dbIndexRef.current + 1) % puzzleArrayRef.current.length;
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
      promotion: computerMoveStr.length > 4 ? computerMoveStr[4] as 'q' | 'r' | 'b' | 'n' : undefined
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
    if (isPuzzleEndRef.current || !moveListRef.current || moveListRef.current.length === 0) {
      return;
    }

    const playerAttemptedMove = `${move.from}${move.to}${move.promotion || ''}`;
    const expectedPlayerMove = moveListRef.current[0];

    const isCorrect = playerAttemptedMove === expectedPlayerMove ||
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
          Swal.fire('Puzzle completed', 'Good Job', 'success').then((result) => {
            if (result.isConfirmed) {
              socket.sendMessage("next puzzle");
            }
          });
        }, 200);
      } else {
        setTimeout(() => {
          playComputerMove();
        }, 300);
      }
    } else {
      // Wrong move - reset to current position
      Swal.fire('Incorrect move', 'Try again!', 'error').then(() => {
        if (currentPuzzleRef.current) {
          startLesson(currentPuzzleRef.current, playerColor);
        }
      });
    }
  };

  const handleInvalidMove = () => {
  };

  // ============================================================================
  // SOCKET HANDLERS
  // ============================================================================

  const handleSocketMessage = useCallback((msg: string) => {
    if (msg === "puzzle completed") {
      if (status === "guest") {
        Swal.fire('Puzzle completed', 'Good Job', 'success').then((result) => {
          if (result.isConfirmed) {
            socket.sendMessage("next puzzle");
          }
        });
      }
    } else if (msg === "next puzzle") {
      Swal.close();

      if (status === "guest") {
        Swal.fire({
          title: 'Loading next puzzle',
          text: 'Please wait...',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
            swalRef.current = "loading";
          },
          willClose: () => {
            swalRef.current = "";
          }
        });
      }

      getNextPuzzleRef.current?.();
    } else if (msg === "new game received") {
      if (swalRef.current === "loading") Swal.close();
    } else if (msg.startsWith("<div")) {
      if (status === "guest") {
        const hintText = document.getElementById("hint-text");
        if (hintText) {
          hintText.innerHTML = msg;
          hintText.style.display = "none";
        }
      }
    }
  }, [status]);

  const socket = useChessSocket({
    student: studentId,
    mentor: mentorId,
    role: role,
    serverUrl: environment.urls.chessServerURL,
    mode: 'puzzle',

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
          const message = role === "student"
            ? 'Your mentor has left! Creating a new puzzle for you'
            : 'Your student has left! Creating a new puzzle for you';
          Swal.fire(message.split('!')[0] + '!', message.split('!')[1], 'success');
        }
      } else if (assignedRole === "guest") {
        const wasHost = status === "host";
        setStatus("guest");

        if (wasHost) {
          const message = role === "student"
            ? 'Your mentor has joined you! You can now also see their moves'
            : 'Your student has joined you! You can now also see their moves';
          Swal.fire(message.split('!')[0] + '!', message.split('!')[1], 'success');
        } else {
          const message = role === "student"
            ? 'You joined your mentor\'s puzzle! Have fun collaborating.'
            : 'You joined your student\'s puzzle! Have fun collaborating.';
          Swal.fire(message.split('!')[0] + '!', message.split('!')[1], 'success');
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

    const rating = currentPuzzleRef.current?.Rating || 'N/A';

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
    const hintText = document.getElementById('hint-text');
    if (hintText) {
      hintText.style.display = hintText.style.display === "block" ? "none" : "block";
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
          method: 'POST',
          headers: { 'Authorization': `Bearer ${cookies.login}` }
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
      const diffInSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

      const response = await fetch(
        `${environment.urls.middlewareURL}/timeTracking/update?username=${username}&eventType=puzzle&eventId=${eventID}&totalTime=${diffInSeconds}`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${cookies.login}` }
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
    window.addEventListener('beforeunload', handleUnloadRef.current);

    return () => {
      window.removeEventListener('beforeunload', handleUnloadRef.current);
      handleUnloadRef.current();
      Swal.close();
    };
  }, []);

  useEffect(() => {
    if (socket.connected && status === "" && !isInitialized && !isInitializingRef.current) {
      socket.startNewPuzzle();
    }
  }, [socket.connected, status, isInitialized, socket]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={styles.mainElements}>
      {!currentFEN ? (
        <div>Loading puzzle...</div>
      ) : (
        <div className={styles.chessBoardContainer}>
          <ChessBoard
            mode="puzzle"
            ref={chessBoardRef}
            fen={currentFEN}
            orientation={playerColor}
            highlightSquares={highlightSquares}
            onMove={handlePlayerMove}
            onInvalidMove={handleInvalidMove}
            disabled={isPuzzleEndRef.current || !socket.connected}
          />
        </div>
      )}

      <div className={styles.hintMenu}>
        <div className={styles.hintButtonRow}>
          <button
            className={styles.puzzleButton}
            onClick={() => {
              isPuzzleEndRef.current = false;
              socket.sendMessage("next puzzle");
            }}
            disabled={!socket.connected}
          >
            Get New Puzzle
          </button>

          <button
            className={styles.puzzleButton}
            onClick={openDialog}
            disabled={!socket.connected}
          >
            Show Hint
          </button>
        </div>

        <div
          id="hint-text"
          className={styles.hintText}
          style={{ display: 'none' }}
        ></div>
      </div>
    </div>
  );
};

export default Puzzles;