import pageStyles from "./Lessons.module.scss";
import profileStyles from "./Lessons-profile.module.scss";
import { useEffect, useRef } from "react";
import { ReactComponent as RedoIcon } from "./assets/icon_redo.svg";
import { ReactComponent as BackIcon } from "./assets/icon_back.svg";
import { ReactComponent as BackIconInactive } from "./assets/icon_back_inactive.svg";
import { ReactComponent as NextIcon } from "./assets/icon_next.svg";
import { ReactComponent as NextIconInactive } from "./assets/icon_next_inactive.svg";

import { Navigate, useNavigate, useLocation } from "react-router";
import { useLessonContext } from "./context/LessonContext";
import { createChessBoard } from "./createChessBoard";

import { usePopupHelpers } from "./helpers/popUp";
import { useLessonNavigation } from "./hooks/useLessonNavigation";
import { initializeLesson } from "./helpers/lessonInit";
import { useChessboardInteractions } from "./hooks/useChessboardInteractions";
// @ts-ignore
import PromotionPopup from "./PromotionPopup";

type LessonsProps = {
  testOverrides?: any;
  styleType?: any;
};

const Lessons = ({ testOverrides, styleType = "page" }: LessonsProps) => {
  const styles = styleType === "profile" ? profileStyles : pageStyles;

  const navigate = useNavigate();
  const location = useLocation();
  const passedScenarioName = location.state?.scenario;
  const passedLessonName = location.state?.lesson;

  const {
    board,
    setBoard,
    highlightedSquares,
    setHighlightedSquares,
    draggingPiece,
    leftEnded,
    setLeftEnded,
    rightEnded,
    setRightEnded,
    showPopup,
    scenario,
    setScenario,
    lesson,
    setLesson,
    isPromoting,
    promotionPosition,
    counterRef,
  } = useLessonContext();
  const { checkBlackPieces, handlePopupConfirm } = usePopupHelpers();
  const { setupLesson, setupScenario } = useLessonNavigation();

  // Accessibility improvements for popup
  const popupRef = useRef(null);

  useEffect(() => {
    if (showPopup && popupRef.current) {
      popupRef.current.focus();
    }
  }, [showPopup]);

  // Check for black pieces every time the board state changes
  useEffect(() => {
    checkBlackPieces();
  }, [board]);

  useEffect(() => {
    if (testOverrides?.highlightedSquares) {
      setHighlightedSquares(testOverrides.highlightedSquares);
    }
  }, [testOverrides]);

  useEffect(() => {
    initializeLesson({
      passedScenarioName,
      passedLessonName,
      setScenario,
      setLesson,
      setBoard,
      setLeftEnded,
      setRightEnded,
      counterRef,
    });
  }, [
    location,
    passedScenarioName,
    passedLessonName,
    setScenario,
    setLesson,
    setBoard,
    setLeftEnded,
    setRightEnded,
    counterRef,
  ]);

  const {
    handleSquareHover,
    handleDragStart,
    handleDrop,
    handleDragOver,
    promotePawn,
    resetBoard,
  } = useChessboardInteractions();

  const backButtonClassname = rightEnded
    ? "prevNextLessonButton-inactive prev"
    : "prevNextLessonButton prev";

  return (
    <div className={styles.lessonsPage}>
      <div className={styles.leftRightContainer}>
        {/* div for elements on the right */}
        <div className={styles.rightContainer}>
          {/* Description part */}
          <div className={styles.lessonHeader}>
            <h1
              data-testid="piece_description"
              className={styles.pieceDescription}
            >
              {scenario.name}
            </h1>
            <button
              data-testid="reset-lesson"
              className={styles.resetLesson}
              onClick={resetBoard}
            >
              <RedoIcon />
            </button>
          </div>

          <h1 data-testid="subheading" className={styles.subheading}>
            {lesson.name}
          </h1>
          <p
            data-testid="lesson-description"
            className={styles.lessonDescription}
          >
            {lesson.info}
          </p>

          <div className={styles.prevNextContainer}>
            {/* Back button */}
            <button
              data-testid="backLessonButton"
              className={
                leftEnded
                  ? [styles.prevNextLessonButtonInactive, styles.prev].join(" ")
                  : [styles.prevNextLessonButton, styles.prev].join(" ")
              }
              onClick={leftEnded ? undefined : () => setupScenario(-1)}
            >
              {leftEnded ? <BackIconInactive /> : <BackIcon />}
              <p className={styles.buttonDescription}>Back</p>
            </button>

            <button
              data-testid="prevNextLessonButton"
              className={
                rightEnded
                  ? [styles.prevNextLessonButtonInactive, styles.next].join(" ")
                  : [styles.prevNextLessonButton, styles.next].join(" ")
              }
              onClick={rightEnded ? undefined : () => setupScenario(1)}
            >
              {rightEnded ? <NextIconInactive /> : <NextIcon />}
              <p className={styles.buttonDescription}>Next</p>
            </button>
          </div>
        </div>

        {/* Div for elements on the left */}
        <div className={styles.leftContainer}>
          <div className={styles.chessboardContainer}>
            <div data-testid="chessboard-L" className={styles.chessboard}>
              {createChessBoard(
                board,
                highlightedSquares,
                setHighlightedSquares,
                handleSquareHover,
                handleDragStart,
                handleDrop,
                handleDragOver,
                draggingPiece,
                styles
              )}
            </div>
            {
              isPromoting ? (
                <PromotionPopup
                  position={promotionPosition}
                  promoteToPiece={promotePawn}
                />
              ) : null /* Show promotion popup if needed */
            }
          </div>
        </div>
      </div>

      <div>
        <div className={styles.lessonButtonsContainer}>
          {scenario.subSections?.map((section, index) => (
            <button
              key={index}
              data-testid="lesson-button"
              className={
                section.name == lesson.name
                  ? [styles.lessonButtons, styles.active].join(" ")
                  : styles.lessonButtons
              }
              onClick={() => setupLesson(section)}
              aria-label={`${section.name}`}
              aria-pressed={section.name == lesson.name}
            >
              {section.name}
            </button>
          ))}
        </div>
      </div>

      {/* Popup for lesson completion */}
      {showPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <div className={styles.successCheckmark}>
              <svg width="80" height="80" viewBox="0 0 120 120">
                <circle
                  className={styles.circle}
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#beea8b"
                  stroke-width="6"
                ></circle>
                <path
                  className={styles.checkmark}
                  d="M35 60 L55 80 L85 40"
                  fill="none"
                  stroke="#beea8b"
                  stroke-width="8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
              </svg>
            </div>
            <p className={styles.popupHeader}>Lesson completed</p>
            <p className={styles.popupSubheading}>Good job</p>
            <button className={styles.popupButton} onClick={handlePopupConfirm}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lessons;
