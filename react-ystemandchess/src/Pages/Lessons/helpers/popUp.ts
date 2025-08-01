import { useLessonContext } from "../context/LessonContext";
import { useLessonNavigation } from "../hooks/useLessonNavigation";
// Helper hook for popup logic using context
export function usePopupHelpers() {
  const { board, lessonEnded, setShowPopup } = useLessonContext();
  const { goToNextLesson } = useLessonNavigation();
  // Checks if all black pieces are removed and shows popup if lesson not ended
  function checkBlackPieces() {
    const blackPieces = board
      .flat()
      .filter((piece) => piece && piece[0] === "b");
    if (blackPieces.length === 0 && !lessonEnded) {
      setShowPopup(true);
    }
  }

  // Handles popup confirmation and moves to next lesson
  function handlePopupConfirm() {
    setShowPopup(false);
    goToNextLesson();
  }

  return {
    checkBlackPieces,
    handlePopupConfirm,
  };
}
