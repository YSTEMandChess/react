import "./Lessons.scss";
import React, { useState } from 'react';

const Lessons = () => {
  const [board, setBoard] = useState(initializeBoard()); // Initialize the board with chess pieces
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [draggingPiece, setDraggingPiece] = useState(null); // Track which piece is being dragged

  // Initialize the chessboard with pieces in starting positions
  function initializeBoard() {
    return [
      ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'], // Black pieces
      ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'], // Black pawns
      [null, null, null, null, null, null, null, null],  // Empty row
      [null, null, null, null, null, null, null, null],  // Empty row
      [null, null, null, null, null, null, null, null],  // Empty row
      [null, null, null, null, null, null, null, null],  // Empty row
      ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'], // White pawns
      ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']  // White pieces
    ];
  }

// Helper function to get possible moves for a piece
const getPieceMoves = (piece, position) => {
  const color = piece[0]; // Get color from the piece (first character)
  switch (piece[1]) {
    case 'P':
      return getPawnMoves(position, color === 'w', board);
    case 'R':
      return getRookMoves(position, color, board); // Pass color directly
    case 'N':
      return getKnightMoves(position, color, board); // Pass color directly
    case 'B':
      return getBishopMoves(position, color, board); // Pass color directly
    case 'K':
      return getKingMoves(position, color, board); // Pass color directly
    case 'Q':
      return getQueenMoves(position, color, board); // Pass color directly
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
  
      setBoard(updatedBoard);
    }
    setDraggingPiece(null);
    setHighlightedSquares([]);
  };
  


  // Handle drag over a square (allow dropping)
  const handleDragOver = (e) => {
    e.preventDefault(); // Prevent default behavior to allow dropping
  };
  return (
    <div className="lessons-page">
      <div className="chessboard-container">
          <div className="button-container">
            <button className="lesson-button">Lesson</button>
            <button className="play-button">Play</button>
          </div>
          <div className="chessboard">
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
  );
};

// Create chess board
function createChessBoard(
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
          className="square"
          style={{
            backgroundColor: highlightedSquares.includes(key) ? 'transparent' : squareColor,
            position: 'relative', // Allow positioning for labels and circles
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
function isInBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Pawn movement (handles both white and black)
export function getPawnMoves(position, isWhite, board) {
  const [row, col] = position.split('-').map(Number);
  const direction = isWhite ? -1 : 1; // Determine direction based on color
  const possibleMoves = [];
  
  // Check forward move (1 square)
  if (isInBounds(row + direction, col) && board[row + direction][col] === null) {
    possibleMoves.push(`${row + direction}-${col}`);
    
    // Check forward move (2 squares) if in starting position
    const startingRow = isWhite ? 6 : 1; // White pawns start at row 6, black pawns at row 1
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
    if (isInBounds(row, col) && board[row][col] && board[row][col][0] !== (isWhite ? 'w' : 'b')) { // Check color
      possibleMoves.push(`${row}-${col}`); // Add capture move if there's an opponent's piece
    }
  });

  return possibleMoves;
}


// Rook movement (handles both white and black)
export function getRookMoves(position, isWhite, board) {
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
        if (board[newRow][newCol][0] !== (isWhite ? 'w' : 'b')) {
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
  const [row, col] = position.split('-').map(Number);
  const moves = [];
  const knightMoves = [
    [row - 2, col - 1], [row - 2, col + 1],
    [row - 1, col - 2], [row - 1, col + 2],
    [row + 1, col - 2], [row + 1, col + 2],
    [row + 2, col - 1], [row + 2, col + 1]
  ];

  for (const [r, c] of knightMoves) {
    if (isInBounds(r, c) && (!board[r][c] || board[r][c][0] !== (isWhite ? 'w' : 'b'))) {
      moves.push(`${r}-${c}`);
    }
  }

  return moves;
}

// Bishop movement (handles both white and black)
export function getBishopMoves(position, isWhite, board) {
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
        if (board[newRow][newCol][0] !== (isWhite ? 'w' : 'b')) {
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
  const [row, col] = position.split('-').map(Number);
  const moves = [];
  const kingMoves = [
    [row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1], // Vertical and horizontal
    [row - 1, col - 1], [row - 1, col + 1], [row + 1, col - 1], [row + 1, col + 1] // Diagonal
  ];

  for (const [r, c] of kingMoves) {
    if (isInBounds(r, c) && (!board[r][c] || board[r][c][0] !== (isWhite ? 'w' : 'b'))) {
      moves.push(`${r}-${c}`);
    }
  }

  return moves;
}

// Queen movement (combines Rook + Bishop) - handles both white and black
export function getQueenMoves(position, isWhite, board) {
  return [...getRookMoves(position, isWhite, board), ...getBishopMoves(position, isWhite, board)];
}

export default Lessons;

