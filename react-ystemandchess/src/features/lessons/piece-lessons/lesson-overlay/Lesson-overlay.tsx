import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useCookies } from 'react-cookie';
import { Chess } from 'chess.js';
import pageStyles from './Lesson-overlay.module.scss';
import profileStyles from './Lesson-overlay-profile.module.scss';
import MoveTracker from '../move-tracker/MoveTracker';
import { environment } from "../../../../environments/environment";
import ChessBoard, { ChessBoardRef } from '../../../../components/ChessBoard/ChessBoard';
import { Move } from "../../../../core/types/chess";
import { ReactComponent as RedoIcon } from '../../../../assets/images/icons/icon_redo.svg';
import { ReactComponent as BackIcon } from '../../../../assets/images/icons/icon_back.svg';
import { ReactComponent as BackIconInactive } from '../../../../assets/images/icons/icon_back_inactive.svg';
import { ReactComponent as NextIcon } from '../../../../assets/images/icons/icon_next.svg';
import { ReactComponent as NextIconInactive } from '../../../../assets/images/icons/icon_next_inactive.svg';
import { useNavigate, useLocation } from 'react-router';
import PromotionPopup from '../../lessons-main/PromotionPopup';

// Custom Hooks
import { useChessGameLogic } from './hooks/useChessGameLogic';
import { useLessonManager } from './hooks/useLessonManager';
import { useChessSocket } from './hooks/useChessSocket';
import { useTimeTracking } from './hooks/useTimeTracking';

type LessonOverlayProps = {
  propPieceName?: any;
  propLessonNumber?: any;
  navigateFunc?: any;
  styleType?: any;
  onChessMove?: (fen: string) => void;
  onChessReset?: (fen: string) => void;
};

const LessonOverlay: React.FC<LessonOverlayProps> = ({
  propPieceName = null,
  propLessonNumber = null,
  navigateFunc = null,
  styleType = "page",
  onChessMove,
  onChessReset,
}) => {
  const styles = styleType === 'profile' ? profileStyles : pageStyles;
  const navigate = useNavigate();
  const location = useLocation();
  const [cookies] = useCookies(['login']);

  const chessBoardRef = useRef<ChessBoardRef>(null);

  // Lesson information
  const [piece, setPiece] = useState(propPieceName || location.state?.piece || "");
  const [initialLessonNum] = useState(propLessonNumber ?? location.state?.lessonNum ?? 0);
  const [currentFEN, setCurrentFEN] = useState<string>("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
  const [name, setName] = useState("");
  const [info, setInfo] = useState("");
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // Move tracking
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [highlightSquares, setHighlightSquares] = useState<string[]>([]);

  // Popups
  const [showVPopup, setShowVPopup] = useState(false);
  const [showXPopup, setShowXPopup] = useState(false);
  const [ShowError, setShowError] = useState(false);
  const [showLPopup, setShowLPopup] = useState(true);
  const [showInstruction, setShowInstruction] = useState(false);
  const [allLessonsDone, setAllLessonsDone] = useState(false);

  // Promotion
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionSource, setPromotionSource] = useState("");
  const [promotionTarget, setPromotionTarget] = useState("");

  const [hidePieces, setHidePieces] = useState(true);

  // Refs for lesson data
  const lessonStartFENRef = useRef<string>("");
  const lessonEndFENRef = useRef<string>("");
  const lessonTypeRef = useRef<string>("default");
  const isInitializedRef = useRef<boolean>(false);

  // Initialize socket with all callbacks
  const socket = useChessSocket({
    student: styleType === 'profile' ? cookies.login?.studentId : "guest_student",
    mentor: "mentor_" + piece,
    role: 'student',
    serverUrl: environment.urls.chessServerURL,
    mode: 'lesson',

    // Board state changes (PRIMARY SOURCE OF TRUTH)
    onBoardStateChange: (newFEN, color) => {
      setCurrentFEN(newFEN);

      if (color) {
        setBoardOrientation(color);
      }

      // Notify parent if callback provided
      if (onChessMove) onChessMove(newFEN);

      // Check lesson completion
      checkLessonCompletion(newFEN);
    },

    // Move highlighting
    onLastMove: (from, to) => {
      setHighlightSquares([from, to]);
      if (chessBoardRef.current) {
        chessBoardRef.current.highlightMove(from, to);
      }
    },

    // Color assignment
    onColorAssigned: (color) => {
      setBoardOrientation(color);
      if (chessBoardRef.current) {
        chessBoardRef.current.setOrientation(color);
      }
    },

    // Reset handler
    onReset: () => {
      handleReset();
    },

    // Error handler
    onError: (msg) => {
      console.error("Socket error:", msg);
      setShowError(true);
    },
  });

  const {
    lessonData,
    lessonNum,
    completedNum,
    totalLessons,
    refreshProgress,
    goToLesson,
    nextLesson: managerNextLesson,
    prevLesson: managerPrevLesson,
    updateCompletion,
    setLessonNum,
  } = useLessonManager(piece, cookies, initialLessonNum);

  const {
    moves,
    processMove,
    resetLesson,
  } = useChessGameLogic();

  useTimeTracking(piece, cookies);

  // Update piece from props
  useEffect(() => {
    if (propPieceName) setPiece(propPieceName);
  }, [propPieceName]);

  // Initialize lesson progress
  useEffect(() => {
    setShowLPopup(true);
    refreshProgress(initialLessonNum).finally(() => {
      setShowLPopup(false);
    });
  }, [piece, initialLessonNum, refreshProgress]);

  useEffect(() => {
    if (!lessonData?.startFen) return;
    if (!socket.connected) {
      return;
    }

    setHidePieces(false);
    setShowLPopup(false);
    setShowInstruction(true);

    // Check if all lessons completed
    if (!lessonData.lessonNum && lessonNum >= totalLessons - 1) {
      setAllLessonsDone(true);
      return;
    }

    // Update lesson refs
    lessonStartFENRef.current = lessonData.startFen;
    lessonEndFENRef.current = lessonData.endFen;

    // Set initial position locally
    setCurrentFEN(lessonData.startFen);

    // Determine turn from FEN
    const turn = getTurnFromFEN(lessonData.startFen);
    const color = turn === 'white' ? 'white' : 'black';
    setBoardOrientation(color);

    // Update lesson info
    setInfo(lessonData.info || "");
    setName(lessonData.name || "");

    // Determine lesson type
    const infoLower = (lessonData.info || "").toLowerCase();
    const nameLower = (lessonData.name || "").toLowerCase();

    if (infoLower.includes("checkmate the opponent") || nameLower.includes("= win")) {
      lessonTypeRef.current = "checkmate";
    } else if (infoLower.includes("get a winning position")) {
      lessonTypeRef.current = "position";
    } else if (infoLower.includes("equalize in")) {
      lessonTypeRef.current = "equalize";
    } else if (infoLower.includes("promote your pawn")) {
      lessonTypeRef.current = "promote";
    } else if (infoLower.includes("hold the draw") || nameLower.includes("draw")) {
      lessonTypeRef.current = "draw";
    } else {
      lessonTypeRef.current = "default";
    }

    // Initialize game on server with delay to ensure socket is ready
    isInitializedRef.current = false;
    const initTimer = setTimeout(() => {
      initializeLessonOnServer();
    }, 100);

    return () => clearTimeout(initTimer);

  }, [lessonData, socket.connected]);

  // Instruction popup with progress bar
  useEffect(() => {
    if (!showInstruction) return;

    const wordCount = info ? info.split(/\s+/).length : 0;
    const totalTime = Math.min(20000, 3000 + wordCount * 300);

    let startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / totalTime) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setIsFading(true);
        setTimeout(() => setShowInstruction(false), 500);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [showInstruction, info]);

  const initializeLessonOnServer = useCallback(() => {
    if (!lessonData || isInitializedRef.current) return;
    if (!socket.connected) {
      return;
    }

    isInitializedRef.current = true;

    // Determine player color from FEN
    const turn = getTurnFromFEN(lessonData.startFen);
    const playerColor = turn === 'white' ? 'white' : 'black';

    // Send lesson state to server
    socket.setGameStateWithColor(
      lessonData.startFen,
      playerColor,
      lessonData.info
    );

  }, [lessonData, socket]);

  const checkLessonCompletion = useCallback((fen: string) => {
    if (!lessonEndFENRef.current) return;

    const lessonType = lessonTypeRef.current;

    // Exact FEN match for position-based lessons
    if (lessonType === "position" || lessonType === "equalize") {
      if (fen === lessonEndFENRef.current) {
        setShowVPopup(true);
        return;
      }
    }

    // For other types, check game state
    const game = new Chess(fen);

    if (lessonType === "checkmate" && game.isCheckmate()) {
      setShowVPopup(true);
    } else if (lessonType === "draw" && game.isDraw()) {
      setShowVPopup(true);
    } else if (lessonType === "promote") {
      // Check if a new queen was added (pawn promoted)
      const startQueens = (lessonStartFENRef.current.match(/[Qq]/g) || []).length;
      const currentQueens = (fen.match(/[Qq]/g) || []).length;

      if (currentQueens > startQueens) {
        setShowVPopup(true);
      }
    }

  }, []);

  function getTurnFromFEN(fen: string): 'white' | 'black' {
    if (!fen || typeof fen !== 'string') {
      return 'white';
    }
    const parts = fen.split(' ');
    return parts[1] === 'w' ? 'white' : 'black';
  }

  const handleMove = useCallback((move: Move) => {
    try {
      // Process move locally
      processMove();

      // Add to history
      setMoveHistory(prev => [...prev, `${move.from}-${move.to}`]);

      // Send to server
      socket.sendMove(move);
      socket.sendLastMove(move.from, move.to);

    } catch (error) {
      console.error("Error handling move:", error);
      setShowError(true);
    }
  }, [socket, processMove]);

  const handleInvalidMove = useCallback(() => {
    // Show a brief error message instead of breaking
    const errorTimeout = setTimeout(() => {
      // Could add a toast notification here
    }, 2000);
    return () => clearTimeout(errorTimeout);
  }, []);

  const undoMove = useCallback(() => {
    if (!chessBoardRef.current) return;
    if (moveHistory.length === 0) return;

    // Undo locally
    chessBoardRef.current.undo();

    // Update history
    setMoveHistory(prev => prev.slice(0, -1));

    // Send to server
    socket.undo();

  }, [socket, moveHistory.length]);

  const handleReset = useCallback(() => {

    if (chessBoardRef.current) {
      chessBoardRef.current.reset();
    }

    // Reset to lesson start position
    const startFen = lessonStartFENRef.current;
    setCurrentFEN(startFen);
    setMoveHistory([]);
    setHighlightSquares([]);

    // Reset on server
    socket.setGameState(startFen);

    // Notify parent
    if (onChessReset) onChessReset(startFen);

    // Reset game logic
    resetLesson(startFen);

  }, [socket, onChessReset, resetLesson]);

  const previousLesson = async () => {
    isInitializedRef.current = false;
    await managerPrevLesson();
    resetLesson(null);
    setMoveHistory([]);
    setHighlightSquares([]);
  };

  const nextLesson = async () => {
    isInitializedRef.current = false;
    await managerNextLesson();
    resetLesson(null);
    setMoveHistory([]);
    setHighlightSquares([]);
  };

  const handleVPopup = async () => {
    setShowVPopup(false);
    setShowXPopup(false);

    await updateCompletion();

    // Reset for next attempt
    resetLesson(lessonStartFENRef.current);
    setMoveHistory([]);
  };

  const handleXPopup = () => {
    setShowXPopup(false);
    handleReset();
  };

  const promotePawn = (to: string, piece: string) => {
    setIsPromoting(false);

    if (chessBoardRef.current) {
      chessBoardRef.current.handlePromotion(promotionSource, promotionTarget, piece.toLowerCase());
    }

    const move: Move = {
      from: promotionSource,
      to: promotionTarget,
      promotion: piece.toLowerCase()
    };

    socket.sendMove(move);
    processMove();
  };

  return (
    <div className={styles.lessonContainer}>
      <div className={styles.buttonContainer}>
        <div className={styles.controlButtonsWrapper}>
          <button
            className={styles.controlButton}
            onClick={() => chessBoardRef.current?.flip()}
          >
            Flip board
          </button>
          <button
            className={styles.controlButton}
            onClick={undoMove}
            disabled={moveHistory.length === 0}
          >
            Undo
          </button>
        </div>
        <div
          className={styles.switchLesson}
          onClick={() => {
            if (navigateFunc) navigateFunc();
            else navigate("/lessons-selection");
          }}
        >
          Switch Lesson
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.rightContainer}>
          {/* Lesson info */}
          <div className={styles.lessonHeader}>
            <h1 className={styles.pieceDescription}>{piece}</h1>
            <button
              className={styles.resetLesson}
              data-testid="reset-button"
              onClick={handleReset}
            >
              <RedoIcon />
            </button>
          </div>

          <h1 className={styles.subheading}>
            {lessonNum + 1} / {totalLessons}: {name}
          </h1>

          <p className={styles.lessonDescription}>{info}</p>

          {/* Navigation buttons */}
          <div className={styles.prevNextContainer}>
            {lessonNum <= 0 ? (
              <button className={[styles.prevNextLessonButtonInactive, styles.prev].join(' ')}>
                <BackIconInactive />
                <p className={styles.buttonDescription}>Back</p>
              </button>
            ) : (
              <button
                className={[styles.prevNextLessonButton, styles.prev].join(' ')}
                onClick={previousLesson}
              >
                <BackIcon />
                <p className={styles.buttonDescription}>Back</p>
              </button>
            )}

            {((lessonNum >= completedNum) || (lessonNum >= totalLessons - 1)) ? (
              <button className={[styles.prevNextLessonButtonInactive, styles.next].join(' ')}>
                <p className={styles.buttonDescription}>Next</p>
                <NextIconInactive />
              </button>
            ) : (
              <button
                className={[styles.prevNextLessonButton, styles.next].join(' ')}
                onClick={nextLesson}
              >
                <p className={styles.buttonDescription}>Next</p>
                <NextIcon />
              </button>
            )}
          </div>

          {/* Move tracker */}
          {styleType !== 'profile' && <MoveTracker moves={moves} />}
        </div>

        {/* Chessboard */}
        <div className={`${styles.chessboardContainer} ${hidePieces ? styles.hidePieces : ""}`}>
          <ChessBoard
            mode="lesson"
            ref={chessBoardRef}
            fen={currentFEN}
            orientation={boardOrientation}
            lessonMoves={lessonData?.moves || []}
            highlightSquares={highlightSquares}
            onMove={handleMove}
            onInvalidMove={handleInvalidMove}
            onPromotion={promotePawn}
            disabled={!socket.connected}
          />
        </div>
      </div>

      {/* POPUPS */}

      {/* Connection error */}
      {ShowError && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <div className={styles.errorCross}>
              <svg width="80" height="80" viewBox="0 0 120 120">
                <circle className={styles.circle} cx="60" cy="60" r="54" fill="none" stroke="#f57c7c" strokeWidth="6" />
                <path d="M40 40 L80 80" fill="none" stroke="#f57c7c" strokeWidth="8" strokeLinecap="round" />
                <path d="M80 40 L40 80" fill="none" stroke="#f57c7c" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>
            <p className={styles.popupHeader}>Failed to load content</p>
            <p className={styles.popupSubheading}>Please reload page</p>
          </div>
        </div>
      )}

      {/* Lesson completed */}
      {showVPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <div className={styles.successCheckmark}>
              <svg width="80" height="80" viewBox="0 0 120 120">
                <circle className={styles.circle} cx="60" cy="60" r="54" fill="none" stroke="#beea8b" strokeWidth="6" />
                <path className={styles.checkmark} d="M35 60 L55 80 L85 40" fill="none" stroke="#beea8b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className={styles.popupHeader}>Lesson completed</p>
            <p className={styles.popupSubheading}>Good job</p>
            <button className={styles.popupButton} onClick={handleVPopup}>OK</button>
          </div>
        </div>
      )}

      {/* Lesson failed */}
      {showXPopup && !showVPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <div className={styles.errorCross}>
              <svg width="80" height="80" viewBox="0 0 120 120">
                <circle className={styles.circle} cx="60" cy="60" r="54" fill="none" stroke="#f57c7c" strokeWidth="6" />
                <path d="M40 40 L80 80" fill="none" stroke="#f57c7c" strokeWidth="8" strokeLinecap="round" />
                <path d="M80 40 L40 80" fill="none" stroke="#f57c7c" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>
            <p className={styles.popupHeader}>Lesson failed</p>
            <p className={styles.popupSubheading}>Please try again</p>
            <button className={styles.popupButton} onClick={handleXPopup}>OK</button>
          </div>
        </div>
      )}

      {/* Loading */}
      {showLPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <div className={styles.loadingSpinner}>
              <svg width="80" height="80" viewBox="0 0 120 120">
                <circle className={styles.spinner} cx="60" cy="60" r="54" fill="none" stroke="#7fcc26" strokeWidth="6" />
              </svg>
            </div>
            <p className={styles.popupHeader}>Loading lesson...</p>
            <p className={styles.popupSubheading}>Please wait</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {showInstruction && (
        <div className={`${styles.popup} ${isFading ? styles.fadeOut : ''}`}>
          <div className={styles.popupContent}>
            <p className={styles.popupHeader}>Lesson Instructions</p>
            <p className={styles.popupSubheading}>{info}</p>
            <div className={styles.loadingBarContainer}>
              <div className={styles.loadingBar} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* All lessons done */}
      {allLessonsDone && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <p className={styles.popupHeader}>🎉 Congratulations!</p>
            <p className={styles.popupSubheading}>You have completed all lessons for this scenario.</p>
            <button className={styles.popupButton} onClick={() => setAllLessonsDone(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Promotion popup */}
      {isPromoting && (
        <PromotionPopup
          position={promotionSource}
          promoteToPiece={promotePawn}
        />
      )}
    </div>
  );
};

export default LessonOverlay;
