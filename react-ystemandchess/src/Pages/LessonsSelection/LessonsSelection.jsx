import "./LessonsStyle.css"; // Imports the CSS for this component.
import { useNavigate } from "react-router"; // Hook for navigation.
import React, { useState, useEffect } from 'react'; // Imports React hooks for state and lifecycle management.
import { environment } from "../../environments/environment"; // Imports environment variables.
import { getScenarioLength, getScenario} from "../Lessons/Scenarios"; // Imports functions to fetch lesson scenario data.
import { useCookies } from "react-cookie"; // Hook to manage cookies.


// li onClick={() => navigate("/lessons", {state: {scenario: "Pawn", lesson: "Basic"}})}>Basic</li>

// Component to display a single scenario item.
function ScenarioTemplate({ scenario, onClick }) { // You can pass down references, like onClick!
    return (
      <div className="item-template" onClick={onClick}>
        <div>{scenario.name}</div>
      </div>
    );
  }

  // Component to display a single lesson item within a scenario.
  function LessonTemplate({ lesson, onClick }) {
    return (
      <div className="item-template" onClick={onClick}>
        <div>{lesson.name}</div>
      </div>
    );
  }

export default function LessonSelection() {
    const navigate = useNavigate(); // Initializes the navigation hook.
    const [showScenarios, setShowScenarios] = useState(false); // State to control the visibility of the scenarios list.
    const [showLessons, setShowLessons] = useState(false); // State to control the visibility of the lessons list for a selected scenario.
    const [cookies] = useCookies(['piece', 'login']); // Gets the 'piece' and 'login' cookies.
    const [selectedScenario, setSelectedScenario] = useState(null); // State to store the name of the selected scenario.
    const [selectedLesson, setSelectedLesson] = useState(null); // State to store the name of the selected lesson.
    const [unlockedLesson, setUnlockedLesson] = useState(0); // State to store the number of lessons unlocked for the selected scenario.

    const [errorText, setErrorText] = useState(null); // State to hold the text of any error message.
    const [errorFound, setErrorFound] = useState(false); // State to track if an error has occurred and should be displayed.

    const [scenarios, setScenarios] = useState([]); // State to store the list of available scenarios.
    const [lessons, setLessons] = useState([]); // State to store the list of lessons for the selected scenario.
    const [lessonNum, setLessonNum] = useState(null); // State to potentially store the lesson number (currently not directly used in rendering).

    // useEffect hook to fetch the list of scenarios when the component mounts.
    useEffect(() => {
        const scenarioList = [];
        // Iterates through the available scenarios and adds them to the list.
        for (let i = 6; i < getScenarioLength(); i++) {
            scenarioList.push(getScenario(i));
        }
        setScenarios(scenarioList); // Updates the scenarios state with the fetched list.
    }, []); // Empty dependency array means this effect runs only once after the initial render.

    // Function to determine the numerical index of a given lesson within a scenario.
    const getLessonNum = (scenario, lesson) => {
        console.log("!!!!!", scenario)
        console.log("!!!!!", lesson)
        // Iterates through all available scenarios.
        for(let i = 0; i < getScenarioLength(); i++) {
            // If the current scenario matches the provided scenario name.
            if (getScenario(i).name === scenario) {
                // Iterates through the sub-sections (lessons) of the found scenario.
                for(let j =0; j < getScenario(i).subSections.length; j++) {
                    // If the current lesson matches the provided lesson name.
                    if (getScenario(i).subSections[j].name === lesson) {
                        return j; // Returns the index (lesson number).
                    }
                }
                break; // Exits the outer loop once the scenario is found.
            }
        }
        return -1; // Returns -1 if the lesson is not found in the scenario.
    }

    // Handles the click event on a scenario item.
    const handleScenarioClick = (scenario) => {
        setShowLessons(false); // Hides the lessons list.
        setShowScenarios(false); // Hides the scenarios list.
        setSelectedLesson(null); // Clears any previously selected lesson.
        setSelectedLesson(null); // Redundant line, likely a mistake.
        setSelectedScenario(scenario); // Sets the selected scenario.
    }

    // Handles the click event on a lesson item.
    const handleLessonClick = (lesson) => {
        setShowLessons(false); // Hides the lessons list.
        setShowScenarios(false); // Hides the scenarios list.
        setSelectedLesson(lesson); // Sets the selected lesson.
    }

    // Handles the submission (click on the "Go!" button) to navigate to the selected lesson.
    const handleSubmit = async () => {
        let unlocked = 0;
        // Checks if both a lesson and a scenario have been selected.
        if (selectedLesson == null || selectedScenario == null) {
            setErrorText("Select a scenario & lesson."); // Sets an error message.
            setErrorFound(true); // Shows the error message.
            return; // Stops the submission process.
        }
        try {
            // Fetches the count of completed lessons for the selected scenario (piece).
            const response = await fetch(
                `${environment.urls.middlewareURL}/lessons/getCompletedLessonCount?piece=${selectedScenario}`,
                {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${cookies.login}` }
                }
            );

            unlocked = await response.json(); // Parses the JSON response to get the number of unlocked lessons.
            setUnlockedLesson(unlocked); // Updates the unlockedLesson state.
        } catch (error) {
            console.error('Error fetching lesson number:', error);
        }

        // Checks if the selected lesson is unlocked (user has completed the preceding lessons).
        if (unlocked < getLessonNum(selectedScenario, selectedLesson) + 1) {
            setErrorText("You haven't unlocked this lesson yet!"); // Sets an error message.
            setErrorFound(true); // Shows the error message.
        } else {
            // Navigates to the learning page with the selected piece (scenario) and lesson number.
            return navigate("/learnings", {state: {piece: selectedScenario, lessonNum: getLessonNum(selectedScenario, selectedLesson)+1}});
        }
    }

    // useEffect hook to update the list of lessons when the selected scenario changes.
    useEffect(() => {
    const lessonTable = []

    // Iterates through all available scenarios.
    for(let i = 0; i < getScenarioLength(); i++) {
        // If the current scenario matches the selected scenario.
        if (getScenario(i).name === selectedScenario) {
            // Iterates through the sub-sections (lessons) of the selected scenario.
            for(let j =0; j < getScenario(i).subSections.length; j++) {
                lessonTable.push(getScenario(i).subSections[j]); // Adds each lesson to the lessonTable.
            }
            break; // Exits the loop once the selected scenario's lessons are collected.
        }
    }
    setLessons(lessonTable); // Updates the lessons state with the lessons for the selected scenario.
    }, [selectedScenario]) // This effect runs whenever selectedScenario changes.

    return(
        <div className="whole-page">
            {/* Conditional rendering of the error message popup. */}
            {errorFound && (
                <div className="errorBackground">
                    <div className="errorBox">
                        <div className="errorText">{errorText}</div>
                        <button onClick={() => {
                            setErrorFound(false); // Hides the error message when the "OK" button is clicked.
                        }}>OK</button>
                    </div>
                </div>
            )}
            <div className="title">
                Lesson Selection
            </div>
            {/* Dropdown-like selector for choosing a scenario. */}
            <div className="selector scenario-selector" onClick={() => {
                setShowScenarios(!showScenarios); // Toggles the visibility of the scenarios list.
            }}>
                {selectedScenario || "Select a scenario."} {/* Displays the selected scenario or a default message. */}
            </div>

            {/* Conditional rendering of the scenarios list. */}
            {showScenarios && (
                <div className="container scenario-container">
                    {/* Maps through the scenarios and renders a ScenarioTemplate for each. */}
                    {scenarios.map((scenarioItem, index) => (
                        <ScenarioTemplate key={index} scenario={scenarioItem} onClick={() => handleScenarioClick(scenarioItem.name)}/>
                        // Use onClick = {() => function} if argument is needed, otherwise onClick = {function}.
                    ))}
                </div>
            )}

            {/* Dropdown-like selector for choosing a lesson within the selected scenario. */}
            <div className="selector lesson-selector" onClick={() => {
                setShowLessons(!showLessons); // Toggles the visibility of the lessons list.
            }}>
                {selectedLesson || "Select a lesson."} {/* Displays the selected lesson or a default message. */}
            </div>
            {/* Conditional rendering of the lessons list for the selected scenario. */}
            {showLessons && (
                <div className="container scenario-container">
                    {/* Maps through the lessons and renders a LessonTemplate for each. */}
                    {lessons.map((lessonItem, index) => (
                        <LessonTemplate key={index} lesson={lessonItem} onClick={() => handleLessonClick(lessonItem.name)}/>
                    ))}
                </div>
            )}

            {/* Button to submit the selection and navigate to the lesson. */}
            <button className="enterInfo" onClick={handleSubmit}>
                Go!
            </button>
        </div>
    );
}