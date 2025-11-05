import profileStyles from "./ProfileStyle.module.scss";
import pageStyles from "./LessonsStyle.module.scss";
import { useNavigate } from "react-router";
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { environment } from "../../environments/environment";
import { getAllScenarios } from "../Lessons/Scenarios";
import { useCookies } from "react-cookie";
import ScenarioTemplate from "./ScenarioTemplate/ScenarioTemplate.jsx"; // Importing the ScenarioTemplate component
import LessonTemplate from "./LessonTemplate/LessonTemplate.jsx"; // Importing the LessonTemplate component

export default function LessonSelection({ onGo, styleType = "page" }) { // what to do when clicking go button, default to navigation

  const styles = useMemo(() => (styleType === 'profile' ? profileStyles : pageStyles), [styleType]);

  const navigate = useNavigate();
  const [showScenarios, setShowScenarios] = useState(false);
  const [showLessons, setShowLessons] = useState(false);

  const [cookies] = useCookies(['piece', 'login']);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isLessonsLoading, setLoadingLessons] = useState(false);
  const [unlockedLessonCount, setUnlockedLessonCount] = useState(0); // Renamed for clarity
  const [scenarios, setScenarios] = useState([]);
  const [lessons, setLessons] = useState([]);
  const scenarioRef = useRef(null);
  const lessonRef = useRef(null);
  const [error, setError] = useState("");

  // Effect to fetch the list of scenarios when the component mounts.
  useEffect(() => {
    const scenarioList = getAllScenarios()
    setScenarios(scenarioList);
  }, []);

  // Function to determine the numerical index of a given lesson within a scenario.
  const getLessonIndex = useCallback((scenarioName, lessonName) => {
    const scenario = scenarios.find(s => s.name === scenarioName);
    if (!scenario) return -1;

    return scenario.subSections.findIndex(sub => sub.name === lessonName);
  }, [scenarios]);

  // Handles the click event on a scenario item.
  const handleScenarioClick = useCallback((scenarioName) => {
    setShowLessons(false);
    setShowScenarios(false);
    setSelectedLesson(null); // Clear selected lesson when scenario changes
    setSelectedScenario(scenarioName);
    setLoadingLessons(true);
  }, []);

  // Handles the click event on a lesson item.
  const handleLessonClick = useCallback((lessonName) => {
    setShowLessons(false);
    setShowScenarios(false);
    setSelectedLesson(lessonName);
  }, []);

  // Handles the submission (click on the "Go!" button) to navigate to the selected lesson.
  const handleSubmit = async () => {
    if (!selectedLesson || !selectedScenario) {
      setError("Please select a scenario and a lesson.");
      return;
    }

    const lessonNum = getLessonIndex(selectedScenario, selectedLesson);
    if (lessonNum === -1) {
      setError("Could not find the selected lesson's index.");
      return;
    }

    if (onGo) {
      onGo(selectedScenario, lessonNum);
    } else {
      navigate("/lessons", { state: { piece: selectedScenario, lessonNum } });
    }
  };

  // Effect hook to update the list of lessons when the selected scenario or login cookie changes.
  useEffect(() => {
    async function fetchLessonsForScenario() {
      if (!selectedScenario) {
        setLessons([]);
        setLoadingLessons(false);
        return;
      }

      let unlocked = 0;
      try {
        const response = await fetch(
          `${environment.urls.middlewareURL}/lessons/getCompletedLessonCount?piece=${selectedScenario}`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cookies.login}` }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        unlocked = await response.json();
      } catch (error) {
        console.error('Error fetching unlocked lesson count:', error);
        // Optionally set an error state here if needed for display
        unlocked = 0; // Default to 0 unlocked lessons on error
      }

      const currentScenario = scenarios.find(s => s.name === selectedScenario);
      if (!currentScenario) {
        setLessons([]);
        setLoadingLessons(false);
        return;
      }

      // Determine available lessons
      const maxIndex = Math.min(unlocked, currentScenario.subSections.length - 1);
      const availableLessons = currentScenario.subSections.slice(0, maxIndex + 1);

      // Always show at least the first lesson
      if (availableLessons.length === 0 && currentScenario.subSections[0]) {
        availableLessons.push(currentScenario.subSections[0]);
      }

      setLessons(availableLessons);
      setUnlockedLessonCount(unlocked);
      setLoadingLessons(false);
    }
    fetchLessonsForScenario();
  }, [selectedScenario, cookies.login, scenarios]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        scenarioRef.current &&
        !scenarioRef.current.contains(event.target)
      ) {
        setShowScenarios(false);
      }

      if (
        lessonRef.current &&
        !lessonRef.current.contains(event.target)
      ) {
        setShowLessons(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);


  const renderedScenarios = useMemo(() => {
    return scenarios.map((scenarioItem) => (
      <ScenarioTemplate
        key={scenarioItem.name}
        scenario={scenarioItem}
        onClick={() => handleScenarioClick(scenarioItem.name)}
        styles={styles}
      />
    ));
  }, [scenarios, styles, handleScenarioClick]);

  const renderedLessons = useMemo(() => {
    return lessons.map((lessonItem) => (
      <LessonTemplate
        key={lessonItem.name}
        lesson={lessonItem}
        onClick={() => handleLessonClick(lessonItem.name)}
        styles={styles}
      />
    ));
  }, [lessons, styles, handleLessonClick]);

  return (
    <div className={styles.wholePage}>
      <div className={styles.title} data-testid="title">
        Lesson Selection
      </div>
      {/* Dropdown-like selector for choosing a scenario. */}
      <div className={styles.selectorWrapper}>
        <div ref={scenarioRef} className={styles.selector} data-testid="scenario-selector" onClick={() => setShowScenarios(!showScenarios)}>
          <div>
            {selectedScenario || "Select a scenario"}
          </div>
          <div style={{ marginRight: "1rem" }}>
            {showScenarios ? "▼" : "▲"}
          </div>
        </div>

        {/* Conditional rendering of the scenarios list. */}
        {showScenarios && (
          <div className={styles.dropdownContainer}>
            {renderedScenarios}
          </div>
        )}
      </div>

      {/* Dropdown-like selector for choosing a lesson within the selected scenario. */}
      <div className={styles.selectorWrapper}>
        <div ref={lessonRef} className={styles.selector} data-testid="lesson-selector"
          onClick={() => {
            if (!selectedScenario) {
              setError("Please select a scenario first.");
              setTimeout(() => setError(""), 2500); // auto-clear after 2.5s
              return;
            }
            setShowLessons(!showLessons);
          }}>
          <div>
            {selectedLesson || "Select a lesson"}
          </div>
          <div style={{ marginRight: "1rem" }}>
            {showLessons ? "▼" : "▲"}
          </div>
        </div>

        {/* Conditional rendering of the lessons list for the selected scenario. */}
        {showLessons && (
          <div className={styles.dropdownContainer}>
            {isLessonsLoading ? (
              <div className={styles.itemTemplate}>Loading...</div>
            ) : (renderedLessons)
            }
          </div>
        )}
      </div>

      <div className={styles.inlineMessageWrapper}>
        {error && (
          <div className={styles.inlineMessage}>
            {error}
          </div>
        )}
      </div>


      {/* Button to submit the selection and navigate to the lesson. */}
      <button className={styles.enterInfo} data-testid="enterInfo" onClick={handleSubmit}>
        Go!
      </button>
    </div>
  );
}