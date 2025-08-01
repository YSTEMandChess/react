import { getScenario, getScenarioLength } from "../Scenarios";

export async function initializeLesson({
  passedScenarioName,
  passedLessonName,
  setScenario,
  setLesson,
  setBoard,
  setLeftEnded,
  setRightEnded,
  counterRef,
}) {
  if (passedScenarioName && passedLessonName) {
    try {
      let foundScenarioIndex = -1;
      for (let i = 0; i < getScenarioLength(); i++) {
        if (getScenario(i).name.includes(passedScenarioName)) {
          foundScenarioIndex = i;
          break;
        }
      }

      if (foundScenarioIndex !== -1) {
        const foundScenario = getScenario(foundScenarioIndex);
        const foundLesson = foundScenario.subSections.find(
          (l) => l.name === passedLessonName
        );

        if (foundLesson) {
          setScenario(foundScenario);
          setLesson(foundLesson);
          setBoard(JSON.parse(JSON.stringify(foundLesson.board)));
          counterRef.current = foundScenarioIndex;
          setLeftEnded(foundScenario.subSections[0].left_ended);
          setRightEnded(foundScenario.subSections[0].right_ended);
        } else {
          console.error(
            `Lesson "${passedLessonName}" not found in scenario "${passedScenarioName}"`
          );
        }
      } else {
        console.error(`Scenario "${passedScenarioName}" not found`);
      }
    } catch (error) {
      console.error("Error initializing lesson:", error);
    }
  } else {
    const defaultScenario = getScenario(0);
    setScenario(defaultScenario);
    setLesson(defaultScenario.subSections[0]);
    setBoard(JSON.parse(JSON.stringify(defaultScenario.subSections[0].board)));
    setLeftEnded(defaultScenario.subSections[0].left_ended);
    setRightEnded(defaultScenario.subSections[0].right_ended);
  }
}
