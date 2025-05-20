import React, {useState, useEffect} from 'react';
import { useCookies } from 'react-cookie';
import { environment } from "../../environments/environment.js";

const PieceLessons = () => {
  const [board, setBoard] = useState(initializeBoard());
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [draggingPiece, setDraggingPiece] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [lessonStarted, setLessonStarted] = useState(true);
  const [level, setLevel] = useState(5);
  const [lessonNum, setLessonNum] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [lessonStartFEN, setLessonStartFEN] = useState('');
  const [displayLessonNum, setDisplayLessonNum] = useState(0);
  const [endSquare, setEndSquare] = useState('');
  const [previousEndSquare, setPreviousEndSquare] = useState('');
  const [cookies] = useCookies(['piece', 'login']);
  const piece = cookies.piece || 'P'; // Default to pawn if no cookie is set
  
  // Initialize the chessboard
  function initializeBoard() {
    return [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ];
  }
  
  // Load lessons when component mounts
  useEffect(() => {
    getLessonsCompleted();
    getTotalLesson();
  }, []);

  const checkBlackPieces = () => {
    const blackPieces = board.flat().filter(piece => piece && piece[0] === 'b'); // Filter out black pieces
    if (blackPieces.length === 0 && trainingStarted === true) {
      setShowPopup(true); // Show the popup
    }
  };
  
  // Update the board when lesson changes
  useEffect(() => {
    if (lessonStartFEN) {
      setBoard(fen2board(lessonStartFEN));
      // Reset player turn to allow them to go first
    }
  }, [lessonStartFEN]);
  
  // Check for lesson completion
  useEffect(() => {
    checkBlackPieces();
  }, [board]);
  
  // List of all chess pieces
  const pieces = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
  
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        // Fetch total lessons for each piece
        const totalPromises = pieces.map(piece => 
          fetch(`${environment.urls.middlewareURL}/lessons/getTotalPieceLesson?piece=${piece}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${cookies.login}`
            },
          }).then(res => res.json())
        );
        
        // Fetch completed lessons for each piece
        const completedPromises = pieces.map(piece => 
          fetch(`${environment.urls.middlewareURL}/lessons/getCompletedLessonCount?piece=${piece}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${cookies.login}`
            }
          }).then(res => res.json())
        );
        
        // Wait for all requests to complete
        const totals = await Promise.all(totalPromises);
        const completed = await Promise.all(completedPromises);
        
        // Create objects with the results
        const totalObj = {};
        const progressObj = {};
        
        pieces.forEach((piece, index) => {
          totalObj[piece] = totals[index];
          progressObj[piece] = completed[index];
        });
        
        setTotalLessons(totalObj);
        setPieceProgress(progressObj);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching progress:', error);
        setLoading(false);
      }
    };
    
    fetchProgress();
  }, [cookies.login]);
  
  // Handle popup confirmation
  const handlePopupConfirm = () => {
    setShowPopup(false);
    updateLessonCompletion();
    // Reset the lesson state
    setLessonStarted(true);
  };
  
  // Navigation functions
  const previousLesson = () => {
    if (lessonNum > 0) {
      setLessonNum(prevNum => prevNum - 1);
      setPreviousEndSquare(endSquare);
      getCurrentLesson(lessonNum - 1);
    }
  };
  
  const nextLesson = () => {
    if (lessonNum + 1 < totalLessons) {
      setLessonNum(prevNum => prevNum + 1);
      setPreviousEndSquare(endSquare);
      getCurrentLesson(lessonNum + 1);
    }
  };
  
  // Helper function to get possible moves for a piece
  const getPieceMoves = (piece, position) => {
    const color = piece[0]; // Get color from the piece (first character)
    switch (piece[1]) {
      case 'P':
        return getPawnMoves(position, color === 'w', board);
      case 'R':
        return getRookMoves(position, color === 'w', board);
      case 'N':
        return getKnightMoves(position, color === 'w', board);
      case 'B':
        return getBishopMoves(position, color === 'w', board);
      case 'K':
        return getKingMoves(position, color === 'w', board);
      case 'Q':
        return getQueenMoves(position, color === 'w', board);
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
    
    if (piece && piece[0] === 'w') { // Only highlight white pieces (player's pieces)
      const possibleMoves = getPieceMoves(piece, key);
      setHighlightedSquares(possibleMoves); // Highlight valid move squares
    }
  };
  
  // Handle drag start
  const handleDragStart = (e, piece, position) => {
    if (piece[0] !== 'w') return; // Only allow dragging white pieces
    
    setDraggingPiece({ piece, position });
    e.dataTransfer.setDragImage(e.target, 20, 20);
  };
  
  // Handle drop on a square
  const handleDrop = (key) => {
    if (!draggingPiece) return;
    
    if (highlightedSquares.includes(key)) {
      const [startRow, startCol] = draggingPiece.position.split('-').map(Number);
      const [endRow, endCol] = key.split('-').map(Number);
      
      // Create a copy of the board
      const updatedBoard = board.map(row => [...row]);
      
      // Move piece to new square
      updatedBoard[endRow][endCol] = draggingPiece.piece;
      updatedBoard[startRow][startCol] = null;
      
      // Check if the moved piece is a pawn reaching the promotion rank
      if (draggingPiece.piece[1] === 'P' && endRow === 0) {
        updatedBoard[endRow][endCol] = 'wQ'; // Promote to Queen
      }
      
      // Update board state
      setBoard(updatedBoard);
            
      // Check if the lesson is completed after the player's move
      setTimeout(() => {
        const currentFEN = board2fen(updatedBoard);
        if (currentFEN.split(' ')[0] === lessonEndFEN.split(' ')[0]) {
          // Lesson completed by player's move
          setShowPopup(true);
        } else {
          // Make Stockfish respond with a move
          moveBlackPiece(updatedBoard);
        }
      }, 500);
    }
    
    setDraggingPiece(null);
    setHighlightedSquares([]);
  };
  
  // Handle drag over a square (allow dropping)
  const handleDragOver = (e) => {
    e.preventDefault(); // Prevent default behavior to allow dropping
  };
  
  // HTTP helper function
  const httpGetAsync = (url, callback) => {
    fetch(url, {
      method: 'POST',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        callback(text);
      })
      .catch((error) => {
        console.error('Fetch error:', error);
      });
  };

  return (
    <div className="lessons-page">
      <div className="lesson-header">
        <h2>{piece.toUpperCase()} Lesson {displayLessonNum} of {totalLessons}</h2>
        <div className="lesson-navigation">
          <button onClick={previousLesson} disabled={lessonNum <= 0}>
            &lt; Previous
          </button>
          <button onClick={nextLesson} disabled={lessonNum >= totalLessons - 1}>
            Next &gt;
          </button>
        </div>
      </div>
      
      <div className='left-right-container'>
        {/* Div for elements on the left */}
        <div className='left-container'>
          <div className="chessboard-container_L">
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
        
        {/* Div for lesson instructions */}
        <div className='right-container'>
          <div className="lesson-instructions">
            <h3>Instructions</h3>
            <p>Capture the black pieces!</p>
          </div>
        </div>
      </div>
      
      {/* Popup for lesson completion */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <div className="success-checkmark">
              <svg width="80" height="80" viewBox="0 0 120 120">
                <circle className="circle" cx="60" cy="60" r="54" fill="none" stroke="#beea8b" strokeWidth="6"></circle>
                <path className="checkmark" d="M35 60 L55 80 L85 40" fill="none" stroke="#beea8b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"></path>
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
    if (isInBounds(row, col) && board[row][col] && board[row][col][0] !== 'w') {
      possibleMoves.push(`${row}-${col}`); // Add capture move if there's an opponent's piece
    }
  });
  
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

// Convert FEN to board
function board2fen(board) {
  const pieceMap = {
    'wP': 'P', 'wN': 'N', 'wB': 'B', 'wR': 'R', 'wQ': 'Q', 'wK': 'K',
    'bP': 'p', 'bN': 'n', 'bB': 'b', 'bR': 'r', 'bQ': 'q', 'bK': 'k'
  };
  
  let fenRows = board.map(row => {
    let fenRow = '';
    let emptyCount = 0;
    
    row.forEach(cell => {
      if (cell === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fenRow += emptyCount;
          emptyCount = 0;
        }
        fenRow += pieceMap[cell] || '?';
      }
    });
    
    if (emptyCount > 0) {
      fenRow += emptyCount;
    }
    
    return fenRow;
  });
  
  return fenRows.join('/') + ' b - - 0 1';
}

// Convert board to FEN
function fen2board(fen) {
  const board = [];
  const rows = fen.split(' ')[0].split('/');
  
  for (let row of rows) {
    const parsedRow = [];
    
    for (let char of row) {
      if (!isNaN(char)) {
        parsedRow.push(...Array(parseInt(char)).fill(null));
      } else {
        if (char === char.toUpperCase()) {
            parsedRow.push('w' + char.toUpperCase());
        } else {
            parsedRow.push('b' + char.toUpperCase());
        }
      }
    }
    
    board.push(parsedRow);
  }
  
  return board;
}

export default PieceLessons;