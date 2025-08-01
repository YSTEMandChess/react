import { useLessonContext } from "../context/LessonContext";
import { getScenario, getScenarioLength } from "../Scenarios";
import { initializeBoard } from "../helpers/boardHelpers";
import { useCallback } from "react";

export function useLessonNavigation() {
  const {
    board,
    setBoard,
    scenario,
    setScenario,
    lesson,
    setLesson,
    leftEnded,
    setLeftEnded,
    rightEnded,
    setRightEnded,
    lessonEnded,
    setLessonEnded,
    counterRef,
  } = useLessonContext();

  const setupLesson = useCallback(
    (section) => {
      setLessonEnded(false);
      setLesson(section);
      setBoard(JSON.parse(JSON.stringify(section.board)));
      setLeftEnded(section.left_ended);
      setRightEnded(section.right_ended);
    },
    [setLessonEnded, setLesson, setBoard, setLeftEnded, setRightEnded]
  );

  const setupScenario = useCallback(
    (x) => {
      counterRef.current += x;
      setLessonEnded(false);
      const scenario = getScenario(counterRef.current);
      setScenario(scenario);
      setLesson(scenario.subSections[0]);
      setBoard(JSON.parse(JSON.stringify(scenario.subSections[0].board)));
      setLeftEnded(scenario.subSections[0].left_ended);
      setRightEnded(scenario.subSections[0].right_ended);
    },
    [
      setLessonEnded,
      setScenario,
      setLesson,
      setBoard,
      setLeftEnded,
      setRightEnded,
      counterRef,
    ]
  );

  const goToNextLesson = useCallback(() => {
    const currentLessonIndex = scenario.subSections.findIndex(
      (l) => l.name === lesson.name
    );
    if (currentLessonIndex === -1) {
      console.error("Current lesson not found in scenario.");
      return;
    }
    if (currentLessonIndex >= scenario.subSections.length - 1) {
      if (!rightEnded) setupScenario(1);
      else {
        setBoard(initializeBoard());
        setLessonEnded(true);
      }
    } else {
      setupLesson(scenario.subSections[currentLessonIndex + 1]);
    }
  }, [
    scenario,
    lesson,
    rightEnded,
    setupScenario,
    setBoard,
    setLessonEnded,
    setupLesson,
    initializeBoard,
  ]);

  return { setupLesson, setupScenario, goToNextLesson };
}
