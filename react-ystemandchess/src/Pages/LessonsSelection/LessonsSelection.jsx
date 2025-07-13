import "./LessonsStyle.css";
import { useNavigate } from "react-router";
import React, { useState, useEffect, useCallback } from 'react';
import { environment } from "../../environments/environment";
import { getScenarioLength, getScenario } from "../Lessons/Scenarios";
import { useCookies } from "react-cookie";

const ScenarioTemplate = React.memo(({ scenario, onClick }) => (
  <div className="item-template" onClick={onClick}>
    {scenario.name}
  </div>
));

const LessonTemplate = React.memo(({ lesson, onClick }) => (
  <div className="item-template" onClick={onClick}>
    {lesson.name}
  </div>
));

export default function LessonSelection() {
  const navigate = useNavigate();
  const [cookies] = useCookies(['login']);

  const [scenarios, setScenarios] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showLessons, setShowLessons] = useState(false);
  const [isLessonsLoading, setIsLessonsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const scenarioList = [];
    for (let i = 6; i < getScenarioLength(); i++) {
      scenarioList.push(getScenario(i));
    }
    setScenarios(scenarioList);
  }, []);

  const getLessonIndex = useCallback((scenarioName, lessonName) => {
    for (let i = 0; i < getScenarioLength(); i++) {
      const scenario = getScenario(i);
      if (scenario.name === scenarioName) {
        return scenario.subSections.findIndex(l => l.name === lessonName);
      }
    }
    return -1;
  }, []);

  const handleScenarioClick = (name) => {
    setSelectedScenario(name);
    setSelectedLesson(null);
    setShowScenarios(false);
    setIsLessonsLoading(true);
  };

  const handleLessonClick = (name) => {
    setSelectedLesson(name);
    setShowLessons(false);
  };

  const handleSubmit = () => {
    if (!selectedScenario || !selectedLesson) {
      setError("Please select both scenario & lesson.");
      return;
    }
    const lessonNum = getLessonIndex(selectedScenario, selectedLesson);
    if (lessonNum === -1) {
      setError("Lesson not found.");
      return;
    }
    navigate("/lessons", { state: { piece: selectedScenario, lessonNum } });
  };

  useEffect(() => {
    const fetchLessons = async () => {
      if (!selectedScenario) {
        setLessons([]);
        setIsLessonsLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `${environment.urls.middlewareURL}/lessons/getCompletedLessonCount?piece=${selectedScenario}`,
          {
            headers: { 'Authorization': `Bearer ${cookies.login}` },
          }
        );
        const unlocked = response.ok ? await response.json() : 0;
        const scenario = scenarios.find(s => s.name === selectedScenario);
        if (scenario) {
          const available = unlocked === 0
            ? [scenario.subSections[0]]
            : scenario.subSections.slice(0, unlocked + 1);
          setLessons(available);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLessonsLoading(false);
      }
    };
    fetchLessons();
  }, [selectedScenario, cookies.login, scenarios]);

  return (
    <div className="whole-page">
      {error && (
        <div className="errorBackground">
          <div className="errorBox">
            <div className="errorText">{error}</div>
            <button onClick={() => setError(null)}>OK</button>
          </div>
        </div>
      )}

      <div className="title">Lesson Selection</div>

      <div className="selector" onClick={() => setShowScenarios(!showScenarios)}>
        <div>{selectedScenario || "Select a scenario"}</div>
        <div>{showScenarios ? "▲" : "▼"}</div>
      </div>

      {showScenarios && (
        <div className="container">
          {scenarios.map((s) => (
            <ScenarioTemplate
              key={s.name}
              scenario={s}
              onClick={() => handleScenarioClick(s.name)}
            />
          ))}
        </div>
      )}

      <div className="selector" onClick={() => setShowLessons(!showLessons)}>
        <div>{selectedLesson || "Select a lesson"}</div>
        <div>{showLessons ? "▲" : "▼"}</div>
      </div>

      {showLessons && (
        <div className="container">
          {!isLessonsLoading ? (
            lessons.map((l) => (
              <LessonTemplate
                key={l.name}
                lesson={l}
                onClick={() => handleLessonClick(l.name)}
              />
            ))
          ) : (
            <div className="item-template">Loading...</div>
          )}
        </div>
      )}

      <button className="enterInfo" onClick={handleSubmit}>
        Go!
      </button>
    </div>
  );
}
