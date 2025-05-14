import "./Lessons.scss";
import React, { useState, useEffect, useRef } from 'react';
import { ReactComponent as RedoIcon } from './icon_redo.svg';
import { ReactComponent as BackIcon} from './icon_back.svg';
import { ReactComponent as BackIconInactive} from './icon_back_inactive.svg';
import { ReactComponent as NextIcon } from './icon_next.svg';
import { ReactComponent as NextIconInactive } from './icon_next_inactive.svg';
import { getScenario } from "./Scenarios";

const Lessons = () => {
  const [board, setBoard] = useState(getScenario(0).subSections[0].board); // Initialize the board with chess pieces
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [draggingPiece, setDraggingPiece] = useState(null); // Track which piece is being dragged
  const [leftEnded, setLeftEnded] = useState(true);
  const [rightEnded, setRightEnded] = useState(false);

  // Description for each Scenarios
  const [scenario, setScenario] = useState(getScenario(0))
  const [lesson, setLesson] = useState(getScenario(0).subSections[0])

  const counterRef = useRef(0); // Counter for updating different scenarios

  const [showPopup, setShowPopup] = useState(false); // Popup state
  const [trainingStarted, setTrainingStarted] = useState(true); // Training state

  // Initialize the chessboard
  function initializeBoard() {
    return [
      [null, null, null, null, null, null, null, null],  // Empty row
      [null, null, null, null, null, null, null, null],  // Empty row
      [null, null, null, null, null, null, null, null],  // Empty row
      [null, null, null, null, null, null, null, null],  // Empty row
      [null, null, null, null, null, null, null, null],  // Empty row
      [null, null, null, null, null, null, null, null],  // Empty row
      [null, null, null, null, null, null, null, null],  // Empty row
      [null, null, null, null, null, null, null, null],  // Empty row
    ];
  }

  // Popup
  // Function to check if all black pieces are removed
  const checkBlackPieces = () => {
    const blackPieces = board.flat().filter(piece => piece && piece[0] === 'b'); // Filter out black pieces
    if (blackPieces.length === 0 && trainingStarted === true) {
      setShowPopup(true); // Show the popup
    }
  };

  // Reset the chessboard when the popup confirm button is clicked
  const handlePopupConfirm = () => {
    if (trainingStarted === true) {
      setShowPopup(false);
      setBoard(initializeBoard()); // Reset the chessboard
      setTrainingStarted(false); // Reset training state
    }
  };

  // Check for black pieces every time the board state changes
  useEffect(() => {
    checkBlackPieces();
  }, [board]);

  // Set up the board for different scenarios
  const setupScenario = (section) => {
    setLesson(section)
    setBoard(JSON.parse(JSON.stringify(section.board)))
    setTrainingStarted(true)
    setHighlightedSquares([]);
  };

  // Going back and forth between different scenarios, x: -1 or 1
  const rotateScenario = (x) => {
    counterRef.current += x
    setScenario(getScenario(counterRef.current))
    setLesson(getScenario(counterRef.current).subSections[0])
    setTrainingStarted(true);
    setBoard(JSON.parse(JSON.stringify(getScenario(counterRef.current).subSections[0].board)));
    setLeftEnded(getScenario(counterRef.current).subSections[0].left_ended)
    setRightEnded(getScenario(counterRef.current).subSections[0].right_ended)
  };

  // Helper function to get possible moves for a piece
  const getPieceMoves = (piece, position) => {
    const color = piece[0]; // Get color from the piece (first character)
    switch (piece[1]) {
      case 'P':
        return getPawnMoves(position, color === 'w', board);
      case 'R':
        return getRookMoves(position, color === 'w', board); // Pass color directly
      case 'N':
        return getKnightMoves(position, color === 'w', board); // Pass color directly
      case 'B':
        return getBishopMoves(position, color === 'w', board); // Pass color directly
      case 'K':
        return getKingMoves(position, color === 'w', board); // Pass color directly
      case 'Q':
        return getQueenMoves(position, color === 'w', board); // Pass color directly
      default:
        return [];
    }
  };

  // Handle hover to show possible moves
  const handleSquareHover = (key) => {
    const [row, col] = key.split('-').map(Number);
    const piece = board[row][col];

    // Clear previous highlights
    setHighlightedSquares([]);

    if (piece) {
      const possibleMoves = getPieceMoves(piece, key);
      setHighlightedSquares(possibleMoves); // Highlight valid move squares
    } else {
      // Check if the square has an opponent's piece
      const targetPiece = board[row][col];
      if (targetPiece && targetPiece[0] !== draggingPiece?.piece[0]) {
        setHighlightedSquares((prev) => [...prev, key]); // Highlight the opponent's piece square
      }
    }
  };

  // Handle drag start
  const handleDragStart = (e, piece, position) => {
    setDraggingPiece({ piece, position });
    e.dataTransfer.setDragImage(e.target, 20, 20); // Set the drag image with a specified offset
  };

  // Handle drop on a square
  const handleDrop = (key) => {
    if (highlightedSquares.includes(key)) {
      const [startRow, startCol] = draggingPiece.position.split('-').map(Number);
      const [endRow, endCol] = key.split('-').map(Number);

      const targetPiece = board[endRow][endCol];

      if (targetPiece && targetPiece.color !== draggingPiece.piece.color) {
        console.log(`Captured ${targetPiece.type}`);
      }

      const updatedBoard = [...board];
      updatedBoard[endRow][endCol] = draggingPiece.piece; // Move piece to new square
      updatedBoard[startRow][startCol] = null;            // Clear old square

      // Check if the moved piece is a pawn reaching the promotion rank
      if (draggingPiece.piece[1] === 'P' && (endRow === 0 || endRow === 7)) {
        promotePawn(key); // Call promote function
      } else {
        setBoard(updatedBoard); // Update board state
      }
    }
    setDraggingPiece(null);
    setHighlightedSquares([]);
  };

  // Handle drag over a square (allow dropping)
  const handleDragOver = (e) => {
    e.preventDefault(); // Prevent default behavior to allow dropping
  };

  // Update promotePawn function to set the board state
  function promotePawn(position) {
    const [row, col] = position.split('-').map(Number);
    const updatedBoard = [...board];
    const color = board[row][col][0]; // Determine color of the pawn
    const newPiece = color === 'w' ? 'wQ' : 'bQ'; // Promote to Queen

    updatedBoard[row][col] = newPiece; // Update the board with the new queen
    setBoard(updatedBoard); // Set the new board state
  }

  // Reset moved pieces to their original positions to restart the training
  const resetBoard = () => {
    if (lesson) {
      setBoard(JSON.parse(JSON.stringify(lesson.board)))
      setTrainingStarted(true)
    }
  }

  return (
    <div className="lessons-page">
      <div className='left-right-container'>
        {/* Div for elements on the left */}
        <div className='left-container'>
          <div className="chessboard-container_L">
            <div className="button-container">
              <button className="lesson-button">Lesson</button>
              <button className="play-button">Play</button>
            </div>
            <div className="chessboard_L">
              {createChessBoard(
                board,
                highlightedSquares,
                setHighlightedSquares,
                handleSquareHover,
                handleDragStart,
                handleDrop,
                handleDragOver,
                draggingPiece
              )}
            </div>
          </div>
        </div>

        {/* div for elements on the right */}
        <div className='right-container'>
          {/* Description part */}
          <div className='lesson-header'>
            <h1 className="piece_description">{scenario.name}</h1>
            <button className='reset-lesson' onClick={resetBoard}>
              <RedoIcon className='reset-icon'/>
            </button>
          </div>

          <h1 className='subheading'>{lesson.name}</h1>
          <p className="lesson-description">{lesson.info}</p>

          <div className='prev-next-button-container'>
            {
              leftEnded? (
                <button className="prevNextLessonButton-inactive prev">
                  <BackIconInactive/>
                  <p className="button-description">Back</p>
                </button>
              ) : (
                <button className="prevNextLessonButton prev" onClick={() => rotateScenario(-1)}>
                  <BackIcon/>
                  <p className="button-description">Back</p>
                </button>
              )
            }

            {rightEnded? (
                <button className="prevNextLessonButton-inactive next">
                  <p className="button-description">Next</p>
                  <NextIconInactive/>
                </button>
              ) : (
                <button className="prevNextLessonButton next" onClick={() => rotateScenario(1)}>
                  <p className="button-description">Next</p>
                  <NextIcon/>
                </button>
              )
            }
          </div>
        </div>

      </div>
      <div>
        <div className="lesson-buttons-container">
          {scenario.subSections?.map((section, index) => (
            <button 
              key={index}
              className={section.name == lesson.name ? "lesson-buttons active" : "lesson-buttons"}  
              onClick={() => setupScenario(section)}
            >
              {section.name}
            </button>
          ))}
        </div>
      </div>

      {/* Popup for lesson completion */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <div className="success-checkmark">
              <svg width="80" height="80" viewBox="0 0 120 120">
                <circle className="circle" cx="60" cy="60" r="54" fill="none" stroke="#beea8b" stroke-width="6"></circle>
                <path className="checkmark" d="M35 60 L55 80 L85 40" fill="none" stroke="#beea8b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
            <p className="popup-header">Lesson completed</p>
            <p className="popup-subheading">Good job</p>
            <button className="popup-button" onClick={handlePopupConfirm}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Create chess board
export function createChessBoard(
  board,
  highlightedSquares,
  setHighlightedSquares,
  handleSquareHover,
  handleDragStart,
  handleDrop,
  handleDragOver,
  draggingPiece
) {
  const rows = 8;
  const cols = 8;
  const chessBoard = [];

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']; // a-h labels
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']; // 1-8 labels, reversed

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const key = `${i}-${j}`;
      const isLightSquare = (i + j) % 2 === 0;
      const squareColor = isLightSquare ? '#f0d9b5' : '#b58863';

      const piece = board[i][j]; // Get piece at current position
      const pieceImage = piece
        ? `/assets/images/chesspieces/wikipedia/${piece}.png`
        : null; // Construct image path

      chessBoard.push(
        <div
          key={key}
          className="square_L"
          style={{
            backgroundColor: squareColor,
            filter: highlightedSquares.includes(key) ? 'brightness(80%)' : 'brightness(100%)',
            position: 'relative', // Allow positioning for labels and circles
            transition: 'filter 0.4s ease'
          }}
          onMouseEnter={() => handleSquareHover(key)} // Show possible moves on hover
          onMouseLeave={() => setHighlightedSquares([])} // Clear highlights when mouse leaves
          onDrop={() => handleDrop(key)} // Handle drop
          onDragOver={handleDragOver} // Allow drag-over for dropping
        >
          {/* Show gray circle for possible moves on hover */}
          {highlightedSquares.includes(key) && <div className="highlight-circle" />}

          {/* If there is a piece here, show the circle for the opponent's piece */}
          {piece && piece[0] !== draggingPiece?.piece[0] && highlightedSquares.includes(key) && (
            <div className="highlight-circle" />
          )}

          {/* Add rank and file labels */}
          {j === 0 && <span className="rank-label">{ranks[i]}</span>} {/* Rank labels (1-8) */}
          {i === 7 && <span className="file-label">{files[j]}</span>} {/* File labels (a-h) */}

          {/* Display piece image */}
          {pieceImage && (
            <img
              src={pieceImage}
              alt={piece}
              className="piece-image"
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
export function isInBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Pawn movement (handles both white and black)
export function getPawnMoves(position, isWhite, board) {
  // Prevent black pawns from moving
  if (!isWhite) return [];

  const [row, col] = position.split('-').map(Number);
  const direction = -1; // White pawns only move upwards
  const possibleMoves = [];

  // Check forward move (1 square)
  if (isInBounds(row + direction, col) && board[row + direction][col] === null) {
    possibleMoves.push(`${row + direction}-${col}`);

    // Check forward move (2 squares) if in starting position
    const startingRow = 6; // White pawns start at row 6
    if (row === startingRow && isInBounds(row + 2 * direction, col) && board[row + 2 * direction][col] === null) {
      possibleMoves.push(`${row + 2 * direction}-${col}`);
    }
  }

  // Check for captures (diagonal moves)
  const captureMoves = [
    { row: row + direction, col: col - 1 }, // Capture left
    { row: row + direction, col: col + 1 }  // Capture right
  ];

  captureMoves.forEach(({ row, col }) => {
    if (isInBounds(row, col) && board[row][col] && board[row][col][0] !== 'w') { // Check color
      possibleMoves.push(`${row}-${col}`); // Add capture move if there's an opponent's piece
    }
  });

  // Check for promotion if the pawn reaches the last row
  if (row === 0) {
    return possibleMoves.concat('promote'); // Indicate promotion to queen for white
  }

  return possibleMoves;
}

// Rook movement (handles both white and black)
export function getRookMoves(position, isWhite, board) {
  // Prevent black pieces from moving
  if (!isWhite) return [];

  const [row, col] = position.split('-').map(Number);
  const moves = [];

  // Horizontal and vertical movement
  const directions = [
    { r: 1, c: 0 }, // Down
    { r: -1, c: 0 }, // Up
    { r: 0, c: 1 }, // Right
    { r: 0, c: -1 }  // Left
  ];

  directions.forEach(({ r, c }) => {
    for (let i = 1; i < 8; i++) {
      const newRow = row + r * i;
      const newCol = col + c * i;
      if (!isInBounds(newRow, newCol)) break; // Stop if out of bounds

      if (!board[newRow][newCol]) {
        moves.push(`${newRow}-${newCol}`);
      } else {
        if (board[newRow][newCol][0] !== 'w') {
          moves.push(`${newRow}-${newCol}`); // Capture move
        }
        break; // Stop if there's a piece blocking the path
      }
    }
  });

  return moves;
}

// Knight movement (handles both white and black)
export function getKnightMoves(position, isWhite, board) {
  // Prevent black pieces from moving
  if (!isWhite) return [];

  const [row, col] = position.split('-').map(Number);
  const moves = [];
  const knightMoves = [
    [row - 2, col - 1], [row - 2, col + 1],
    [row - 1, col - 2], [row - 1, col + 2],
    [row + 1, col - 2], [row + 1, col + 2],
    [row + 2, col - 1], [row + 2, col + 1]
  ];

  for (const [r, c] of knightMoves) {
    if (isInBounds(r, c) && (!board[r][c] || board[r][c][0] !== 'w')) {
      moves.push(`${r}-${c}`);
    }
  }

  return moves;
}

// Bishop movement (handles both white and black)
export function getBishopMoves(position, isWhite, board) {
  // Prevent black pieces from moving
  if (!isWhite) return [];

  const [row, col] = position.split('-').map(Number);
  const moves = [];

  // Diagonal movement (Top-right, Top-left, Bottom-right, Bottom-left)
  const directions = [
    { r: 1, c: 1 },  // Bottom-right
    { r: 1, c: -1 }, // Bottom-left
    { r: -1, c: 1 }, // Top-right
    { r: -1, c: -1 } // Top-left
  ];

  directions.forEach(({ r, c }) => {
    for (let i = 1; i < 8; i++) {
      const newRow = row + r * i;
      const newCol = col + c * i;
      if (!isInBounds(newRow, newCol)) break; // Stop if out of bounds

      if (!board[newRow][newCol]) {
        moves.push(`${newRow}-${newCol}`);
      } else {
        if (board[newRow][newCol][0] !== 'w') {
          moves.push(`${newRow}-${newCol}`); // Capture move
        }
        break; // Stop if there's a piece blocking the path
      }
    }
  });

  return moves;
}

// King movement (handles both white and black)
export function getKingMoves(position, isWhite, board) {
  // Prevent black pieces from moving
  if (!isWhite) return [];

  const [row, col] = position.split('-').map(Number);
  const moves = [];
  const kingMoves = [
    [row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1], // Vertical and horizontal
    [row - 1, col - 1], [row - 1, col + 1], [row + 1, col - 1], [row + 1, col + 1] // Diagonal
  ];

  for (const [r, c] of kingMoves) {
    if (isInBounds(r, c) && (!board[r][c] || board[r][c][0] !== 'w')) {
      moves.push(`${r}-${c}`);
    }
  }

  return moves;
}

// Queen movement (combines Rook + Bishop) - handles both white and black
export function getQueenMoves(position, isWhite, board) {
  // Prevent black pieces from moving
  if (!isWhite) return [];

  return [...getRookMoves(position, isWhite, board), ...getBishopMoves(position, isWhite, board)];
}


export default Lessons;

