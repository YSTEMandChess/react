import "./LessonsStyle.css";
import { useNavigate } from "react-router";
import React, { useState, useEffect } from 'react';
import { getScenarioLength, getScenario} from "../Lessons/Scenarios";


// li onClick={() => navigate("/lessons", {state: {scenario: "Pawn", lesson: "Basic"}})}>Basic</li>

function ScenarioTemplate({ scenario, onClick }) { // You can pass down references, like onClick!
    return (
      <div className="item-template" onClick={onClick}>
        <div>Title: {scenario.name}</div>
      </div>
    );
  }

  function LessonTemplate({ lesson, onClick }) {
    return (
      <div className="item-template" onClick={onClick}>
        <div>Title: {lesson.name}</div>
      </div>
    );
  }

export default function LessonSelection() {
    const [showScenarios, setShowScenarios] = useState(false);
    const [showLessons, setShowLessons] = useState(false);

    const [selectedScenario, setSelectedScenario] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    
    const [scenarios, setScenarios] = useState([]);
    const [lessons, setLessons] = useState([]);

    const [lessonNum, setLessonNum] = useState(null);

    useEffect(() => {
        const scenarioList = [];
        for (let i = 6; i < getScenarioLength(); i++) {
            scenarioList.push(getScenario(i));
        }
        setScenarios(scenarioList);
    }, []);

    const getLessonNum = (scenario, lesson) => {
        console.log("!!!!!", scenario)
        console.log("!!!!!", lesson)
        for(let i = 0; i < getScenarioLength(); i++) {
            if (getScenario(i).name === scenario) {
                for(let j =0; j < getScenario(i).subSections.length; j++) {
                    if (getScenario(i).subSections[j].name === lesson) {
                        return j;
                    }
                }
                break;
            }
        }
        return -1;
    }

    const handleScenarioClick = (scenario) => {
        setShowLessons(false);
        setShowScenarios(false);
        setSelectedLesson('');
        setSelectedScenario(scenario);
    }

    const handleLessonClick = (lesson) => {
        setShowLessons(false);
        setShowScenarios(false);
        setSelectedLesson(lesson);
    }

    useEffect(() => {
    const lessonTable = []

    for(let i = 0; i < getScenarioLength(); i++) {
        if (getScenario(i).name === selectedScenario) {
            for(let j =0; j < getScenario(i).subSections.length; j++) {
                lessonTable.push(getScenario(i).subSections[j]);
            }
            break;
        }
    }
    setLessons(lessonTable);
    }, [selectedScenario])
    
    const navigate = useNavigate();      
    return(
        <div className="whole-page">
            <div className="selector scenario-selector" onClick={() => {
                setShowScenarios(!showScenarios);
            }}>
                {selectedScenario || "Select a scenario."}
            </div>
            
            {showScenarios && (
                <div className="container scenario-container">
                    {scenarios.map((scenarioItem, index) => (
                        <ScenarioTemplate key={index} scenario={scenarioItem} onClick={() => handleScenarioClick(scenarioItem.name)}/>
                        // Use onClick = {() => function} if argument is needed, otherwise onClick = {function}.
                    ))}
                </div>
            )}
            
            <div className="selector lesson-selector" onClick={() => {
                setShowLessons(!showLessons);
            }}>
                {selectedLesson || "Select a lesson."}
            </div>
            {showLessons && (
                <div className="container scenario-container">
                    {lessons.map((lessonItem, index) => (
                        <LessonTemplate key={index} lesson={lessonItem} onClick={() => handleLessonClick(lessonItem.name)}/>
                    ))}
                </div>
            )}

            <button className="enterInfo" onClick={() => {
                navigate("/lessons", {state: {piece: selectedScenario, lessonNum: getLessonNum(selectedScenario, selectedLesson)}});
            }}>
                Go!
            </button>
        </div>
    );
}