import pageStyles from "./Lessons.module.scss";
import profileStyles from "./Lessons-profile.module.scss";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ReactComponent as RedoIcon } from './icon_redo.svg';
import { ReactComponent as BackIcon} from './icon_back.svg';
import { ReactComponent as BackIconInactive} from './icon_back_inactive.svg';
import { ReactComponent as NextIcon } from './icon_next.svg';
import { ReactComponent as NextIconInactive } from './icon_next_inactive.svg';
import { getScenario, getScenarioLength } from "./Scenarios";
import { Navigate, useNavigate, useLocation } from "react-router";
// @ts-ignore
import PromotionPopup from "./PromotionPopup";

type Board = (string | null)[][];

type LessonsProps = {
  testOverrides?: any;
  styleType?: any;
};

const Lessons = ({ testOverrides, styleType = "page" }: LessonsProps) => {

  // Use memoization to maintain referential equality and avoid unnecessary re-renders
  const styles = useMemo(() => styleType === 'profile' ? profileStyles : pageStyles, [styleType]);

  const navigate = useNavigate();
  const [board, setBoard] = useState(getScenario(0).subSections[0].board); // Initialize the board with chess pieces
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [draggingPiece, setDraggingPiece] = useState(null); // Track which piece is being dragged

  const [leftEnded, setLeftEnded] = useState(true); // track whether there are any more previous scenarios
  const [rightEnded, setRightEnded] = useState(false); // track whether there are any more upcoming scenarios
  const [showPopup, setShowPopup] = useState(false); // Popup state

  const [scenario, setScenario] = useState(getScenario(0)); // Current scenario like "pawn", "checkmates", etc.
  const [lesson, setLesson] = useState(getScenario(0).subSections[0]); // Current lesson / subsection under the scenario
  const [lessonEnded, setLessonEnded] = useState(false);

  const counterRef = useRef(0); // Current counter that indexes current scenario in scenariosArray

  const location = useLocation();
  const passedScenarioName = location.state?.scenario;
  const passedLessonName = location.state?.lesson;

  const [isPromoting, setIsPromoting] = useState(false); // State to track if a pawn is being promoted
  const [promotionPosition, setPromotionPosition] = useState(null); // Position of the pawn being promoted

  // Initialize the chessboard
  function initializeBoard(): Board {
    return [
      [null, null, null, null, null, null, null, null], // Empty row
      [null, null, null, null, null, null, null, null], // Empty row
      [null, null, null, null, null, null, null, null], // Empty row
      [null, null, null, null, null, null, null, null], // Empty row
      [null, null, null, null, null, null, null, null], // Empty row
      [null, null, null, null, null, null, null, null], // Empty row
      [null, null, null, null, null, null, null, null], // Empty row
      [null, null, null, null, null, null, null, null], // Empty row
    ];
  }

  // Popup
  // Function to check if all black pieces are removed
  const checkBlackPieces = () => {
    const blackPieces = board
      .flat()
      .filter((piece) => piece && piece[0] === "b"); // Filter out black pieces
    if (blackPieces.length === 0 && !lessonEnded) {
      setShowPopup(true); // Show the popup
    }
  };

  // Reset the chessboard when the popup confirm button is clicked
  const handlePopupConfirm = () => {
    setShowPopup(false);
    goToNextLesson();
  };

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

  // Set up the board for a different lesson, under same scenario
  const setupLesson = (section) => {
    setLessonEnded(false); // start lesson if not
    setLesson(section);
    setBoard(JSON.parse(JSON.stringify(section.board)));
    setHighlightedSquares([]);
  };

  useEffect(() => {
    if (testOverrides?.highlightedSquares) {
      setHighlightedSquares(testOverrides.highlightedSquares);
    }
  }, [testOverrides]);

  useEffect(() => {
    const initializeLesson = async () => {
      // Make async to use await (if needed later)
      if (passedScenarioName && passedLessonName) {
        try {
          // 1. Find the scenario (using a more robust approach)
          let foundScenarioIndex = -1;
          for (let i = 0; i < getScenarioLength(); i++) {
            if (getScenario(i).name.includes(passedScenarioName)) {
              foundScenarioIndex = i;
              break;
            }
          }

          if (foundScenarioIndex !== -1) {
            const foundScenario = getScenario(foundScenarioIndex);

            // 2. Find the lesson within the scenario
            const foundLesson = foundScenario.subSections.find(
              (l) => l.name === passedLessonName
            );

            if (foundLesson) {
              // 3. Set state
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
              // Handle error (e.g., redirect)
            }
          } else {
            console.error(`Scenario "${passedScenarioName}" not found`);
            // Handle error
          }
        } catch (error) {
          console.error("Error initializing lesson:", error);
          // Handle error (e.g., redirect)
        }
      } else {
        // Default initialization
        const defaultScenario = getScenario(0);
        setScenario(defaultScenario);
        setLesson(defaultScenario.subSections[0]);
        setBoard(
          JSON.parse(JSON.stringify(defaultScenario.subSections[0].board))
        );
        setLeftEnded(defaultScenario.subSections[0].left_ended);
        setRightEnded(defaultScenario.subSections[0].right_ended);
      }
    };

    initializeLesson();
  }, [location]);

  // Switching to previous / next scenario, x: -1 or 1
  const setupScenario = (x) => {
    counterRef.current += x; // update scenario index
    setLessonEnded(false); // start lesson if not

    //update lessons & board
    setScenario(getScenario(counterRef.current));
    setLesson(getScenario(counterRef.current).subSections[0]);
    setBoard(
      JSON.parse(
        JSON.stringify(getScenario(counterRef.current).subSections[0].board)
      )
    );

    // check if there are any previous/next scenarios to update button color
    setLeftEnded(getScenario(counterRef.current).subSections[0].left_ended);
    setRightEnded(getScenario(counterRef.current).subSections[0].right_ended);
  };

  // Auto load to next lesson
  const goToNextLesson = () => {
    // get index of current lesson
    const currentLessonIndex = scenario.subSections.findIndex(
      (l) => l.name === lesson.name
    );
    if (currentLessonIndex === -1) {
      console.error("Current lesson not found in scenario.");
      return;
    }

    if (currentLessonIndex >= scenario.subSections.length - 1) {
      // all lessons in this scenario have been displayed, so go to next scenario
      if (!rightEnded) setupScenario(1);
      else {
        // if no more scenarios left
        setBoard(initializeBoard());
        setLessonEnded(true);
      }
    } else {
      // display next lesson in this scenario
      setupLesson(scenario.subSections[currentLessonIndex + 1]);
    }
  };

  // Helper function to get possible moves for a piece
  const getPieceMoves = (piece: string | any[], position: any) => {
    console.log("getPieceMoves called with piece:", piece, "at position:", position);
    const color = piece[0]; // Get color from the piece (first character)
    switch (piece[1]) {
      case "P":
        return getPawnMoves(position, color === "w", board);
      case "R":
        return getRookMoves(position, color === "w", board); // Pass color directly
      case "N":
        return getKnightMoves(position, color === "w", board); // Pass color directly
      case "B":
        return getBishopMoves(position, color === "w", board); // Pass color directly
      case "K":
        return getKingMoves(position, color === "w", board); // Pass color directly
      case "Q":
        return getQueenMoves(position, color === "w", board); // Pass color directly
      default:
        return [];
    }
  };

  // Handle hover to show possible moves
  const handleSquareHover = (key: any) => {
    const [row, col] = key.split("-").map(Number);
    const piece = board[row][col];

    // Clear previous highlights
    setHighlightedSquares(prev => {
      if (prev.length === 0) return prev; // Maintain referential equality to reduce board renders
      return [];
    });

    if (piece) {
      const possibleMoves = getPieceMoves(piece, key);
      setHighlightedSquares(possibleMoves); // Highlight valid move squares
    } else {
      // Check if the square has an opponent's piece
      const targetPiece = board[row][col];
      if (
        targetPiece &&
        draggingPiece?.piece &&
        targetPiece[0] !== draggingPiece.piece.color
      ) {
        setHighlightedSquares((prev) => [...prev, key]); // Highlight the opponent's piece square
      }
    }
  };

  // Handle drag start
  const handleDragStart = (e: any, piece: any, position: any) => {
    setDraggingPiece({ piece, position });
    e.dataTransfer.setDragImage(e.target, 20, 20); // Set the drag image with a specified offset
  };

  // Handle drop on a square
  const handleDrop = (key: any) => {
    console.log("handleDrop called with key:", key);
    if (highlightedSquares.includes(key)) {
      console.log("Square is highlighted, proceeding with drop");

      const [startRow, startCol] =
        draggingPiece !== null
          ? draggingPiece.position.split("-").map(Number)
          : [0, 0];
      const [endRow, endCol] = key.split("-").map(Number);

      const targetPiece = board[endRow][endCol];

      if (
        targetPiece &&
        targetPiece[0] !== (draggingPiece!.piece.color as string)
      ) {
        console.log(`Captured ${targetPiece}`);
      }

      const updatedBoard: any = [...board];
      updatedBoard[endRow][endCol] = draggingPiece ? draggingPiece.piece : ""; // Move piece to new square
      updatedBoard[startRow][startCol] = null; // Clear old square

      // Check if the moved piece is a pawn reaching the promotion rank
      if (
        (draggingPiece.piece === "wP" && endRow === 0) ||
        (draggingPiece.piece === "bP" && endRow === 7)
      ) {
        setPromotionPosition(key); // Set the position for promotion
        setIsPromoting(true); // Set promoting state to true
      } else {
        console.log("Updating board state without promotion");
        setBoard(updatedBoard); // Update board state
      }
    }
    setDraggingPiece(null);
    setHighlightedSquares([]);
  };

  // Handle drag over a square (allow dropping)
  const handleDragOver = (e: any) => {
    e.preventDefault(); // Prevent default behavior to allow dropping
  };

  // Update promotePawn function to set the board state
  function promotePawn(position: any, piece: string) {
    const [row, col] = position.split("-").map(Number);
    const updatedBoard = [...board];
    const color = board[row][col] !== null ? board[row][col]![0] : ""; // Safely accessing the color
    const newPiece = color === "w" ? `w${piece}` : `b${piece}`; // Promote to selected piece

    updatedBoard[row][col] = newPiece; // Update the board with the new queen
    setBoard(updatedBoard); // Set the new board state
    setIsPromoting(false); // Close the promotion popup
  }

  // Reset moved pieces to their original positions to restart the training
  const resetBoard = () => {
    if (lesson) {
      console.log("Resetting board to original lesson state");
      setLessonEnded(false); // start lesson if not
      setBoard(JSON.parse(JSON.stringify(lesson.board)));
    }
  };

  // Determine the classname for the back button based on whether there are previous lessons
  const backButtonClassname = rightEnded
    ? "prevNextLessonButton-inactive prev"
    : "prevNextLessonButton prev";

  // Memoize the calculation of the chess board to avoid unnecessary re-renders
  const chessBoard = React.useMemo(() => {
    return createChessBoard(
      board,
      highlightedSquares,
      setHighlightedSquares,
      handleSquareHover,
      handleDragStart,
      handleDrop,
      handleDragOver,
      draggingPiece,
      styles
    );
  }, [board, highlightedSquares, draggingPiece, styles]);

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
              {chessBoard}
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

// Create chess board
export function createChessBoard(
  board: any[][],
  highlightedSquares: string | string[],
  setHighlightedSquares: any,
  handleSquareHover: any,
  handleDragStart: any,
  handleDrop: any,
  handleDragOver: any,
  draggingPiece: any,
  styles: any
) {

  const rows = 8;
  const cols = 8;
  const chessBoard = [];

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"]; // a-h labels
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"]; // 1-8 labels, reversed

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const key = `${i}-${j}`;
      const isLightSquare = (i + j) % 2 === 0;
      const squareColor = isLightSquare ? "#f0d9b5" : "#b58863";

      const piece = board[i][j]; // Get piece at current position
      const pieceImage = piece
        ? `/assets/images/chesspieces/wikipedia/${piece}.png`
        : null; // Construct image path

      chessBoard.push(
        <div
          key={key}
          className={styles.square}
          data-testid={`square-${key}`}
          style={{
            backgroundColor: squareColor,
            filter: highlightedSquares.includes(key)
              ? "brightness(80%)"
              : "brightness(100%)",
            position: "relative", // Allow positioning for labels and circles
            transition: "filter 0.4s ease",
          }}

          onMouseEnter={() => handleSquareHover(key)} // Show possible moves on hover

          onMouseLeave={() => setHighlightedSquares(prev => {
            if (prev.length === 0) return prev; // Maintain referential equality
            return [];
          })} // Clear highlights when mouse leaves

          onDrop={() => handleDrop(key)} // Handle drop
          onDragOver={handleDragOver} // Allow drag-over for dropping
        >
          {/* Show gray circle for possible moves on hover */}
          {highlightedSquares.includes(key) && (
            <div className={styles.highlightCircle} />
          )}
          {/* If there is a piece here, show the circle for the opponent's piece */}
          {piece &&
            piece[0] !== draggingPiece?.piece[0] &&
            highlightedSquares.includes(key) && (
              <div className={styles.highlightCircle} />
            )}
          {/* Add rank and file labels */}
          {j === 0 && <span className={styles.rankLabel}>{ranks[i]}</span>}{" "}
          {/* Rank labels (1-8) */}
          {i === 7 && <span className={styles.fileLabel}>{files[j]}</span>}{" "}
          {/* File labels (a-h) */}
          {/* Display piece image */}
          {pieceImage && (
            <img
              src={pieceImage}
              alt={piece}
              data-testid={`piece-${piece}`}
              className={styles.pieceImage}
              draggable // Allow dragging
              onDragStart={(e) => handleDragStart(e, piece, key)} // Dragging starts
            />
          )}
        </div>
      );
    }
  }
  return chessBoard;
}

// Helper to check if a position is within board bounds
export function isInBounds(row: number, col: number) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Pawn movement (handles both white and black)
export function getPawnMoves(
  position: { split: any },
  isWhite: boolean,
  board: Board
) {
  // Prevent black pawns from moving
  if (!isWhite) return [];

  const [row, col] = position.split("-").map(Number);
  const direction = -1; // White pawns only move upwards
  const possibleMoves = [];

  // Check forward move (1 square)
  if (
    isInBounds(row + direction, col) &&
    board[row + direction][col] === null
  ) {
    possibleMoves.push(`${row + direction}-${col}`);

    // Check forward move (2 squares) if in starting position
    const startingRow = 6; // White pawns start at row 6
    if (
      row === startingRow &&
      isInBounds(row + 2 * direction, col) &&
      board[row + 2 * direction][col] === null
    ) {
      possibleMoves.push(`${row + 2 * direction}-${col}`);
    }
  }

  // Check for captures (diagonal moves)
  const captureMoves = [
    { row: row + direction, col: col - 1 }, // Capture left
    { row: row + direction, col: col + 1 }, // Capture right
  ];

  captureMoves.forEach(({ row, col }) => {
    if (isInBounds(row, col) && board[row][col] && board[row][col][0] !== "w") {
      // Check color
      possibleMoves.push(`${row}-${col}`); // Add capture move if there's an opponent's piece
    }
  });

  // Check for promotion if the pawn reaches the last row
  if (row === 0) {
    return possibleMoves.concat("promote"); // Indicate promotion to queen for white
  }

  return possibleMoves;
}

// Rook movement (handles both white and black)
export function getRookMoves(
  position: { split: any },
  isWhite: boolean,
  board: Board
) {
  // Prevent black pieces from moving
  if (!isWhite) return [];

  const [row, col] = position.split("-").map(Number);
  const moves: string[] = [];

  // Horizontal and vertical movement
  const directions = [
    { r: 1, c: 0 }, // Down
    { r: -1, c: 0 }, // Up
    { r: 0, c: 1 }, // Right
    { r: 0, c: -1 }, // Left
  ];

  directions.forEach(({ r, c }) => {
    for (let i = 1; i < 8; i++) {
      const newRow = row + r * i;
      const newCol = col + c * i;
      if (!isInBounds(newRow, newCol)) break; // Stop if out of bounds

      if (!board[newRow][newCol]) {
        moves.push(`${newRow}-${newCol}`);
      } else {
        if (board[newRow][newCol][0] !== "w") {
          moves.push(`${newRow}-${newCol}`); // Capture move
        }
        break; // Stop if there's a piece blocking the path
      }
    }
  });

  return moves;
}

// Knight movement (handles both white and black)
export function getKnightMoves(
  position: { split: any },
  isWhite: boolean,
  board: Board
) {
  // Prevent black pieces from moving
  if (!isWhite) return [];

  const [row, col] = position.split("-").map(Number);
  const moves = [];
  const knightMoves = [
    [row - 2, col - 1],
    [row - 2, col + 1],
    [row - 1, col - 2],
    [row - 1, col + 2],
    [row + 1, col - 2],
    [row + 1, col + 2],
    [row + 2, col - 1],
    [row + 2, col + 1],
  ];

  for (const [r, c] of knightMoves) {
    if (isInBounds(r, c) && (!board[r][c] || board[r][c][0] !== "w")) {
      moves.push(`${r}-${c}`);
    }
  }

  return moves;
}

// Bishop movement (handles both white and black)
export function getBishopMoves(
  position: { split: any },
  isWhite: boolean,
  board: Board
) {
  // Prevent black pieces from moving
  if (!isWhite) return [];

  const [row, col] = position.split("-").map(Number);
  const moves: string[] = [];

  // Diagonal movement (Top-right, Top-left, Bottom-right, Bottom-left)
  const directions = [
    { r: 1, c: 1 }, // Bottom-right
    { r: 1, c: -1 }, // Bottom-left
    { r: -1, c: 1 }, // Top-right
    { r: -1, c: -1 }, // Top-left
  ];

  directions.forEach(({ r, c }) => {
    for (let i = 1; i < 8; i++) {
      const newRow = row + r * i;
      const newCol = col + c * i;
      if (!isInBounds(newRow, newCol)) break; // Stop if out of bounds

      if (!board[newRow][newCol]) {
        moves.push(`${newRow}-${newCol}`);
      } else {
        if (board[newRow][newCol][0] !== "w") {
          moves.push(`${newRow}-${newCol}`); // Capture move
        }
        break; // Stop if there's a piece blocking the path
      }
    }
  });

  return moves;
}

// King movement (handles both white and black)
export function getKingMoves(
  position: { split: any },
  isWhite: boolean,
  board: Board
) {
  // Prevent black pieces from moving
  if (!isWhite) return [];

  const [row, col] = position.split("-").map(Number);
  const moves = [];
  const kingMoves = [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1], // Vertical and horizontal
    [row - 1, col - 1],
    [row - 1, col + 1],
    [row + 1, col - 1],
    [row + 1, col + 1], // Diagonal
  ];

  for (const [r, c] of kingMoves) {
    if (isInBounds(r, c) && (!board[r][c] || board[r][c][0] !== "w")) {
      moves.push(`${r}-${c}`);
    }
  }

  return moves;
}

// Queen movement (combines Rook + Bishop) - handles both white and black
export function getQueenMoves(position: any, isWhite: boolean, board: Board) {
  // Prevent black pieces from moving
  if (!isWhite) return [];

  return [
    ...getRookMoves(position, isWhite, board),
    ...getBishopMoves(position, isWhite, board),
  ];
}

export default Lessons;
