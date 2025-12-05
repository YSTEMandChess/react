import React, { useRef, useState, useEffect } from "react";
import pageStyles from "./Puzzles.module.scss";
import profileStyles from "./Puzzles-profile.module.scss";
import { Chess } from "chess.js";
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

const Puzzles: React.FC<PuzzlesProps> = ({
  student = null,
  mentor = null,
  role = "student",
  styleType = "page"
}) => {
  const styles = styleType === "profile" ? profileStyles : pageStyles;

  // Refs
  const chessBoardRef = useRef<ChessBoardRef>(null);
  const gameRef = useRef<Chess>(new Chess());
  const swalRef = useRef<string>("");
  const moveListRef = useRef<string[]>([]);
  const isPuzzleEndRef = useRef(false);
  const currentPuzzleRef = useRef<any>(null);

  // Puzzle state
  const [puzzleArray, setPuzzleArray] = useState<any[]>([]);
  const [currentFEN, setCurrentFEN] = useState<string>('');
  const [dbIndex, setDbIndex] = useState<number>(0);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [themeList, setThemeList] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
  const [cookies] = useCookies(['login']);
  const [isInitialized, setIsInitialized] = useState(false);

  // User identification
  const [studentId] = useState(student || uuidv4());
  const [mentorId] = useState(mentor || uuidv4());

  // Time tracking
  const [eventID, setEventID] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [username, setUsername] = useState(null);
  const handleUnloadRef = useRef(() => { });

  // ============================================================================
  // SOCKET CONNECTION
  // ============================================================================

  const socket = useChessSocket({
    student: studentId,
    mentor: mentorId,
    role: role,
    serverUrl: environment.urls.chessServerURL,
    mode: 'puzzle',

    onBoardStateChange: (newFEN) => {
      console.log("Board state received:", newFEN);
      setCurrentFEN(newFEN);
      gameRef.current.load(newFEN);

      if (chessBoardRef.current) {
        chessBoardRef.current.loadPosition(newFEN);
      }
    },

    onMessage: (msg) => {
      console.log("Message received:", msg);
      handleSocketMessage(msg);
    },

    onRoleAssigned: (assignedRole) => {
      console.log("Role assigned:", assignedRole);
      if (assignedRole === "host") {
        setStatus("host");
        initializeComponent();
        if (styleType === "profile") {
          if (status) {
            if (role === "student") Swal.fire('Your mentor has left!', 'Creating a new puzzle for you', 'success');
            else Swal.fire('Your student has left!', 'Creating a new puzzle for you', 'success');
          } else {
            if (role === "student") Swal.fire('You hosted a new puzzle!', 'Your mentor might join later', 'success');
            else Swal.fire('You hosted a new puzzle!', 'Your student might join later', 'success');
          }
        }
      } else if (assignedRole === "guest") {
        if (status === "host") {
          if (role === "student") Swal.fire('Your mentor has joined you!', 'You can now also see their moves', 'success');
          else Swal.fire('Your student has joined you!', 'You can now also see their moves', 'success');
        } else {
          setStatus("guest");
          if (role === "student") Swal.fire('You joined your mentor\'s puzzle!', 'Have fun collaborating.', 'success');
          else Swal.fire('You joined your student\'s puzzle!', 'Have fun collaborating.', 'success');
        }
      }
    },

    onLastMove: (from, to) => {
      console.log("Highlighting last move:", from, "→", to);
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
  // SOCKET MESSAGE HANDLER
  // ============================================================================

  const handleSocketMessage = (msg: string) => {
    if (msg === "puzzle completed") {
      if (status === "guest") {
        Swal.fire('Puzzle completed', 'Good Job', 'success').then((result) => {
          if (result.isConfirmed) socket.sendMessage("next puzzle");
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
      getNextPuzzle();
    } else if (msg === "new game received") {
      if (swalRef.current === "loading") Swal.close();
    } else if (msg.startsWith("<div")) {
      // HTML hint update from host
      if (status === "guest") {
        const hintText = document.getElementById("hint-text");
        if (hintText) {
          hintText.innerHTML = msg;
          hintText.style.display = "none";
        }
      }
    }
  };

  // ============================================================================
  // PUZZLE INITIALIZATION
  // ============================================================================

  const initPuzzleArray = async () => {
    try {
      const response = await fetch(`${environment.urls.middlewareURL}/puzzles/random?limit=20`);
      if (response.ok) {
        const jsonData = await response.json();
        setPuzzleArray(jsonData);
        return jsonData;
      } else {
        throw new Error('Failed to fetch puzzles from backend');
      }
    } catch (error) {
      console.error('Error fetching puzzles:', error);
      setPuzzleArray([]);
      return [];
    }
  };

  const initializeComponent = async () => {
    if (isInitialized) return;
    setIsInitialized(true);

    const puzzles = await initPuzzleArray();
    if (puzzles && puzzles.length > 0) {
      setPuzzleArray(puzzles);
      const firstPuzzle = puzzles[0];
      currentPuzzleRef.current = firstPuzzle;
      moveListRef.current = firstPuzzle?.Moves?.split(" ") || [];

      if (moveListRef.current.length === 0) {
        console.warn("No valid moves in initial puzzle:", firstPuzzle);
        return;
      }

      setThemeList(firstPuzzle.Themes.split(" "));
      setStateAsActive(firstPuzzle);
      updateInfoBox(firstPuzzle.Themes.split(" "));
    }
  };

  // ============================================================================
  // PUZZLE LOADING
  // ============================================================================

  const setStateAsActive = (state: any) => {
    if (!state?.FEN || !state?.Moves || !state?.Themes) {
      console.warn("Puzzle is missing required fields:", state);
      return;
    }

    console.log("Loading puzzle:", state.PuzzleId);

    const sideToMove = state.FEN.split(" ")[1];
    const newPlayerColor = sideToMove === 'w' ? 'black' : 'white';
    setPlayerColor(newPlayerColor);

    setTimeout(() => {
      currentPuzzleRef.current = state;
      startLesson(state);
    }, 200);
  };

  const startLesson = (puzzle: any) => {
    const fen = puzzle.FEN;

    if (!fen || fen.split("/").length !== 8) {
      console.warn("Invalid or missing FEN:", fen);
      return;
    }

    setCurrentFEN(fen);
    gameRef.current.load(fen);

    moveListRef.current = puzzle?.Moves?.split(" ") || [];
    if (moveListRef.current.length === 0) {
      console.warn("Empty or invalid move list:", puzzle);
      return;
    }

    isPuzzleEndRef.current = false;
    setHighlightSquares([]);

    const puzzleMoves: Move[] = moveListRef.current.map(moveStr => ({
      from: moveStr.substring(0, 2),
      to: moveStr.substring(2, 4),
      promotion: moveStr.length > 4 ? moveStr[4] : undefined
    }));

    socket.setPuzzleMoves(puzzleMoves);

    // Send puzzle to server
    socket.setGameStateWithColor(fen, playerColor, puzzle.Themes);

    if (chessBoardRef.current) {
      chessBoardRef.current.loadPosition(fen);
    }

    setTimeout(() => {
      // Computer plays first move
      playComputerMove();
    }, 500);
  };

  const getNextPuzzle = () => {
    if (!puzzleArray || puzzleArray.length === 0) {
      console.error("Puzzle array is empty");
      return;
    }

    console.log("Getting new puzzle...");

    const newDbIndex = (dbIndex + 1) % puzzleArray.length;
    setDbIndex(newDbIndex);

    const nextPuzzle = puzzleArray[newDbIndex];
    if (!nextPuzzle.Moves) {
      console.error("Selected puzzle has no moves");
      return;
    }

    currentPuzzleRef.current = nextPuzzle;
    isPuzzleEndRef.current = false;
    setHighlightSquares([]);

    setThemeList(nextPuzzle.Themes.split(" "));

    if (!nextPuzzle?.FEN || nextPuzzle.FEN.split("/").length !== 8) {
      console.warn("Skipping puzzle with invalid FEN:", nextPuzzle);
      return;
    }

    setStateAsActive(nextPuzzle);
    updateInfoBox(nextPuzzle.Themes.split(" "));
  };

  // ============================================================================
  // COMPUTER MOVE AUTOMATION
  // ============================================================================

  const playComputerMove = () => {
    if (moveListRef.current.length === 0) return;

    const computerMove = moveListRef.current.shift();
    if (!computerMove || computerMove.length < 4) return;

    const moveFrom = computerMove.substring(0, 2);
    const moveTo = computerMove.substring(2, 4);
    const promotion = computerMove.length > 4 ? computerMove[4] : undefined;

    console.log("Computer move:", moveFrom, "→", moveTo);

    setTimeout(() => {
      // Make move on local board
      try {
        const moveResult = gameRef.current.move({
          from: moveFrom,
          to: moveTo,
          promotion: promotion || 'q'
        });

        if (!moveResult) {
          console.error("Invalid computer move");
          return;
        }

        const newFEN = gameRef.current.fen();
        setCurrentFEN(newFEN);

        if (chessBoardRef.current) {
          chessBoardRef.current.loadPosition(newFEN);
        }

        // Highlight computer's move
        setHighlightSquares([moveFrom, moveTo]);
        if (chessBoardRef.current) {
          chessBoardRef.current.highlightMove(moveFrom, moveTo);
        }

        // Send to server for multiplayer sync
        socket.sendMove({ from: moveFrom, to: moveTo, promotion });
        socket.sendLastMove(moveFrom, moveTo);

      } catch (error) {
        console.error("Invalid computer move:", error);
      }
    }, 300);
  };

  // ============================================================================
  // PLAYER MOVE HANDLER
  // ============================================================================

  const handlePlayerMove = (move: Move) => {
    if (isPuzzleEndRef.current || !moveListRef.current || moveListRef.current.length === 0) {
      console.log("Ignoring move - puzzle ended or no moves left");
      return;
    }

    const playerAttemptedMove = `${move.from}${move.to}${move.promotion || ''}`;
    const expectedPlayerMove = moveListRef.current[0];

    console.log("Player attempted:", playerAttemptedMove, "Expected:", expectedPlayerMove);

    if (playerAttemptedMove === expectedPlayerMove ||
      playerAttemptedMove === expectedPlayerMove.substring(0, 4)) {
      // Correct move
      moveListRef.current.shift(); // Remove player's move

      // Highlight player's move
      setHighlightSquares([move.from, move.to]);

      // Send to server for multiplayer sync
      socket.sendMove(move);
      socket.sendLastMove(move.from, move.to);

      if (moveListRef.current.length === 0) {
        // Puzzle completed!
        isPuzzleEndRef.current = true;
        setTimeout(() => {
          Swal.fire('Puzzle completed', 'Good Job', 'success').then((result) => {
            if (result.isConfirmed) {
              socket.sendMessage("next puzzle");
            }
          });
        }, 200);
        socket.sendMessage("puzzle completed");
      } else {
        // Computer's turn next
        setTimeout(() => {
          playComputerMove();
        }, 500);
      }
    } else {
      // Incorrect move
      console.log("Wrong move!");
      Swal.fire('Incorrect move', 'Try again!', 'error').then(() => {
        // Reset puzzle
        if (currentPuzzleRef.current) {
          startLesson(currentPuzzleRef.current);
        }
      });
    }
  };

  const handleInvalidMove = () => {
    console.log("Invalid move attempted");
  };

  // ============================================================================
  // HINT SYSTEM
  // ============================================================================

  const updateInfoBox = (themes?: string[]) => {
    const currentThemes = themes || themeList;
    if (!currentThemes || currentThemes.length === 0) return;

    const rating = currentPuzzleRef.current?.Rating || 'N/A';

    let hints = `<div style="margin-bottom: 14px;"><b>Puzzle Rating:</b> ${rating}</div>`;

    for (let i = 0; i < currentThemes.length; i++) {
      const key = currentThemes[i];
      const name = themesName[key] || key;
      const desc = themesDescription[key];

      if (!desc || desc === "No description available") continue;

      hints += `<div style="margin-bottom: 14px;"><b>${name}:</b> ${desc}</div>`;
    }

    // Notify other players
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

    const response = await fetch(
      `${environment.urls.middlewareURL}/timeTracking/start?username=${uInfo.username}&eventType=puzzle`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${cookies.login}` }
      }
    );

    if (response.status !== 200) {
      console.log("Time tracking error:", response);
      return;
    }

    const data = await response.json();
    setEventID(data.eventId);
    setStartTime(data.startTime);
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

      if (response.status !== 200) console.log("Time tracking update error:", response);
      console.log("Time spent on puzzles:", diffInSeconds);
    } catch (err) {
      console.log("Time tracking error:", err);
    }
  };

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  useEffect(() => {
    startRecording();
    window.addEventListener('beforeunload', handleUnloadRef.current);

    return () => {
      window.removeEventListener('beforeunload', handleUnloadRef.current);
      handleUnloadRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (socket.connected && status === "" && !isInitialized) {
      // Try joining/creating puzzle
      socket.startNewPuzzle();
    }
  }, [socket.connected, status, isInitialized, socket]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={styles.mainElements}>
      <div className={styles.chessBoardContainer}>
        <ChessBoard
          ref={chessBoardRef}
          fen={currentFEN}
          orientation={playerColor}
          highlightSquares={highlightSquares}
          onMove={handlePlayerMove}
          onInvalidMove={handleInvalidMove}
          disabled={isPuzzleEndRef.current || !socket.connected}
        />

        {!socket.connected && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 1000
          }}>
            Disconnected
          </div>
        )}
      </div>

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