import profileStyles from "./ProfileStyle.module.scss";
import pageStyles from "./LessonsStyle.module.scss";
import { useNavigate } from "react-router";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { environment } from "../../environments/environment";
import { getScenarioLength, getScenario } from "../Lessons/Scenarios"; // Assuming scenariosArray is implicitly used by these functions or can be imported.
import { useCookies } from "react-cookie";
import ScenarioTemplate from "./ScenarioTemplate/ScenarioTemplate.jsx"; // Importing the ScenarioTemplate component
import LessonTemplate from "./LessonTemplate/LessonTemplate.jsx"; // Importing the LessonTemplate component

export default function LessonSelection({ onGo, styleType="page" }) { // what to do when clicking go button, default to navigation
    
    const styles = useMemo(() => (styleType === 'profile' ? profileStyles : pageStyles), [styleType]);
    
    const navigate = useNavigate();
    const [showScenarios, setShowScenarios] = useState(false);
    const [showLessons, setShowLessons] = useState(false);

    const [cookies] = useCookies(['piece', 'login']);
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [isLessonsLoading, setLoadingLessons] = useState(false);
    const [unlockedLessonCount, setUnlockedLessonCount] = useState(0); // Renamed for clarity

    const [error, setError] = useState(null); // Combine error states

    const [scenarios, setScenarios] = useState([]);
    const [lessons, setLessons] = useState([]);

    // Effect to fetch the list of scenarios when the component mounts.
    useEffect(() => {
        const scenarioList = [];
        // Assuming getScenarioLength and getScenario are efficient.
        for (let i = 6; i < getScenarioLength(); i++) {
            scenarioList.push(getScenario(i));
        }
        setScenarios(scenarioList);
    }, []);

    // Function to determine the numerical index of a given lesson within a scenario.
    const getLessonIndex = useCallback((scenarioName, lessonName) => {
        for (let i = 0; i < getScenarioLength(); i++) {
            const scenario = getScenario(i);
            if (scenario.name === scenarioName) {
                for (let j = 0; j < scenario.subSections.length; j++) {
                    if (scenario.subSections[j].name === lessonName) {
                        return j;
                    }
                }
            }
        }
        return -1;
    }, []);

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
            setError("Select a scenario & lesson.");
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
                setUnlockedLessonCount(unlocked);
            } catch (error) {
                console.error('Error fetching unlocked lesson count:', error);
                // Optionally set an error state here if needed for display
                unlocked = 0; // Default to 0 unlocked lessons on error
            }

            const currentScenario = scenarios.find(s => s.name === selectedScenario);
            if (currentScenario) {
                const availableLessons = [];
                // If no lessons are unlocked, or an error occurred, only show the first lesson.
                if (unlocked === 0 || unlocked == null) {
                    availableLessons.push(currentScenario.subSections[0]);
                } else {
                    // Otherwise, show all unlocked lessons.
                    for(let j = 0; j <= unlocked && j < currentScenario.subSections.length; j++) {
                        if (currentScenario.subSections[j]) { // Ensure the lesson exists
                            availableLessons.push(currentScenario.subSections[j]);
                        }
                    }
                }
                setLessons(availableLessons);
            } else {
                setLessons([]); // Clear lessons if scenario is not found
            }
            setLoadingLessons(false);
        }
        fetchLessonsForScenario();
    }, [selectedScenario, cookies.login]);


    const renderedScenarios = useMemo(() => {
        return scenarios.map((scenarioItem) => (
            <ScenarioTemplate
                key={scenarioItem.name}
                scenario={scenarioItem}
                onClick={() => handleScenarioClick(scenarioItem.name)}
                styles={styles}
            />
        ));
    }, [scenarios, styles]);

    const renderedLessons = useMemo(() => {
        console.log("Caclulating lessons")
        return lessons.map((lessonItem) => (
            <LessonTemplate
                key={lessonItem.name}
                lesson={lessonItem}
                onClick={() => handleLessonClick(lessonItem.name)}
                styles={styles}
            />
        ));
    }, [lessons, styles]);

    return (
        <div className={styles.wholePage}>
            {/* Conditional rendering of the error message popup. */}
            {error && (
                <div className={styles.errorBackground}>
                    <div className={styles.errorBox}>
                        <div className={styles.errorText}>{error}</div>
                        <button onClick={() => setError(null)}>OK</button>
                    </div>
                </div>
            )}
            <div className={styles.title} data-testid="title">
                Lesson Selection
            </div>
            {/* Dropdown-like selector for choosing a scenario. */}
            <div className={styles.selector} data-testid="scenario-selector" onClick={() => setShowScenarios(!showScenarios)}>
                <div>
                    {selectedScenario || "Select a scenario."}
                </div>
                <div style={{ marginRight: "1rem" }}>
                    {showScenarios ? "▼" : "▲"}
                </div>
            </div>

            {/* Conditional rendering of the scenarios list. */}
            {showScenarios && (
                <div className={styles.container}>
                    {renderedScenarios}
                </div>
            )}

            {/* Dropdown-like selector for choosing a lesson within the selected scenario. */}
            <div className={styles.selector} data-testid="lesson-selector" onClick={() => setShowLessons(!showLessons)}>
                <div>
                    {selectedLesson || "Select a lesson."}
                </div>
                <div style={{ marginRight: "1rem" }}>
                    {showLessons ? "▼" : "▲"}
                </div>
            </div>
            {/* Conditional rendering of the lessons list for the selected scenario. */}
            {showLessons && (
                <div className={styles.container}>
                    {!isLessonsLoading ? (renderedLessons)
                     : (
                        <div className={styles.itemTemplate}>Loading...</div>
                    )}
                </div>
            )}

            {/* Button to submit the selection and navigate to the lesson. */}
            <button className={styles.enterInfo} data-testid="enterInfo" onClick={handleSubmit}>
                Go!
            </button>
        </div>
    );
}