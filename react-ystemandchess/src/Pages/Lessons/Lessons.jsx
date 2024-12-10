import "./Lessons.scss";
import React, { useState, useEffect } from 'react';

const Lessons = () => {
  const [board, setBoard] = useState(initializeBoard()); // Initialize the board with chess pieces
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [draggingPiece, setDraggingPiece] = useState(null); // Track which piece is being dragged

  // Description for each Scenarios
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [scenarioDescription_2, setScenarioDescription_2] = useState("");
  const [pieceDescription, setpieceDescription] = useState("");

  // State for showing scenario buttons for pieces
  const [showScenarios, setShowScenarios] = useState({
    pawn: false,
    rook: false,
    bishop: false,
    knight: false,
    queen: false,
    king: false,
  });

  const [showPopup, setShowPopup] = useState(false); // Popup state
  const [trainingStarted, setTrainingStarted] = useState(false); // Training state

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
      setScenarioDescription("");
      setScenarioDescription_2("");
      setpieceDescription("");
    }
  };

  // Check for black pieces every time the board state changes
  useEffect(() => {
    checkBlackPieces();
  }, [board]);

  // Update the setupScenario function to handle both Pawn and Rook
  const setupScenario = (piece, scenario) => {
    const updatedBoard = initializeBoard(); // Reset board

    // setup the board by scenario
    switch (piece) {
      case 'pawn':
        setpieceDescription("Pawn - It moves forward only")
        setScenarioDescription("Try this!");
        switch (scenario) {
          case 'basic':
            updatedBoard[4][0] = 'wP'; // a5
            updatedBoard[5][5] = 'bP'; // f3
            setScenarioDescription_2("Pawns move one square only. But when they reach the other side of the board, they become a stronger piece!");
            setTrainingStarted(true); // Mark training as started
            break;
          case 'capture':
            updatedBoard[5][4] = 'wP'; // e3
            updatedBoard[3][3] = 'bP'; // d5
            updatedBoard[2][2] = 'bP'; // c6
            updatedBoard[1][3] = 'bP'; // d7
            setScenarioDescription_2("A pawn on the second rank can move 2 squares at once!");
            setTrainingStarted(true); // Mark training as started
            break;
          case 'training_1':
            updatedBoard[5][1] = 'wP'; // b3
            updatedBoard[1][2] = 'bP'; // c7
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[2][2] = 'bP'; // c6
            updatedBoard[2][3] = 'bP'; // d6
            updatedBoard[4][1] = 'bP'; // b4
            updatedBoard[4][2] = 'bP'; // c4
            setScenarioDescription_2("Capture black pawns and promote!");
            setTrainingStarted(true); // Mark training as started
            break;
          case 'training_2':
            updatedBoard[5][3] = 'wP'; // d3
            updatedBoard[0][2] = 'bP'; // c8
            updatedBoard[1][3] = 'bP'; // d7
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[2][4] = 'bP'; // e6
            updatedBoard[3][1] = 'bP'; // b5
            updatedBoard[3][3] = 'bP'; // d5
            updatedBoard[4][2] = 'bP'; // c4
            setScenarioDescription_2("Capture black pawns and promote!");
            setTrainingStarted(true); // Mark training as started
            break;
          case 'training_3':
            updatedBoard[5][0] = 'wP'; // a3
            updatedBoard[5][2] = 'wP'; // c3
            updatedBoard[5][3] = 'wP'; // d3
            updatedBoard[5][7] = 'wP'; // h3
            updatedBoard[3][1] = 'bP'; // b5
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[3][4] = 'bP'; // e5
            updatedBoard[4][3] = 'bP'; // d4
            updatedBoard[4][6] = 'bP'; // g4
            setScenarioDescription_2("No need to promote. Capture all black pawns.");
            setTrainingStarted(true); // Mark training as started
            break;
          case 'special_move':
            updatedBoard[6][4] = 'wP'; // e2
            updatedBoard[2][3] = 'bP'; // d6
            setScenarioDescription_2("A pawn on the second rank can move two squares forward.");
            setTrainingStarted(true); // Mark training as started
            break;
          default:
            break;
        }
        break;
      case 'rook':
        setpieceDescription("Rook - It moves in straight lines")
        setScenarioDescription("Try this!");
        switch (scenario) {
          case 'basic':
            updatedBoard[6][4] = 'wR'; // e2
            updatedBoard[2][4] = 'bP'; // e6
            setScenarioDescription_2("Click on the rook to bring it to the pawn!");
            setTrainingStarted(true);
            break;
          case 'training_1':
            updatedBoard[1][2] = 'wR'; // c7
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[3][5] = 'bP'; // f5
            setScenarioDescription_2("Grab all the pawns!");
            setTrainingStarted(true);
            break;
          case 'training_2':
            updatedBoard[5][4] = 'wR'; // e3
            updatedBoard[5][1] = 'bP'; // b3
            updatedBoard[6][7] = 'bP'; // h2
            updatedBoard[5][7] = 'bP'; // h3
            setScenarioDescription_2("The fewer moves you make, the better!");
            setTrainingStarted(true);
            break;
          case 'training_3':
            updatedBoard[0][7] = 'wR'; // h8
            updatedBoard[0][5] = 'bP'; // f8
            updatedBoard[7][6] = 'bP'; // g1
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[0][6] = 'bP'; // g8
            updatedBoard[1][7] = 'bP'; // h7
            setScenarioDescription_2("The fewer moves you make, the better!");
            setTrainingStarted(true);
            break;
          case 'training_4':
            updatedBoard[1][2] = 'wR'; // c7
            updatedBoard[4][4] = 'wR'; // e4
            updatedBoard[4][0] = 'bP'; // a4
            updatedBoard[5][6] = 'bP'; // g3
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[4][7] = 'bP'; // h4
            setScenarioDescription_2("Use two rooks to speed things up!");
            setTrainingStarted(true);
            break;
          case 'final':
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[5][5] = 'wR'; // f3
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[7][3] = 'bP'; // d1
            updatedBoard[3][3] = 'bP'; // d5
            updatedBoard[6][5] = 'bP'; // f2
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[3][6] = 'bP'; // g4
            updatedBoard[1][6] = 'bP'; // g7
            setScenarioDescription_2("Use two rooks to speed things up!");
            setTrainingStarted(true);
            break;

          default:
            break;
        }
        break;
      case "bishop":
        setpieceDescription("Bishop - It moves diagonally");
        setScenarioDescription("Try this!");
        switch (scenario) {
          case 'basic':
            updatedBoard[6][6] = 'wB'; // g2
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[4][4] = 'bP'; // e4
            setScenarioDescription_2("Grab all the black pawns!");
            setTrainingStarted(true);
            break;
          case 'training_1':
            updatedBoard[5][1] = 'wB'; // b3
            updatedBoard[6][0] = 'bP'; // a2
            updatedBoard[7][1] = 'bP'; // b1
            updatedBoard[3][1] = 'bP'; // b5
            updatedBoard[7][3] = 'bP'; // d1
            updatedBoard[5][3] = 'bP'; // d3
            updatedBoard[6][4] = 'bP'; // e2
            setScenarioDescription_2("The fewer moves you make, the better!");
            setTrainingStarted(true);
            break;
          case 'training_2':
            updatedBoard[4][2] = 'wB'; // c4
            updatedBoard[4][0] = 'bP'; // a4
            updatedBoard[7][1] = 'bP'; // b1
            updatedBoard[5][1] = 'bP'; // b3
            updatedBoard[6][2] = 'bP'; // c2
            updatedBoard[5][3] = 'bP'; // d3
            updatedBoard[4][4] = 'bP'; // e2
            setScenarioDescription_2("Grab all the black pawns!");
            setTrainingStarted(true);
            break;
          case 'training_3':
            updatedBoard[7][2] = 'wB'; // c1
            updatedBoard[7][5] = 'wB'; // f1
            updatedBoard[5][3] = 'bP'; // d3
            updatedBoard[5][4] = 'bP'; // e3
            updatedBoard[4][3] = 'bP'; // d4
            updatedBoard[4][4] = 'bP'; // e4
            updatedBoard[3][3] = 'bP'; // d5
            updatedBoard[3][4] = 'bP'; // e5
            setScenarioDescription_2("One light-squared bishop, one dark-squared bishop. You need both!");
            setTrainingStarted(true);
            break;
          case 'training_4':
            updatedBoard[4][3] = 'wB'; // d4
            updatedBoard[7][0] = 'bP'; // a1
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[7][2] = 'bP'; // c1
            updatedBoard[5][4] = 'bP'; // e3
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[2][7] = 'bP'; // h6
            setScenarioDescription_2("Grab all the black pawns!");
            setTrainingStarted(true);
            break;
          case 'final':
            updatedBoard[5][2] = 'wB'; // c3
            updatedBoard[1][3] = 'wB'; // d7
            updatedBoard[5][0] = 'bP'; // a3
            updatedBoard[6][2] = 'bP'; // c2
            updatedBoard[1][4] = 'bP'; // e7
            updatedBoard[3][5] = 'bP'; // f5
            updatedBoard[2][5] = 'bP'; // f6
            updatedBoard[0][6] = 'bP'; // g8
            updatedBoard[4][7] = 'bP'; // h4
            updatedBoard[1][7] = 'bP'; // h7
            setScenarioDescription_2("One light-squared bishop, one dark-squared bishop. You need both!");
            setTrainingStarted(true);
            break;
          default:
            break;
        }
        break;

      case 'knight':
        setpieceDescription("Knight - It moves in an 'L' shape");
        setScenarioDescription("Try this!");
        switch (scenario) {
          case 'basic':
            updatedBoard[4][4] = 'wN'; // e4
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[1][3] = 'bP'; // d7
            setScenarioDescription_2("Knights have a fancy way of jumping around!");
            setTrainingStarted(true);
            break;

          case 'training_1':
            updatedBoard[7][1] = 'wN'; // b1
            updatedBoard[5][2] = 'bP'; // c3
            updatedBoard[4][3] = 'bP'; // d4
            updatedBoard[6][4] = 'bP'; // e2
            updatedBoard[5][5] = 'bP'; // f3
            updatedBoard[3][6] = 'bP'; // g5
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[0][7] = 'bP'; // h8
            setScenarioDescription_2("Grab all the pawns!");
            setTrainingStarted(true);
            break;

          case 'training_2':
            updatedBoard[1][2] = 'wN'; // c7
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[3][3] = 'bP'; // d5
            updatedBoard[1][3] = 'bP'; // d7
            updatedBoard[2][4] = 'bP'; // e6
            updatedBoard[4][5] = 'bP'; // f4
            setScenarioDescription_2("Grab all the pawns!");
            setTrainingStarted(true);
            break;

          case 'training_3':
            updatedBoard[5][5] = 'wN'; // f3
            updatedBoard[6][4] = 'bP'; // e2
            updatedBoard[5][4] = 'bP'; // e3
            updatedBoard[4][4] = 'bP'; // e4
            updatedBoard[6][5] = 'bP'; // f2
            updatedBoard[4][5] = 'bP'; // f4
            updatedBoard[6][6] = 'bP'; // g2
            updatedBoard[5][6] = 'bP'; // g3
            updatedBoard[4][6] = 'bP'; // g4
            setScenarioDescription_2("Knights can jump over obstacles! Escape and vanquish the pawns!");
            setTrainingStarted(true);
            break;

          case 'training_4':
            updatedBoard[5][3] = 'wN'; // d3
            updatedBoard[5][2] = 'bP'; // c3
            updatedBoard[6][4] = 'bP'; // e2
            updatedBoard[4][4] = 'bP'; // e4
            updatedBoard[6][5] = 'bP'; // f2
            updatedBoard[4][5] = 'bP'; // f4
            updatedBoard[2][6] = 'bP'; // g6
            setScenarioDescription_2("Grab all the pawns!");
            setTrainingStarted(true);
            break;

          case 'final':
            updatedBoard[1][2] = 'wN'; // c7
            updatedBoard[4][1] = 'bP'; // b4
            updatedBoard[3][1] = 'bP'; // b5
            updatedBoard[2][2] = 'bP'; // c6
            updatedBoard[0][2] = 'bP'; // c8
            updatedBoard[4][3] = 'bP'; // d4
            updatedBoard[3][3] = 'bP'; // d5
            updatedBoard[5][4] = 'bP'; // e3
            updatedBoard[1][4] = 'bP'; // e7
            updatedBoard[3][5] = 'bP'; // f5
            setScenarioDescription_2("Grab all the pawns!");
            setTrainingStarted(true);
            break;

        }
        break;

      case 'queen':
        setpieceDescription("Queen - Queen = rook + bishop");
        setScenarioDescription("Try this!");
        switch (scenario) {
          case 'basic':
            updatedBoard[6][4] = 'wQ'; // e2
            updatedBoard[1][2] = 'bP'; // c7
            updatedBoard[3][4] = 'bP'; // e5
            setScenarioDescription_2("Grab all the pawns!");
            setTrainingStarted(true);
            break;
          case 'training_1':
            updatedBoard[4][3] = 'wQ'; // d4
            updatedBoard[5][0] = 'bP'; // a3
            updatedBoard[6][5] = 'bP'; // f2
            updatedBoard[0][5] = 'bP'; // f8
            updatedBoard[5][7] = 'bP'; // h3
            setScenarioDescription_2("Grab all the pawns!");
            setTrainingStarted(true);
            break;
          case 'training_2':
            updatedBoard[4][2] = 'wQ'; // c4
            updatedBoard[5][0] = 'bP'; // a3
            updatedBoard[2][3] = 'bP'; // d6
            updatedBoard[7][5] = 'bP'; // f1
            updatedBoard[0][5] = 'bP'; // f8
            updatedBoard[5][6] = 'bP'; // g3
            updatedBoard[2][7] = 'bP'; // h6
            setScenarioDescription_2("Grab all the pawns!");
            setTrainingStarted(true);
            break;
          case 'training_3':
            updatedBoard[1][6] = 'wQ'; // g7
            updatedBoard[6][0] = 'bP'; // a2
            updatedBoard[3][1] = 'bP'; // b5
            updatedBoard[5][3] = 'bP'; // d3
            updatedBoard[7][6] = 'bP'; // g1
            updatedBoard[0][6] = 'bP'; // g8
            updatedBoard[6][7] = 'bP'; // h2
            updatedBoard[3][7] = 'bP'; // h5
            setScenarioDescription_2("Grab all the pawns!");
            setTrainingStarted(true);
            break;
          case 'final':
            updatedBoard[7][4] = 'wQ'; // e1
            updatedBoard[2][0] = 'bP'; // a6
            updatedBoard[7][3] = 'bP'; // d1
            updatedBoard[6][5] = 'bP'; // f2
            updatedBoard[2][5] = 'bP'; // f6
            updatedBoard[2][6] = 'bP'; // g6
            updatedBoard[0][6] = 'bP'; // g8
            updatedBoard[7][7] = 'bP'; // h1
            updatedBoard[4][7] = 'bP'; // h4
            setScenarioDescription_2("Grab all the pawns!");
            setTrainingStarted(true);
            break;

          default:
            break;
        }
        break;

      case 'king':
        setpieceDescription("King - The most important piece");
        setScenarioDescription("Try this!");
        switch (scenario) {
          case 'basic':
            updatedBoard[6][3] = 'wK'; // d2
            updatedBoard[2][3] = 'bP'; // d6
            setScenarioDescription_2("The king is slow.");
            setTrainingStarted(true);
            break;
          case 'training':
            updatedBoard[7][4] = 'wK'; // e1
            updatedBoard[6][2] = 'bP'; // c2
            updatedBoard[5][3] = 'bP'; // d3
            updatedBoard[6][4] = 'bP'; // e2
            setScenarioDescription_2("Grab all the pawns!");
            setTrainingStarted(true);
            break;
          case 'final':
            updatedBoard[3][4] = 'wK'; // e5
            updatedBoard[4][2] = 'bP'; // c4
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[3][3] = 'bP'; // d5
            updatedBoard[5][4] = 'bP'; // e3
            updatedBoard[5][5] = 'bP'; // f3
            updatedBoard[4][6] = 'bP'; // g4
            setScenarioDescription_2("Grab all the pawns!");
            setTrainingStarted(true);
            break;

          default:
            break;
        }
        break;

      default:
        break;
    }
    setBoard(updatedBoard);
    setHighlightedSquares([]); // clear highlight
  };

  // Button click handlers
  // Generic function to handle all piece button clicks
  const handlePieceClick = (piece) => {
    setShowScenarios({
      pawn: piece === 'pawn',
      rook: piece === 'rook',
      bishop: piece === 'bishop',
      knight: piece === 'knight',
      queen: piece === 'queen',
      king: piece === 'king',
    });
  };

  const handlePawnClick = () => handlePieceClick('pawn');
  const handleRookClick = () => handlePieceClick('rook');
  const handleBishopClick = () => handlePieceClick('bishop');
  const handleKnightClick = () => handlePieceClick('knight');
  const handleQueenClick = () => handlePieceClick('queen');
  const handleKingClick = () => handlePieceClick('king');

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

      {/* Popup for lesson completion */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <p>Lesson Completed!</p>
            <button onClick={handlePopupConfirm}>OK</button>
          </div>
        </div>
      )}

      {/* Description part */}
      <div className="scenario-description">
        <p className="piece_description">{pieceDescription}</p>
        <p className="scenario_description">{scenarioDescription}</p>
        <p className="scenario_description_2">{scenarioDescription_2}</p>
      </div>


      <div className="lesson-buttons-container">
        {/* Pawn Button and Scenarios */}
        <button onClick={handlePawnClick} className="lesson-pawn-button">Pawn</button>
        {showScenarios.pawn && (
          <>
            <button className="choice-buttons" onClick={() => setupScenario('pawn', 'basic')}>Basic</button>
            <button className="choice-buttons" onClick={() => setupScenario('pawn', 'capture')}>Capture</button>
            <button className="choice-buttons" onClick={() => setupScenario('pawn', 'training_1')}>Training 1</button>
            <button className="choice-buttons" onClick={() => setupScenario('pawn', 'training_2')}>Training 2</button>
            <button className="choice-buttons" onClick={() => setupScenario('pawn', 'training_3')}>Training 3</button>
            <button className="choice-buttons" onClick={() => setupScenario('pawn', 'special_move')}>Special Move</button>
          </>
        )}

        {/* Bishop Button and Scenarios */}
        <button onClick={handleBishopClick} className="lesson-bishop-button">Bishop</button>
        {showScenarios.bishop && (
          <>
            <button className="choice-buttons" onClick={() => setupScenario('bishop', 'basic')}>Basic</button>
            <button className="choice-buttons" onClick={() => setupScenario('bishop', 'training_1')}>Training 1</button>
            <button className="choice-buttons" onClick={() => setupScenario('bishop', 'training_2')}>Training 2</button>
            <button className="choice-buttons" onClick={() => setupScenario('bishop', 'training_3')}>Training 3</button>
            <button className="choice-buttons" onClick={() => setupScenario('bishop', 'training_4')}>Training 4</button>
            <button className="choice-buttons" onClick={() => setupScenario('bishop', 'final')}>Final</button>
          </>
        )}

        {/* Knight Button and Scenarios */}
        <button onClick={handleKnightClick} className="lesson-knight-button">Knight</button>
        {showScenarios.knight && (
          <>
            <button className="choice-buttons" onClick={() => setupScenario('knight', 'basic')}>The Basic</button>
            <button className="choice-buttons" onClick={() => setupScenario('knight', 'training_1')}>Training 1</button>
            <button className="choice-buttons" onClick={() => setupScenario('knight', 'training_2')}>Training 2</button>
            <button className="choice-buttons" onClick={() => setupScenario('knight', 'training_3')}>Training 3</button>
            <button className="choice-buttons" onClick={() => setupScenario('knight', 'training_4')}>Training 4</button>
            <button className="choice-buttons" onClick={() => setupScenario('knight', 'final')}>Final</button>
          </>
        )}


        {/* Rook Button and Scenarios */}
        <button onClick={handleRookClick} className="lesson-rook-button">Rook</button>
        {showScenarios.rook && (
          <>
            <button className="choice-buttons" onClick={() => setupScenario('rook', 'basic')}>The Basic</button>
            <button className="choice-buttons" onClick={() => setupScenario('rook', 'training_1')}>Training 1</button>
            <button className="choice-buttons" onClick={() => setupScenario('rook', 'training_2')}>Training 2</button>
            <button className="choice-buttons" onClick={() => setupScenario('rook', 'training_3')}>Training 3</button>
            <button className="choice-buttons" onClick={() => setupScenario('rook', 'training_4')}>Training 4</button>
            <button className="choice-buttons" onClick={() => setupScenario('rook', 'final')}>Final</button>
          </>
        )}

        {/* Queen Button and Scenarios */}
        <button onClick={handleQueenClick} className="lesson-queen-button">Queen</button>
        {showScenarios.queen && (
          <>
            <button className="choice-buttons" onClick={() => setupScenario('queen', 'basic')}>The Basic</button>
            <button className="choice-buttons" onClick={() => setupScenario('queen', 'training_1')}>Training 1</button>
            <button className="choice-buttons" onClick={() => setupScenario('queen', 'training_2')}>Training 2</button>
            <button className="choice-buttons" onClick={() => setupScenario('queen', 'training_3')}>Training 3</button>
            <button className="choice-buttons" onClick={() => setupScenario('queen', 'final')}>Final</button>
          </>
        )}


        {/* King Button and Scenarios */}
        <button onClick={handleKingClick} className="lesson-king-button">King</button>
        {showScenarios.king && (
          <>
            <button className="choice-buttons" onClick={() => setupScenario('king', 'basic')}>The Basic</button>
            <button className="choice-buttons" onClick={() => setupScenario('king', 'training')}>Training</button>
            <button className="choice-buttons" onClick={() => setupScenario('king', 'final')}>Final</button>
          </>
        )}

      </div>
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

