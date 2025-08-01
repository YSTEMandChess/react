import React, { createContext, useContext, useState, useRef } from "react";
import { getScenario } from "../Scenarios";

const LessonContext = createContext(null);

export const LessonProvider = ({ children }) => {
  // All state from Lessons.tsx that needs to be shared
  const [board, setBoard] = useState(getScenario(0).subSections[0].board); // Initialize the board with chess pieces
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [draggingPiece, setDraggingPiece] = useState(null); // Track which piece is being dragged
  const [leftEnded, setLeftEnded] = useState(true); // track whether there are any more previous scenarios
  const [rightEnded, setRightEnded] = useState(false); // track whether there are any more upcoming scenarios
  const [showPopup, setShowPopup] = useState(false); // Popup state
  const [scenario, setScenario] = useState(getScenario(0)); // Current scenario like "pawn", "checkmates", etc.
  const [lesson, setLesson] = useState(getScenario(0).subSections[0]); // Current lesson / subsection under the scenario
  const [lessonEnded, setLessonEnded] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false); // State to track if a pawn is being promoted
  const [promotionPosition, setPromotionPosition] = useState(null); // Position of the pawn being promoted

  const counterRef = useRef(0); // Current counter that indexes current scenario in scenariosArray

  const value = {
    board,
    setBoard,
    highlightedSquares,
    setHighlightedSquares,
    draggingPiece,
    setDraggingPiece,
    leftEnded,
    setLeftEnded,
    rightEnded,
    setRightEnded,
    showPopup,
    setShowPopup,
    scenario,
    setScenario,
    lesson,
    setLesson,
    lessonEnded,
    setLessonEnded,
    isPromoting,
    setIsPromoting,
    promotionPosition,
    setPromotionPosition,
    counterRef,
  };

  return (
    <LessonContext.Provider value={value}>{children}</LessonContext.Provider>
  );
};

export const useLessonContext = () => useContext(LessonContext);
