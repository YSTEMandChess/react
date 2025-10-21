import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useCookies } from 'react-cookie';
import pageStyles from './Lesson-overlay.module.scss';
import profileStyles from './Lesson-overlay-profile.module.scss';
// @ts-ignore
import MoveTracker from '../move-tracker/MoveTracker';
import ChessBoard from '../../../components/ChessBoard/ChessBoard';
import { ReactComponent as RedoIcon } from '../../../images/icons/icon_redo.svg';
import { ReactComponent as BackIcon } from '../../../images/icons/icon_back.svg';
import { ReactComponent as BackIconInactive } from '../../../images/icons/icon_back_inactive.svg';
import { ReactComponent as NextIcon } from '../../../images/icons/icon_next.svg';
import { ReactComponent as NextIconInactive } from '../../../images/icons/icon_next_inactive.svg';
import { useNavigate, useLocation } from 'react-router';

import PromotionPopup from '../../Lessons/PromotionPopup';

// Custom Hooks
import { useChessGameLogic } from './hooks/useChessGameLogic';
import { useLessonManager } from './hooks/useLessonManager';
import { useSocketChessEngine } from './hooks/useSocketChessEngine';
import { useTimeTracking } from './hooks/useTimeTracking';

// types for the component props
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

  const chessBoardRef = useRef<any>(null);
  const isReadyRef = useRef(false);

  // Information for lesson
  const [piece, setPiece] = useState(propPieceName || location.state?.piece || "");
  const [initialLessonNum] = useState(propLessonNumber ?? location.state?.lessonNum ?? 0);
  const lessonStartFENRef = useRef("");
  const lessonEndFENRef = useRef("");
  const lessonTypeRef = useRef("default");
  const turnRef = useRef("white");
  const [name, setName] = useState(""); // name of lesson
  const [info, setInfo] = useState(""); // description of lesson

  // Information needed for move tracker
  const [level, setLevel] = useState(20);

  // Controlling popups
  const [showVPopup, setShowVPopup] = useState(false);
  const [showXPopup, setShowXPopup] = useState(false);
  const [ShowError, setShowError] = useState(false);
  const [showLPopup, setShowLPopup] = useState(true);
  const [showInstruction, setShowInstruction] = useState(false);

  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionSource, setPromotionSource] = useState("");
  const [promotionTarget, setPromotionTarget] = useState("");

  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentFEN, setCurrentFEN] = useState<string>("");


  useEffect(() => {
    if (propPieceName) setPiece(propPieceName);
  }, [propPieceName]);

  function handleMove(fen: string) {
    // store current FEN (before the new move) into history
    setMoveHistory(prev => [...prev, currentFenRef.current || ""]);

    // update refs/state to the new FEN
    currentFenRef.current = fen;
    setCurrentFEN(fen);

    // process local move logic
    processMove();

    // send to engine (guard socket)
    if (socketRef?.current) {
      socketRef.current.emit("evaluate-fen", { fen, move: "", level });
    }

    // notify parent if UI ready
    if (isReadyRef.current && typeof onChessMove === 'function') {
      onChessMove(fen);
    }
  }

  function undoMove() {
    if (!chessBoardRef.current) return;

    setMoveHistory(prev => {
      if (prev.length === 0) return prev;
      const lastFEN = prev[prev.length - 1];

      // Undo on ChessBoard
      chessBoardRef.current?.undo();

      currentFenRef.current = lastFEN;
      setCurrentFEN(lastFEN);

      return prev.slice(0, -1);
    });
  }

  const handleEvaluationComplete = useCallback((data) => {
    prevFenRef.current = currentFenRef.current;
    currentFenRef.current = data.newFEN;
    processMove();

    if (isReadyRef.current && typeof onChessMove === 'function') {
      onChessMove(data.newFEN);
    }
  }, [onChessMove]);


  // FROM CUSTOM HOOKS
  const socketRef = useSocketChessEngine(handleEvaluationComplete);

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
    currentFenRef,
    prevFenRef
  } = useChessGameLogic();

  useTimeTracking(piece, cookies);


  useEffect(() => {
    // initialize (totals, completed and current lesson) via manager
    setShowLPopup(true);
    refreshProgress(initialLessonNum).finally(() => {
      setShowLPopup(false);
    });
  }, [piece, initialLessonNum, refreshProgress]);

  // react to lessonData changes
  useEffect(() => {
    if (!lessonData || !lessonData.startFen) return;

    setShowLPopup(false);
    setShowInstruction(true);

    // Check if we've reached the end of lessons
    if (!lessonData.lessonNum) {
      alert('Congratulations! You have completed all lessons for this piece.');
      return
    }

    // Update lesson data & info
    lessonStartFENRef.current = lessonData.startFen
    lessonEndFENRef.current = lessonData.endFen
    currentFenRef.current = lessonData.startFen
    setCurrentFEN(lessonData.startFen);

    try {
      turnRef.current = getTurnFromFEN(lessonData.startFen);
    } catch (err) {
      console.warn("Failed to parse turn from FEN", err);
      turnRef.current = "white";
    }

    setInfo(lessonData.info || "")
    setName(lessonData.name || "")

    // update lesson type for completion checking (case-insensitive)
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

    // Update the session's fen only if socket is ready
    if (socketRef?.current?.connected) {
      socketRef.current.emit("update-fen", { fen: lessonData.startFen });
    }

    sendLessonToChessBoard();

  }, [lessonData, socketRef]);


  // send lesson to chess client to update UI
  const sendLessonToChessBoard = () => {
    if (!lessonData) return;
    if (typeof onChessMove === 'function') {
      onChessMove(lessonStartFENRef.current);
    }
  };

  // Navigate to previous lesson
  const previousLesson = async () => {
    await managerPrevLesson();
    resetLesson(null);
  }

  // Navigate to next lesson
  const nextLesson = async () => {
    await managerNextLesson();
    // clear move tracker
    resetLesson(null);
  };

  // reset board to play again
  function handleReset() {
    // Update chessboard through callback
    if (typeof onChessReset === "function") {
      onChessReset(lessonStartFENRef.current);  // reset ChessClient FEN
    }

    // reset move tracker and clear local history
    resetLesson(lessonStartFENRef.current);
    setMoveHistory([]);
    // also reset current fen ref/state to lesson start
    currentFenRef.current = lessonStartFENRef.current;
    setCurrentFEN(lessonStartFENRef.current);
  }


  // user agrees to complete lesson
  const handleVPopup = async() => {
    setShowVPopup(false); // disable popup
    setShowXPopup(false);
    
    await updateCompletion();

    // clean move tracker
    resetLesson(lessonStartFENRef.current)
  }

  // user agrees to restart lesson after failure
  const handleXPopup = () => {
    setShowXPopup(false);
    handleReset()
  }

  // user finished instruction reading
  const handleShowInstruction = () => {
    setShowInstruction(false);
  }

  function getTurnFromFEN(fen) {
    if (!fen || typeof fen !== 'string') {
      throw new Error('Invalid FEN string');
    }

    const parts = fen.split(' ');
    const turn = parts[1];

    if (turn === 'w') return 'white';
    if (turn === 'b') return 'black';

    throw new Error('Could not determine turn from FEN');
  }

  function promotePawn(position: string, piece: string) {
    setIsPromoting(false);

    if (chessBoardRef.current && typeof chessBoardRef.current.handlePromotion === 'function') {
      chessBoardRef.current.handlePromotion(promotionSource, promotionTarget, piece.toLowerCase());
    }

    processMove(); // keep move tracking logic
  }



  return (
    <div className={styles.lessonContainer}>
      <div className={styles.switchLesson} onClick={() => {
        if (navigateFunc) navigateFunc();
        else navigate("/lessons-selection");
      }}>Switch Lesson</div>
      <button onClick={() => chessBoardRef.current?.flip()}>Flip board</button>
      <button onClick={undoMove}>Undo</button>
      <div className={styles.container}>
        <div className={styles.rightContainer}>
          {/* Lesson info */}
          <div className={styles.lessonHeader}>
            <h1 className={styles.pieceDescription}>{piece}</h1>
            <button className={styles.resetLesson} data-testid="reset-button" onClick={handleReset}>
              <RedoIcon />
            </button>
          </div>
          <h1 className={styles.subheading}>{lessonNum + 1} / {totalLessons}: {name}</h1>
          <p className={styles.lessonDescription}>{info}</p>


          {/* deactivate previous button, if there are no lessons before it*/}
          <div className={styles.prevNextContainer}>
            {
              lessonNum <= 0 ? (
                <button className={[styles.prevNextLessonButtonInactive, styles.prev].join(' ')}>
                  <BackIconInactive />
                  <p className={styles.buttonDescription}>Back</p>
                </button>
              ) : (

                <button className={[styles.prevNextLessonButton, styles.prev].join(' ')} onClick={previousLesson}>
                  <BackIcon />
                  <p className={styles.buttonDescription}>Back</p>
                </button>
              )
            }

            {/* deactivate next button, if it goes beyond first uncompleted, or beyond last available lesson */}
            {((lessonNum >= completedNum) || (lessonNum >= totalLessons - 1)) ? (
              <button className={[styles.prevNextLessonButtonInactive, styles.next].join(' ')}>
                <p className={styles.buttonDescription}>Next</p>
                <NextIconInactive />
              </button>
            ) : (
              <button className={[styles.prevNextLessonButton, styles.next].join(' ')} onClick={nextLesson}>
                <p className={styles.buttonDescription}>Next</p>
                <NextIcon />
              </button>
            )
            }
          </div>
          {styleType != 'profile' && (<MoveTracker moves={moves} />)}
        </div>
        <div className="chessBoardContainer">
          <ChessBoard
            ref={chessBoardRef}
            initialFEN={currentFEN}
            lessonMoves={lessonData?.moves || []}
            onMove={handleMove}
            onReset={onChessReset}
            onPromote={promotePawn}
          />
        </div>
      </div>
      {/* connection error popup */}
      {ShowError && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <div className={styles.errorCross}>
              <svg width="80" height="80" viewBox="0 0 120 120">
                <circle
                  className={styles.circle}
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#f57c7c"
                  strokeWidth="6"
                ></circle>
                <path
                  d="M40 40 L80 80"
                  fill="none"
                  stroke="#f57c7c"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M80 40 L40 80"
                  fill="none"
                  stroke="#f57c7c"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className={styles.popupHeader}>Failed to load content</p>
            <p className={styles.popupSubheading}>Please reload page</p>
          </div>
        </div>
      )}

      {/* lesson completed popup */}
      {showVPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <div className={styles.successCheckmark}>
              <svg width="80" height="80" viewBox="0 0 120 120">
                <circle className={styles.circle} cx="60" cy="60" r="54" fill="none" stroke="#beea8b" stroke-width="6"></circle>
                <path className={styles.checkmark} d="M35 60 L55 80 L85 40" fill="none" stroke="#beea8b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
            <p className={styles.popupHeader}>Lesson completed</p>
            <p className={styles.popupSubheading}>Good job</p>
            <button className={styles.popupButton} onClick={handleVPopup}>OK</button>
          </div>
        </div>
      )}

      {/* lesson not done yet popup */}
      {showXPopup && !showVPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <div className={styles.errorCross}>
              <svg width="80" height="80" viewBox="0 0 120 120">
                <circle
                  className={styles.circle}
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#f57c7c"
                  strokeWidth="6"
                ></circle>
                <path
                  d="M40 40 L80 80"
                  fill="none"
                  stroke="#f57c7c"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M80 40 L40 80"
                  fill="none"
                  stroke="#f57c7c"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className={styles.popupHeader}>Lesson failed</p>
            <p className={styles.popupSubheading}>Please try again</p>
            <button className={styles.popupButton} onClick={handleXPopup}>OK</button>
          </div>
        </div>
      )}

      {/* loading to wait for lesson fetching */}
      {showLPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <div className={styles.loadingSpinner}>
              <svg width="80" height="80" viewBox="0 0 120 120">
                <circle
                  className={styles.spinner}
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#a3d0ff"
                  strokeWidth="6"
                ></circle>
              </svg>
            </div>
            <p className={styles.popupHeader}>Loading lesson...</p>
            <p className={styles.popupSubheading}>Please wait</p>
          </div>
        </div>
      )}

      {/* have users read instructions first */}
      {showInstruction && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <p className={styles.popupHeader}>Read this instruction:</p>
            <p className={styles.popupSubheading}>{info}</p>
            <button className={styles.popupButton} onClick={handleShowInstruction}>Finished reading!</button>
          </div>
        </div>
      )}
      {/* <button onClick={handleVPopup}>mock complete</button> */}

      {isPromoting ? <PromotionPopup position={promotionSource} promoteToPiece={promotePawn} /> : null /* Show promotion popup if needed */}
    </div>
  );
};

export default LessonOverlay;