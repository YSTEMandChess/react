import "./Lessons.scss";
import React, { useState, useEffect } from 'react';

const Lessons = () => {
  const [board, setBoard] = useState(initializeBoard()); // Initialize the board with chess pieces
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [draggingPiece, setDraggingPiece] = useState(null); // Track which piece is being dragged

  // Description for each Scenarios
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [scenarioDescription_2, setScenarioDescription_2] = useState("");
  const [pieceDescription, setpieceDescription] = useState("Choose a Lesson!");

  // State for showing scenario buttons for pieces
  const [showScenarios, setShowScenarios] = useState({
    pawn: false,
    rook: false,
    bishop: false,
    knight: false,
    queen: false,
    king: false,
    CM1: false,
    CM2: false,
    CP1: false,
    CP2: false,
    CP3: false,
    CP4: false
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
      setpieceDescription("Choose a lesson!");
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

      case 'basic_checkmate_1':
        setpieceDescription("piece checkmate 1 Basic checkmates");
        setScenarioDescription("Try this!");

        switch (scenario) {
          case 'queen_and_rook_mate':
            updatedBoard[7][0] = 'wQ'; // a1
            updatedBoard[5][4] = 'wK'; // e3
            updatedBoard[7][7] = 'wR'; // h1
            updatedBoard[2][3] = 'bK'; // d6
            setScenarioDescription_2("Use your queen and rook to restrict the king and deliver checkmate. Mate in 3 if played perfectly.");
            setTrainingStarted(true);
            break;

          case 'two_rook_mate':
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][7] = 'wR'; // h1
            updatedBoard[5][4] = 'wK'; // e3
            updatedBoard[2][3] = 'bK'; // d6
            setScenarioDescription_2("Use your rooks to restrict the king and deliver checkmate. Mate in 4 if played perfectly.");
            setTrainingStarted(true);
            break;

          case 'queen_and_bishop_mate':
            updatedBoard[5][2] = 'wQ'; // c3
            updatedBoard[5][3] = 'wB'; // d3
            updatedBoard[5][4] = 'wK'; // e3
            updatedBoard[2][3] = 'bK'; // d6
            setScenarioDescription_2("Use your queen and bishop to restrict the king and deliver checkmate. Mate in 5 if played perfectly.");
            setTrainingStarted(true);
            break;

          case 'queen_and_knight_mate':
            updatedBoard[5][2] = 'wQ'; // c3
            updatedBoard[5][3] = 'wN'; // d3
            updatedBoard[5][4] = 'wK'; // e3
            updatedBoard[2][3] = 'bK'; // d6
            setScenarioDescription_2("Use your queen and knight to restrict the king and deliver checkmate. Mate in 5 if played perfectly.");
            setTrainingStarted(true);
            break;

          case 'queen_mate':
            updatedBoard[7][4] = 'wQ'; // e1
            updatedBoard[5][4] = 'wK'; // e3
            updatedBoard[2][3] = 'bK'; // d6
            setScenarioDescription_2("Use your queen to restrict the king, force it to the edge of the board and deliver checkmate. The queen can't do it alone, so use your king to help. Mate in 6 if played perfectly.");
            setTrainingStarted(true);
            break;

          case 'rook_mate':
            updatedBoard[7][4] = 'wR'; // e1
            updatedBoard[5][4] = 'wK'; // e3
            updatedBoard[2][3] = 'bK'; // d6
            setScenarioDescription_2("Use your rook to restrict the king, force it to the edge of the board and deliver checkmate. The rook can't do it alone, so use your king to help. Mate in 11 if played perfectly.");
            setTrainingStarted(true);
            break;

          default:
            console.error("Scenario not found.");
            break;
        }
        break;

      case 'checkmate_pattern_I':
        setpieceDescription("checkmate pattern I Recognize the patterns");
        setScenarioDescription("Try this!");
        switch (scenario) {
          case "Back-Rank_Mate_#1":
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][4] = 'wR'; // e7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("A Back-Rank Mate is a checkmate delivered by a rook or queen along the back rank in which the mated king is unable to move up the board because the king is blocked by friendly pieces (usually pawns) on the second rank.");
            setTrainingStarted(true);
            break;

          case "Back-Rank_Mate_#2":
            updatedBoard[0][2] = 'bR'; // c8
            updatedBoard[0][4] = 'bR'; // e8
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[4][0] = 'wQ'; // a4
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[7][4] = 'wR'; // e1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 2 moves");
            setTrainingStarted(true);
            break;

          case "Back-Rank_Mate_#3":
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[3][1] = 'bP'; // b5
            updatedBoard[2][0] = 'bK'; // a6
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[7][5] = 'wR'; // f1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move");
            setTrainingStarted(true);
            break;

          case "Back-Rank_Mate_#4":
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][3] = 'bQ'; // d7
            updatedBoard[1][4] = 'bB'; // e7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][4] = 'bP'; // e6
            updatedBoard[3][0] = 'bP'; // a5
            updatedBoard[3][1] = 'bP'; // b5
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[3][4] = 'wP'; // e5
            updatedBoard[5][2] = 'wP'; // c3
            updatedBoard[5][3] = 'wP'; // d3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[5][5] = 'wQ'; // f3
            updatedBoard[7][5] = 'wR'; // f1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 3 move");
            setTrainingStarted(true);
            break;

          case "Hook_mate_#1":
            updatedBoard[0][0] = 'wR'; // a8
            updatedBoard[1][4] = 'bK'; // e7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[2][5] = 'wN'; // f6
            updatedBoard[3][4] = 'wP'; // e5
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. The Hook Mate involves the use of a rook, knight, and pawn along with one blockading piece to limit the opponent's king's escape. In this mate, the rook is protected by the knight and the knight is protected by the pawn.");
            setTrainingStarted(true);
            break;

          case "Hook_mate_#2":
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[2][5] = 'bR'; // f6
            updatedBoard[0][7] = 'bB'; // h8
            updatedBoard[4][2] = 'bB'; // c4
            updatedBoard[1][2] = 'wR'; // c7
            updatedBoard[1][4] = 'wR'; // e7
            updatedBoard[2][0] = 'wP'; // a6
            updatedBoard[5][6] = 'wP'; // g3
            updatedBoard[6][4] = 'wP'; // e2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[3][7] = 'bP'; // h5
            updatedBoard[4][6] = 'bP'; // g4
            updatedBoard[3][5] = 'wN'; // f5
            updatedBoard[4][7] = 'wN'; // h4
            updatedBoard[3][6] = 'bK'; // g5
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 3 moves");
            setTrainingStarted(true);
            break;

          case "Hook_mate_#3":
            updatedBoard[0][2] = 'bB'; // c8
            updatedBoard[2][3] = 'bB'; // d6
            updatedBoard[0][4] = 'wQ'; // e8
            updatedBoard[1][1] = 'bK'; // b7
            updatedBoard[1][2] = 'bP'; // c7
            updatedBoard[2][0] = 'bP'; // a6
            updatedBoard[4][7] = 'bP'; // h4
            updatedBoard[5][0] = 'bP'; // a3
            updatedBoard[2][2] = 'wN'; // c6
            updatedBoard[3][3] = 'wP'; // d5
            updatedBoard[4][1] = 'wP'; // b4
            updatedBoard[5][7] = 'wP'; // h3
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][0] = 'wK'; // a2
            updatedBoard[6][4] = 'wR'; // e2
            updatedBoard[7][5] = 'bQ'; // f1

            setScenarioDescription_2("Checkmate the opponent in 3 moves");
            setTrainingStarted(true);
            break;

          case "Anastasias_mate_#1":
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[1][1] = 'bB'; // b7
            updatedBoard[1][4] = 'wN'; // e7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bK'; // h7
            updatedBoard[3][2] = 'wR'; // c5
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. In Anastasia's Mate, a knight and rook team up to trap the opposing king between the side of the board on one side and a friendly piece on the other. This checkmate got its name from the novel 'Anastasia und das Schachspiel' by Johann Jakob Wilhelm Heinse.");
            setTrainingStarted(true);
            break;

          case "Anastasias_mate_#2":
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][1] = 'bB'; // b7
            updatedBoard[1][4] = 'wN'; // e7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[3][2] = 'wR'; // c5
            updatedBoard[4][4] = 'wQ'; // e4
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 2 move. ");
            setTrainingStarted(true);
            break;

          case "Anastasias_mate_#3":
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][1] = 'bB'; // b7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[3][2] = 'wR'; // c5
            updatedBoard[3][3] = 'wN'; // d5
            updatedBoard[6][2] = 'wQ'; // c2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 3 move. ");
            setTrainingStarted(true);
            break;

          case "Anastasias_mate_#4":
            updatedBoard[0][1] = 'bR'; // b8
            updatedBoard[2][3] = 'bR'; // d6
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][2] = 'bP'; // c6
            updatedBoard[3][0] = 'wP'; // a5
            updatedBoard[4][1] = 'wP'; // b4
            updatedBoard[5][2] = 'wP'; // c3
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[3][2] = 'wQ'; // c5
            updatedBoard[3][6] = 'bB'; // g5
            updatedBoard[3][7] = 'bQ'; // h5
            updatedBoard[4][4] = 'wB'; // e4
            updatedBoard[4][5] = 'bN'; // f4
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][5] = 'wR'; // f1
            updatedBoard[7][4] = 'wN'; // e1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 3 move. ");
            setTrainingStarted(true);
            break;


          case "Blind_swine_mate_#1":
            updatedBoard[0][1] = 'bR'; // b8
            updatedBoard[2][3] = 'bR'; // d6
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][2] = 'bP'; // c6
            updatedBoard[3][0] = 'wP'; // a5
            updatedBoard[4][1] = 'wP'; // b4
            updatedBoard[5][2] = 'wP'; // c3
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[3][2] = 'wQ'; // c5
            updatedBoard[3][6] = 'bB'; // g5
            updatedBoard[3][7] = 'bQ'; // h5
            updatedBoard[4][4] = 'wB'; // e4
            updatedBoard[4][5] = 'bN'; // f4
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][5] = 'wR'; // f1
            updatedBoard[7][4] = 'wN'; // e1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 3 moves. The name of this pattern was coined by Polish master Dawid Janowski, referring to coupled rooks on a player's 7th rank as swine. For this type of mate, the rooks on white's 7th rank can start out on any two of the files from a to e, and although black pawns are commonly present, they are not necessary to affect the mate.");
            setTrainingStarted(true);
            break;

          case "Blind_swine_mate_#2":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][2] = 'wR'; // c7
            updatedBoard[3][2] = 'wR'; // c5
            updatedBoard[2][1] = 'bN'; // b6
            updatedBoard[2][4] = 'wN'; // e6
            updatedBoard[2][6] = 'bP'; // g6
            updatedBoard[2][7] = 'bP'; // h6
            updatedBoard[3][3] = 'bP'; // d5
            updatedBoard[4][0] = 'bP'; // a4
            updatedBoard[4][3] = 'wP'; // d4
            updatedBoard[5][0] = 'wP'; // a3
            updatedBoard[5][4] = 'wP'; // e3
            updatedBoard[5][7] = 'wP'; // h3
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][0] = 'bQ'; // a2
            updatedBoard[6][7] = 'wK'; // h2

            setScenarioDescription_2("Checkmate the opponent in 6 moves.");
            setTrainingStarted(true);
            break;

          case "Blind_swine_mate_#3":
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[6][0] = 'bR'; // a2
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][1] = 'wR'; // b7
            updatedBoard[1][3] = 'wR'; // d7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][6] = 'bP'; // g6
            updatedBoard[3][0] = 'bP'; // a5
            updatedBoard[4][5] = 'bP'; // f4
            updatedBoard[2][4] = 'wN'; // e6
            updatedBoard[5][1] = 'wP'; // b3
            updatedBoard[5][6] = 'wP'; // g3
            updatedBoard[6][4] = 'wP'; // e2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[6][3] = 'bN'; // d2
            updatedBoard[6][6] = 'wK'; // g2

            setScenarioDescription_2("Checkmate the opponent in 5 moves.");
            setTrainingStarted(true);
            break;

          case "Smothered_mate_#1":
            updatedBoard[0][6] = 'bR'; // g8
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[3][6] = 'wN'; // g5
            updatedBoard[7][7] = 'wK'; // h1

            setScenarioDescription_2("Checkmate the opponent in 1 move. Smothered Mate occurs when a knight checkmates a king that is smothered (surrounded) by his friendly pieces and he has nowhere to move nor is there any way to capture the knight. It is also known as 'Philidor's Legacy' after François-André Danican Philidor, though its documentation predates Philidor by several hundred years.");
            setTrainingStarted(true);
            break;

          case "Smothered_mate_#2":
            updatedBoard[0][6] = 'bR'; // g8
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][6] = 'bQ'; // g6
            updatedBoard[3][6] = 'wN'; // g5
            updatedBoard[5][7] = 'wQ'; // h3
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          case "Smothered_mate_#3":
            updatedBoard[0][3] = 'bR'; // d8
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][6] = 'bP'; // g6
            updatedBoard[3][0] = 'bP'; // a5
            updatedBoard[1][3] = 'bB'; // d7
            updatedBoard[1][6] = 'bB'; // g7
            updatedBoard[1][5] = 'wQ'; // f7
            updatedBoard[2][1] = 'bN'; // b6
            updatedBoard[2][4] = 'wB'; // e6
            updatedBoard[3][6] = 'wN'; // g5
            updatedBoard[4][0] = 'wP'; // a4
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[4][1] = 'bQ'; // b4
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][7] = 'wK'; // h1

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          case "Smothered_mate_#4":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[0][7] = 'bR'; // h8
            updatedBoard[0][2] = 'bK'; // c8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][2] = 'bP'; // c7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[4][3] = 'bP'; // d4
            updatedBoard[1][4] = 'bB'; // e7
            updatedBoard[1][5] = 'bQ'; // f7
            updatedBoard[2][2] = 'bN'; // c6
            updatedBoard[2][4] = 'wN'; // e6
            updatedBoard[3][6] = 'wB'; // g5
            updatedBoard[4][6] = 'wQ'; // g4
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][2] = 'wP'; // c2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 6 move.");
            setTrainingStarted(true);
            break;


          default:
            break;
        }
        break;

      case 'checkmate_pattern_II':
        setpieceDescription("Checkmate Patterns II Recognize the patterns");
        setScenarioDescription("Try this!");
        switch (scenario) {
          case "Double_Bishop_mate_#1":
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][5] = 'wB'; // f7
            updatedBoard[7][6] = 'wB'; // g1
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[7][5] = 'wK'; // f1

            setScenarioDescription_2("Checkmate the opponent in 1 move.");
            setTrainingStarted(true);
            break;

          case "Double_Bishop_mate_#2":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[0][2] = 'bB'; // c8
            updatedBoard[3][4] = 'bB'; // e5
            updatedBoard[0][3] = 'bQ'; // d8
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][6] = 'bP'; // g6
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[3][5] = 'bP'; // f5
            updatedBoard[4][3] = 'bP'; // d4
            updatedBoard[1][4] = 'wR'; // e7
            updatedBoard[2][3] = 'wB'; // d6
            updatedBoard[3][3] = 'wB'; // d5
            updatedBoard[4][2] = 'wP'; // c4
            updatedBoard[5][3] = 'wP'; // d3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][2] = 'wP'; // c2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move.");
            setTrainingStarted(true);
            break;

          case "Double_Bishop_mate_#3":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[0][7] = 'bR'; // h8
            updatedBoard[0][4] = 'bK'; // e8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][2] = 'bP'; // c7
            updatedBoard[1][3] = 'bP'; // d7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[5][3] = 'bP'; // d3
            updatedBoard[1][1] = 'bB'; // b7
            updatedBoard[3][2] = 'bB'; // c5
            updatedBoard[3][3] = 'wB'; // d5
            updatedBoard[7][2] = 'wB'; // c1
            updatedBoard[3][4] = 'wP'; // e5
            updatedBoard[3][5] = 'wP'; // f5
            updatedBoard[5][2] = 'wP'; // c3
            updatedBoard[5][5] = 'wP'; // f3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][3] = 'wP'; // d2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[5][1] = 'wQ'; // b3
            updatedBoard[5][7] = 'bQ'; // h3
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][3] = 'wR'; // d1
            updatedBoard[7][1] = 'wN'; // b1
            updatedBoard[7][7] = 'wK'; // h1

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          case "Bodens_mate_#1":
            updatedBoard[0][2] = 'bK'; // c8
            updatedBoard[0][3] = 'bR'; // d8
            updatedBoard[1][3] = 'bP'; // d7
            updatedBoard[4][5] = 'wB'; // f4
            updatedBoard[7][5] = 'wB'; // f1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. In Boden's Mate, two attacking bishops on criss-crossing diagonals deliver mate to a king obstructed by friendly pieces, usually a rook and a pawn.");
            setTrainingStarted(true);
            break;

          case "Bodens_mate_#2":
            updatedBoard[0][2] = 'bK'; // c8
            updatedBoard[0][4] = 'bR'; // e8
            updatedBoard[0][7] = 'bR'; // h8
            updatedBoard[0][5] = 'bB'; // f8
            updatedBoard[3][5] = 'bB'; // f5
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][2] = 'bP'; // c7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][2] = 'bN'; // c6
            updatedBoard[2][5] = 'bQ'; // f6
            updatedBoard[3][3] = 'wB'; // d5
            updatedBoard[5][4] = 'wB'; // e3
            updatedBoard[4][5] = 'wP'; // f4
            updatedBoard[5][2] = 'wP'; // c3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[5][5] = 'wQ'; // f3
            updatedBoard[6][3] = 'wN'; // d2
            updatedBoard[7][2] = 'wK'; // c1
            updatedBoard[7][3] = 'wR'; // d1
            updatedBoard[7][7] = 'wR'; // h1

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          case "Bodens_mate_#3":
            updatedBoard[0][2] = 'bK'; // c8
            updatedBoard[0][3] = 'bR'; // d8
            updatedBoard[0][7] = 'bR'; // h8
            updatedBoard[0][5] = 'bB'; // f8
            updatedBoard[2][4] = 'bB'; // e6
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][4] = 'bP'; // e7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][2] = 'bP'; // c6
            updatedBoard[1][3] = 'bN'; // d7
            updatedBoard[2][5] = 'bN'; // f6
            updatedBoard[3][7] = 'bQ'; // h5
            updatedBoard[4][5] = 'wB'; // f4
            updatedBoard[5][3] = 'wB'; // d3
            updatedBoard[5][2] = 'wN'; // c3
            updatedBoard[6][4] = 'wN'; // e2
            updatedBoard[5][5] = 'wQ'; // f3
            updatedBoard[5][7] = 'wP'; // h3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][2] = 'wP'; // c2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[7][2] = 'wK'; // c1
            updatedBoard[7][3] = 'wR'; // d1
            updatedBoard[7][7] = 'wR'; // h1

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          case "Balestra_mate_#1":
            updatedBoard[0][5] = 'bK'; // f8
            updatedBoard[2][6] = 'wQ'; // g6
            updatedBoard[5][6] = 'wB'; // g3
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. The Balestra Mate is similar to Boden's Mate, but instead of two bishops, a bishop and a queen is used. The bishop delivers the checkmate, while the queen blocks the remaining escape squares.");
            setTrainingStarted(true);
            break;

          case "Arabian_mate_#1":
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][5] = 'wR'; // f7
            updatedBoard[2][5] = 'wN'; // f6
            updatedBoard[7][7] = 'wK'; // h1

            setScenarioDescription_2("Checkmate the opponent in 1 move. In the Arabian Mate, the knight and the rook team up to trap the opposing king on a corner of the board. The rook sits on a square adjacent to the king both to prevent escape along the diagonal and to deliver checkmate while the knight sits two squares away diagonally from the king to prevent escape on the square next to the king and to protect the rook.");
            setTrainingStarted(true);
            break;

          case "Arabian_mate_#2":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[1][4] = 'bR'; // e7
            updatedBoard[0][5] = 'bN'; // f8
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[2][2] = 'bP'; // c6
            updatedBoard[2][7] = 'bP'; // h6
            updatedBoard[3][3] = 'bP'; // d5
            updatedBoard[2][4] = 'wP'; // e6
            updatedBoard[3][5] = 'wP'; // f5
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][2] = 'wP'; // c2
            updatedBoard[3][7] = 'wN'; // h5
            updatedBoard[6][3] = 'wK'; // d2
            updatedBoard[7][6] = 'wR'; // g1
            updatedBoard[7][7] = 'wR'; // h1

            setScenarioDescription_2("Checkmate the opponent in 3 move.");
            setTrainingStarted(true);
            break;

          case "Arabian_mate_#3":
            updatedBoard[0][3] = 'bQ'; // d8
            updatedBoard[0][4] = 'bR'; // e8
            updatedBoard[1][2] = 'bR'; // c7
            updatedBoard[0][5] = 'bK'; // f8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[2][4] = 'bP'; // e6
            updatedBoard[2][5] = 'bB'; // f6
            updatedBoard[3][3] = 'bB'; // d5
            updatedBoard[3][0] = 'bN'; // a5
            updatedBoard[3][1] = 'wP'; // b5
            updatedBoard[4][3] = 'wP'; // d4
            updatedBoard[5][0] = 'wP'; // a3
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[3][4] = 'wN'; // e5
            updatedBoard[4][4] = 'wN'; // e4
            updatedBoard[3][7] = 'wQ'; // h5
            updatedBoard[5][7] = 'wR'; // h3
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 3 move.");
            setTrainingStarted(true);
            break;

          case "Corner_mate_#1":
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[3][6] = 'wN'; // g5
            updatedBoard[7][6] = 'wR'; // g1
            updatedBoard[7][7] = 'wK'; // h1

            setScenarioDescription_2("Checkmate the opponent in 1 move. The Corner Mate works by confining the king to the corner using a rook or queen and using a knight to engage the checkmate.");
            setTrainingStarted(true);
            break;

          case "Corner_mate_#2":
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[3][6] = 'bR'; // g5
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][3] = 'wQ'; // d7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[2][6] = 'bP'; // g6
            updatedBoard[3][0] = 'wP'; // a5
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[4][0] = 'wR'; // a4
            updatedBoard[7][5] = 'wR'; // f1
            updatedBoard[4][2] = 'bQ'; // c4
            updatedBoard[4][4] = 'bN'; // e4
            updatedBoard[5][7] = 'wB'; // h3
            updatedBoard[7][7] = 'wK'; // h1

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          case "Morphys_mate_#1":
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[4][7] = 'wB'; // h4
            updatedBoard[7][6] = 'wR'; // g1
            updatedBoard[7][7] = 'wK'; // h1

            setScenarioDescription_2("Checkmate the opponent in 1 move. Morphy's Mate is named after Paul Morphy. It works by using the bishop to attack the enemy king while your rook and an enemy pawn helps to confine it.");
            setTrainingStarted(true);
            break;

          case "Morphys_mate_#2":
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[2][3] = 'bR'; // d6
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[2][4] = 'bP'; // e6
            updatedBoard[2][5] = 'bP'; // f6
            updatedBoard[3][3] = 'bQ'; // d5
            updatedBoard[3][4] = 'wB'; // e5
            updatedBoard[4][3] = 'wP'; // d4
            updatedBoard[5][7] = 'wP'; // h3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[4][4] = 'wR'; // e4
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          case "Morphys_mate_#3":
            updatedBoard[0][2] = 'bR'; // c8
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][0] = 'bP'; // a6
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[5][3] = 'bP'; // d3
            updatedBoard[3][2] = 'bQ'; // c5
            updatedBoard[4][2] = 'wP'; // c4
            updatedBoard[4][5] = 'wP'; // f4
            updatedBoard[5][4] = 'wP'; // e3
            updatedBoard[5][7] = 'wP'; // h3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[5][6] = 'wR'; // g3
            updatedBoard[7][2] = 'wR'; // c1
            updatedBoard[7][0] = 'wB'; // a1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 6 move.");
            setTrainingStarted(true);
            break;

          case "Pillsburys_mate_#1":
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[6][1] = 'wB'; // b2
            updatedBoard[7][4] = 'wK'; // e1
            updatedBoard[7][7] = 'wR'; // h1

            setScenarioDescription_2("Checkmate the opponent in 1 move. Pillsbury's Mate is named for Harry Nelson Pillsbury and is a variation of Morphy's Mate. The rook delivers checkmate while the bishop prevents the King from fleeing to the corner square.");
            setTrainingStarted(true);
            break;

          case "Pillsburys_mate_#2":
            updatedBoard[0][2] = 'bR'; // c8
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][3] = 'bQ'; // d8
            updatedBoard[0][4] = 'bN'; // e8
            updatedBoard[4][2] = 'bN'; // c4
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][3] = 'bP'; // d6
            updatedBoard[3][3] = 'bP'; // d5
            updatedBoard[2][1] = 'bB'; // b6
            updatedBoard[3][6] = 'wQ'; // g5
            updatedBoard[4][4] = 'wP'; // e4
            updatedBoard[5][5] = 'wP'; // f3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[5][3] = 'wB'; // d3
            updatedBoard[6][1] = 'wB'; // b2
            updatedBoard[6][4] = 'wN'; // e2
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][6] = 'wR'; // g1
            updatedBoard[7][7] = 'wK'; // h1

            setScenarioDescription_2("Checkmate the opponent in 5 move.");
            setTrainingStarted(true);
            break;

          case "Damianos_mate_#1":
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[2][6] = 'wP'; // g6
            updatedBoard[3][7] = 'wQ'; // h5
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. Damiano's Mate is a classic method of checkmating and one of the oldest. It works by confining the king with a pawn or bishop and using a queen to initiate the final blow. Damiano's mate is often arrived at by first sacrificing a rook on the h-file, then checking the king with the queen on the h-file, and then moving in for the mate. The checkmate was first published by Pedro Damiano in 1512.");
            setTrainingStarted(true);
            break;

          case "Damianos_mate_#2":
            updatedBoard[0][4] = 'bR'; // e8
            updatedBoard[0][5] = 'bK'; // f8
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[2][3] = 'bP'; // d6
            updatedBoard[3][0] = 'bP'; // a5
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[3][5] = 'bP'; // f5
            updatedBoard[1][3] = 'bQ'; // d7
            updatedBoard[2][5] = 'wB'; // f6
            updatedBoard[2][6] = 'bN'; // g6
            updatedBoard[3][3] = 'wP'; // d5
            updatedBoard[4][0] = 'wP'; // a4
            updatedBoard[4][2] = 'wP'; // c4
            updatedBoard[5][1] = 'wP'; // b3
            updatedBoard[5][2] = 'wK'; // c3
            updatedBoard[5][6] = 'wQ'; // g3
            updatedBoard[7][7] = 'wR'; // h1

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          case "Damianos_mate_#3":
            updatedBoard[0][0] = 'bQ'; // a8
            updatedBoard[0][2] = 'bR'; // c8
            updatedBoard[0][7] = 'bR'; // h8
            updatedBoard[1][1] = 'bB'; // b7
            updatedBoard[3][2] = 'bB'; // c5
            updatedBoard[1][4] = 'bK'; // e7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[2][0] = 'bP'; // a6
            updatedBoard[2][4] = 'bP'; // e6
            updatedBoard[4][1] = 'bP'; // b4
            updatedBoard[5][6] = 'bP'; // g3
            updatedBoard[3][0] = 'wP'; // a5
            updatedBoard[4][4] = 'wP'; // e4
            updatedBoard[5][5] = 'wP'; // f3
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[4][2] = 'wN'; // c4
            updatedBoard[5][3] = 'wB'; // d3
            updatedBoard[5][4] = 'wB'; // e3
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][5] = 'wR'; // f1
            updatedBoard[7][4] = 'wQ'; // e1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 5 move.");
            setTrainingStarted(true);
            break;

          case "Lollis_mate_#1":
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[2][6] = 'bP'; // g6
            updatedBoard[2][5] = 'wP'; // f6
            updatedBoard[2][7] = 'wQ'; // h6
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. Lolli's Mate involves infiltrating Black's fianchetto position using both a pawn and queen. The queen often gets to the h6 square by means of sacrifices on the h-file. It is named after Giambattista Lolli.");
            setTrainingStarted(true);
            break;

          case "Lollis_mate_#2":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[1][1] = 'bQ'; // b7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][0] = 'bP'; // a6
            updatedBoard[2][4] = 'bP'; // e6
            updatedBoard[3][1] = 'bP'; // b5
            updatedBoard[1][6] = 'bK'; // g7
            updatedBoard[2][2] = 'bB'; // c6
            updatedBoard[2][6] = 'bN'; // g6
            updatedBoard[3][6] = 'wQ'; // g5
            updatedBoard[3][7] = 'wP'; // h5
            updatedBoard[4][4] = 'wP'; // e4
            updatedBoard[5][2] = 'wP'; // c3
            updatedBoard[5][6] = 'wP'; // g3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[5][1] = 'wB'; // b3
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][3] = 'wR'; // d1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 3 move.");
            setTrainingStarted(true);
            break;

          case "Lollis_mate_#3":
            updatedBoard[0][4] = 'bR'; // e8
            updatedBoard[2][4] = 'bR'; // e6
            updatedBoard[0][6] = 'bQ'; // g8
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][0] = 'bP'; // a6
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[2][6] = 'bP'; // g6
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[4][3] = 'bP'; // d4
            updatedBoard[2][5] = 'wP'; // f6
            updatedBoard[3][4] = 'wP'; // e5
            updatedBoard[5][2] = 'wP'; // c3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[2][7] = 'wR'; // h6
            updatedBoard[4][4] = 'wR'; // e4
            updatedBoard[3][3] = 'bB'; // d5
            updatedBoard[3][6] = 'wQ'; // g5
            updatedBoard[7][2] = 'wB'; // c1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 6 move.");
            setTrainingStarted(true);
            break;

          default:
            break;
        }
        break;

      case 'checkmate_pattern_III':
        setpieceDescription("Checkmate Patterns III Recognize the patterns");
        setScenarioDescription("Try this!");
        switch (scenario) {
          case "Opera_mate_#1":
            updatedBoard[0][4] = 'bK'; // e8
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[3][6] = 'wB'; // g5
            updatedBoard[7][3] = 'wR'; // d1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. The Opera Mate works by attacking the king on the back rank with a rook using a bishop to protect it. A pawn or other piece other than a knight of the enemy king's is used to restrict its movement. The checkmate was named after its implementation by Paul Morphy in 1858 at a game at the Paris opera against Duke Karl of Brunswick and Count Isouard, known as the 'The Opera Game'.");
            setTrainingStarted(true);
            break;

          case "Opera_mate_#2":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[0][3] = 'bR'; // d8
            updatedBoard[0][1] = 'bN'; // b8
            updatedBoard[2][5] = 'bN'; // f6
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][2] = 'bP'; // c7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][3] = 'bQ'; // d6
            updatedBoard[3][4] = 'bB'; // e5
            updatedBoard[4][6] = 'bB'; // g4
            updatedBoard[3][6] = 'wB'; // g5
            updatedBoard[5][1] = 'wB'; // b3
            updatedBoard[4][4] = 'wP'; // e4
            updatedBoard[5][2] = 'wP'; // c3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[5][4] = 'wQ'; // e3
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][7] = 'wR'; // h1
            updatedBoard[7][1] = 'wN'; // b1
            updatedBoard[7][6] = 'wN'; // g1
            updatedBoard[7][4] = 'wK'; // e1

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          case "Opera_mate_#3":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][1] = 'bN'; // b8
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][2] = 'bP'; // c6
            updatedBoard[3][4] = 'bP'; // e5
            updatedBoard[3][3] = 'wP'; // d5
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][2] = 'wP'; // c2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[3][5] = 'bB'; // f5
            updatedBoard[4][2] = 'bQ'; // c4
            updatedBoard[5][1] = 'wQ'; // b3
            updatedBoard[6][3] = 'wB'; // d2
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][7] = 'wR'; // h1
            updatedBoard[7][4] = 'wK'; // e1
            updatedBoard[7][6] = 'wN'; // g1

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          case "Anderssens_mate_#1":
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][6] = 'wP'; // g7
            updatedBoard[2][5] = 'wK'; // f6
            updatedBoard[2][7] = 'wR'; // h6

            setScenarioDescription_2("Checkmate the opponent in 1 move. In Anderssen's mate, named for Adolf Anderssen, the rook or queen is supported by a diagonally-attacking piece such as a pawn or bishop as it checkmates the opposing king along the eighth rank.");
            setTrainingStarted(true);
            break;

          case "Anderssens_mate_#2":
            updatedBoard[0][1] = 'bK'; // b8
            updatedBoard[0][4] = 'bR'; // e8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[3][7] = 'bP'; // h5
            updatedBoard[6][6] = 'bP'; // g2
            updatedBoard[1][1] = 'wP'; // b7
            updatedBoard[3][3] = 'wP'; // d5
            updatedBoard[5][2] = 'wP'; // c3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[3][5] = 'wB'; // f5
            updatedBoard[4][5] = 'bQ'; // f4
            updatedBoard[5][0] = 'wN'; // a3
            updatedBoard[5][5] = 'bB'; // f3
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 3 move.");
            setTrainingStarted(true);
            break;

          case "Anderssens_mate_#3":
            updatedBoard[0][2] = 'bR'; // c8
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][4] = 'bN'; // e8
            updatedBoard[3][0] = 'bN'; // a5
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[2][4] = 'bP'; // e6
            updatedBoard[2][6] = 'bP'; // g6
            updatedBoard[2][7] = 'wQ'; // h6
            updatedBoard[3][1] = 'wP'; // b5
            updatedBoard[5][0] = 'wP'; // a3
            updatedBoard[6][2] = 'wP'; // c2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[3][2] = 'bQ'; // c5
            updatedBoard[3][3] = 'bB'; // d5
            updatedBoard[3][4] = 'wR'; // e5
            updatedBoard[7][3] = 'wR'; // d1
            updatedBoard[3][5] = 'wN'; // f5
            updatedBoard[5][3] = 'wB'; // d3
            updatedBoard[6][1] = 'wB'; // b2
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 4 move.");
            setTrainingStarted(true);
            break;

          case "Dovetail_mate_#1":
            updatedBoard[0][1] = 'bR'; // b8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bK'; // b7
            updatedBoard[2][4] = 'wQ'; // e6
            updatedBoard[3][3] = 'wP'; // d5
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. In the Dovetail Mate, the mating queen is one square diagonally from the mated king which escape is blocked by two friendly non-Knight pieces.");
            setTrainingStarted(true);
            break;

          case "Dovetail_mate_#2":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[0][6] = 'bR'; // g8
            updatedBoard[0][2] = 'bB'; // c8
            updatedBoard[2][1] = 'bB'; // b6
            updatedBoard[0][4] = 'bQ'; // e8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][2] = 'bP'; // c7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][3] = 'bP'; // d6
            updatedBoard[3][4] = 'bP'; // e5
            updatedBoard[1][6] = 'bK'; // g7
            updatedBoard[2][2] = 'bN'; // c6
            updatedBoard[3][6] = 'wB'; // g5
            updatedBoard[4][3] = 'wP'; // d4
            updatedBoard[4][4] = 'wP'; // e4
            updatedBoard[5][2] = 'wP'; // c3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[5][5] = 'wQ'; // f3
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][5] = 'wR'; // f1
            updatedBoard[7][1] = 'wN'; // b1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move.");
            setTrainingStarted(true);
            break;

          case "Dovetail_mate_#3":
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][2] = 'bP'; // c6
            updatedBoard[2][3] = 'bP'; // d6
            updatedBoard[2][6] = 'bP'; // g6
            updatedBoard[3][0] = 'bP'; // a5
            updatedBoard[5][4] = 'bP'; // e3
            updatedBoard[1][3] = 'bB'; // d7
            updatedBoard[4][3] = 'bB'; // d4
            updatedBoard[4][2] = 'wP'; // c4
            updatedBoard[4][6] = 'wP'; // g4
            updatedBoard[5][1] = 'wP'; // b3
            updatedBoard[5][3] = 'wP'; // d3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[4][7] = 'bQ'; // h4
            updatedBoard[5][5] = 'wK'; // f3
            updatedBoard[6][2] = 'wN'; // c2
            updatedBoard[6][6] = 'wR'; // g2
            updatedBoard[7][1] = 'wR'; // b1
            updatedBoard[7][2] = 'wQ'; // c1

            setScenarioDescription_2("Checkmate the opponent in 4 move.");
            setTrainingStarted(true);
            break;

          case "Dovetail_mate_#4":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[6][0] = 'bR'; // a2
            updatedBoard[0][1] = 'wR'; // b8
            updatedBoard[6][6] = 'wR'; // g2
            updatedBoard[1][5] = 'bK'; // f7
            updatedBoard[2][2] = 'bP'; // c6
            updatedBoard[3][5] = 'bP'; // f5
            updatedBoard[2][6] = 'bQ'; // g6
            updatedBoard[3][4] = 'wQ'; // e5
            updatedBoard[3][6] = 'bB'; // g5
            updatedBoard[4][6] = 'bB'; // g4
            updatedBoard[4][2] = 'wP'; // c4
            updatedBoard[4][5] = 'wP'; // f4
            updatedBoard[5][4] = 'wP'; // e3
            updatedBoard[4][3] = 'wB'; // d4
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. Other variations of the Dovetail Mate can occur if a queen delivers mate by checking the king from a diagonally adjacent square while supported by a friendly piece and you also control the two potential escape squares with other pieces, typically a bishop.");
            setTrainingStarted(true);
            break;

          case "Cozios_mate_#1":
            updatedBoard[2][1] = 'wQ'; // b6
            updatedBoard[4][6] = 'bP'; // g4
            updatedBoard[4][7] = 'bK'; // h4
            updatedBoard[5][5] = 'bQ'; // f3
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 2 moves. Cozio's Mate is an upside down version of the Dovetail Mate. It was named after a study by Carlo Cozio that was published in 1766.");
            setTrainingStarted(true);
            break;

          case "Swallows_mate_#1":
            updatedBoard[0][3] = 'bR'; // d8
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[1][4] = 'bK'; // e7
            updatedBoard[2][0] = 'wR'; // a6
            updatedBoard[3][3] = 'wQ'; // d5
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. The Swallow's Tail Mate works by attacking the enemy king with a queen that is protected by a rook or other piece. The enemy king's own pieces block its means of escape. It is also known as the Guéridon Mate.");
            setTrainingStarted(true);
            break;

          case "Swallows_mate_#2":
            updatedBoard[2][2] = 'wP'; // c6
            updatedBoard[3][3] = 'wK'; // d5
            updatedBoard[3][5] = 'bK'; // f5
            updatedBoard[4][2] = 'wR'; // c4
            updatedBoard[4][6] = 'bP'; // g4
            updatedBoard[5][2] = 'bQ'; // c3

            setScenarioDescription_2("Checkmate the opponent in 1 move.");
            setTrainingStarted(true);
            break;

          case "Epaulette_mate_#1":
            updatedBoard[0][3] = 'bR'; // d8
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][4] = 'bK'; // e8
            updatedBoard[2][5] = 'wQ'; // f6
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. The Epaulette Mate is a checkmate where two parallel retreat squares for a checked king are occupied by its own pieces, preventing its escape.");
            setTrainingStarted(true);
            break;

          case "Epaulette_mate_#2":
            updatedBoard[0][1] = 'bK'; // b8
            updatedBoard[0][3] = 'bR'; // d8
            updatedBoard[3][5] = 'bR'; // f5
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][5] = 'bP'; // f6
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[1][3] = 'bQ'; // d7
            updatedBoard[1][5] = 'wB'; // f7
            updatedBoard[5][2] = 'wB'; // c3
            updatedBoard[2][3] = 'bB'; // d6
            updatedBoard[2][4] = 'wQ'; // e6
            updatedBoard[4][0] = 'wP'; // a4
            updatedBoard[4][7] = 'wP'; // h4
            updatedBoard[5][4] = 'wP'; // e3
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[5][3] = 'bN'; // d3
            updatedBoard[7][5] = 'wR'; // f1
            updatedBoard[7][7] = 'wR'; // h1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          case "Epaulette_mate_#3":
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[2][5] = 'bR'; // f6
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[1][5] = 'bK'; // f7
            updatedBoard[3][0] = 'bQ'; // a5
            updatedBoard[3][5] = 'wQ'; // f5
            updatedBoard[4][3] = 'wP'; // d4
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][2] = 'wP'; // c2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[5][6] = 'wR'; // g3
            updatedBoard[7][1] = 'wK'; // b1

            setScenarioDescription_2("Checkmate the opponent in 1 move.");
            setTrainingStarted(true);
            break;

          case "Pawn_mate_#1":
            updatedBoard[1][7] = 'wR'; // h7
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[2][3] = 'bP'; // d6
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[2][2] = 'bK'; // c6
            updatedBoard[4][1] = 'wP'; // b4
            updatedBoard[4][2] = 'wP'; // c4
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. Although the Pawn Mate can take many forms, it is generally characterized as a mate in which a pawn is the final attacking piece and where enemy pawns are nearby. The Pawn Mate is sometimes also called the David and Goliath Mate, named after the biblical account of David and Goliath.");
            setTrainingStarted(true);
            break;

          case "Pawn_mate_#2":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[0][7] = 'bR'; // h8
            updatedBoard[0][2] = 'bB'; // c8
            updatedBoard[2][1] = 'bB'; // b6
            updatedBoard[0][6] = 'bN'; // g8
            updatedBoard[2][2] = 'bN'; // c6
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][2] = 'bP'; // c7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][3] = 'bP'; // d6
            updatedBoard[3][4] = 'bP'; // e5
            updatedBoard[1][6] = 'bQ'; // g7
            updatedBoard[2][4] = 'bK'; // e6
            updatedBoard[3][6] = 'wB'; // g5
            updatedBoard[3][7] = 'wQ'; // h5
            updatedBoard[4][3] = 'wP'; // d4
            updatedBoard[4][4] = 'wP'; // e4
            updatedBoard[5][2] = 'wP'; // c3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][5] = 'wR'; // f1
            updatedBoard[7][1] = 'wN'; // b1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          default:
            break;
        }
        break;

      case 'checkmate_pattern_IV':
        setpieceDescription("Checkmate Patterns IV Recognize the patterns");
        setScenarioDescription("Try this!");
        switch (scenario) {
          case "Suffocation_mate_#1":
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[3][3] = 'wN'; // d5
            updatedBoard[6][1] = 'wB'; // b2
            updatedBoard[7][7] = 'wK'; // h1

            setScenarioDescription_2("Checkmate the opponent in 1 move. The Suffocation Mate works by using the knight to attack the enemy king and the bishop to confine the king's escape routes.");
            setTrainingStarted(true);
            break;

          case "Suffocation_mate_#2":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[0][7] = 'bR'; // h8
            updatedBoard[0][5] = 'bK'; // f8
            updatedBoard[1][1] = 'bQ'; // b7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][0] = 'bP'; // a6
            updatedBoard[2][5] = 'bP'; // f6
            updatedBoard[3][1] = 'bP'; // b5
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[2][2] = 'wN'; // c6
            updatedBoard[5][1] = 'wP'; // b3
            updatedBoard[5][2] = 'wP'; // c3
            updatedBoard[5][3] = 'wP'; // d3
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][4] = 'wR'; // e1
            updatedBoard[7][2] = 'wB'; // c1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 4 move.");
            setTrainingStarted(true);
            break;

          case "Grecos_mate_#1":
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[2][6] = 'wQ'; // g6
            updatedBoard[5][1] = 'wB'; // b3
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. Greco's Mate is named after the famous Italian checkmate cataloguer Gioachino Greco. It works by using the bishop to contain the black king by use of the black g-pawn and subsequently using the queen or a rook to checkmate the king by moving it to the edge of the board.");
            setTrainingStarted(true);
            break;

          case "Grecos_mate_#2":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][7] = 'bK'; // h8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[4][3] = 'bP'; // d4
            updatedBoard[1][2] = 'bN'; // c7
            updatedBoard[1][4] = 'wN'; // e7
            updatedBoard[1][5] = 'wB'; // f7
            updatedBoard[2][4] = 'bB'; // e6
            updatedBoard[3][4] = 'wP'; // e5
            updatedBoard[5][1] = 'wP'; // b3
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][2] = 'wP'; // c2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[4][5] = 'wR'; // f4
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          case "Grecos_mate_#3":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][3] = 'bQ'; // d8
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][2] = 'bP'; // c7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[3][5] = 'bP'; // f5
            updatedBoard[1][1] = 'bB'; // b7
            updatedBoard[2][3] = 'bB'; // d6
            updatedBoard[3][3] = 'wN'; // d5
            updatedBoard[4][2] = 'wB'; // c4
            updatedBoard[5][0] = 'wP'; // a3
            updatedBoard[5][4] = 'wP'; // e3
            updatedBoard[5][5] = 'wP'; // f3
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[5][6] = 'bN'; // g3
            updatedBoard[7][2] = 'wR'; // c1
            updatedBoard[7][7] = 'wR'; // h1
            updatedBoard[7][3] = 'wQ'; // d1
            updatedBoard[7][4] = 'wK'; // e1

            setScenarioDescription_2("Checkmate the opponent in 4 move.");
            setTrainingStarted(true);
            break;

          case "Max_Langes_mate_#1":
            updatedBoard[0][2] = 'wQ'; // c8
            updatedBoard[1][5] = 'wB'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[2][7] = 'bP'; // h6
            updatedBoard[1][7] = 'bK'; // h7
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. Max Lange's Mate is named after German chess player and problem composer Max Lange. It works by using the bishop and queen in combination to checkmate the king.");
            setTrainingStarted(true);
            break;

          case "Max_Langes_mate_#2":
            updatedBoard[0][0] = 'bR'; // a8
            updatedBoard[0][4] = 'bK'; // e8
            updatedBoard[1][0] = 'bP'; // a7
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[1][2] = 'bP'; // c7
            updatedBoard[1][5] = 'bP'; // f7
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[3][3] = 'bP'; // d5
            updatedBoard[5][3] = 'bP'; // d3
            updatedBoard[3][2] = 'bB'; // c5
            updatedBoard[3][4] = 'wP'; // e5
            updatedBoard[3][7] = 'wP'; // h5
            updatedBoard[6][0] = 'wP'; // a2
            updatedBoard[6][1] = 'wP'; // b2
            updatedBoard[6][2] = 'wP'; // c2
            updatedBoard[6][3] = 'wP'; // d2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[4][4] = 'bQ'; // e4
            updatedBoard[5][1] = 'wB'; // b3
            updatedBoard[7][2] = 'wB'; // c1
            updatedBoard[5][5] = 'wQ'; // f3
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][1] = 'wN'; // b1
            updatedBoard[7][7] = 'wK'; // h1

            setScenarioDescription_2("Checkmate the opponent in 5 move.");
            setTrainingStarted(true);
            break;

          case "Blackburnes_mate_#1":
            updatedBoard[0][5] = 'bR'; // f8
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[3][6] = 'wN'; // g5
            updatedBoard[6][1] = 'wB'; // b2
            updatedBoard[6][2] = 'wB'; // c2
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. Blackburne's Mate is named for Joseph Henry Blackburne. This checkmate utilizes an enemy rook (or bishop or queen) to confine the black king's escape to the f8 square. One of the bishops confines the black king's movement by operating at a distance, while the knight and the other bishop operate within close range.");
            setTrainingStarted(true);
            break;

          case "Rétis_Mate_#1":
            updatedBoard[0][1] = 'bN'; // b8
            updatedBoard[0][2] = 'bB'; // c8
            updatedBoard[1][1] = 'bP'; // b7
            updatedBoard[2][2] = 'bP'; // c6
            updatedBoard[1][2] = 'bK'; // c7
            updatedBoard[4][7] = 'wB'; // h4
            updatedBoard[7][3] = 'wR'; // d1
            updatedBoard[7][7] = 'wK'; // h1

            setScenarioDescription_2("Checkmate the opponent in 1 move. Réti's Mate is named after Richard Réti, who delivered it in an 11-move game against Savielly Tartakower in 1910 in Vienna. It works by trapping the enemy king with four of its own pieces that are situated on flight squares and then attacking it with a bishop that is protected by a rook or queen.");
            setTrainingStarted(true);
            break;

          case "Légals_Mate_#1":
            updatedBoard[0][3] = 'bQ'; // d8
            updatedBoard[0][5] = 'bB'; // f8
            updatedBoard[1][4] = 'bK'; // e7
            updatedBoard[1][5] = 'wB'; // f7
            updatedBoard[2][3] = 'bP'; // d6
            updatedBoard[3][4] = 'wN'; // e5
            updatedBoard[5][2] = 'wN'; // c3
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. In Légal's Mate, the knight moves into a position to check the king. The bishop is guarded by the other knight, and the enemy pieces block the king's escape.");
            setTrainingStarted(true);
            break;

          case "Kill_Box_Mate_#1":
            updatedBoard[0][2] = 'bK'; // c8
            updatedBoard[0][3] = 'bR'; // d8
            updatedBoard[2][1] = 'wQ'; // b6
            updatedBoard[6][5] = 'wP'; // f2
            updatedBoard[6][6] = 'wP'; // g2
            updatedBoard[6][7] = 'wP'; // h2
            updatedBoard[7][3] = 'wR'; // d1
            updatedBoard[7][5] = 'wR'; // f1
            updatedBoard[7][6] = 'wK'; // g1

            setScenarioDescription_2("Checkmate the opponent in 1 move. The Kill Box Mate occurs when a rook is next to the enemy king and supported by a queen that also blocks the king's escape squares. The rook and the queen catch the enemy king in a 3 by 3 'kill box'.");
            setTrainingStarted(true);
            break;

          case "Triangle_Mate_#1":
            updatedBoard[1][3] = 'bP'; // d7
            updatedBoard[2][3] = 'bK'; // d6
            updatedBoard[3][2] = 'wR'; // c5
            updatedBoard[3][7] = 'wQ'; // h5
            updatedBoard[5][4] = 'wK'; // e3

            setScenarioDescription_2("Checkmate the opponent in 1 move. A Triangle Mate is delivered by a queen attacking an enemy king, while it is supported by a rook. The queen and rook are one square away from the enemy king. They are on the same rank or file, separated by one square, with the enemy king being between them one square away, forming a triangle. The king must be restricted from escaping to the middle square behind it away from the queen and rook, by the edge of the board, a piece blocking it, or by controlling that square with a third piece.");
            setTrainingStarted(true);
            break;

          case "Vukovic_Mate_#1":
            updatedBoard[0][4] = 'bK'; // e8
            updatedBoard[1][0] = 'wR'; // a7
            updatedBoard[2][4] = 'wN'; // e6
            updatedBoard[3][3] = 'bR'; // d5
            updatedBoard[5][0] = 'wB'; // a3
            updatedBoard[6][4] = 'wK'; // e2

            setScenarioDescription_2("Checkmate the opponent in 1 move. In the Vukovic Mate, a rook and knight team up to mate the king on the edge of the board. The rook delivers mate while supported by a third piece, and the knight is used to block the king's escape squares.");
            setTrainingStarted(true);
            break;

          case "Vukovic_Mate_#2":
            updatedBoard[0][0] = 'wR'; // a8
            updatedBoard[3][7] = 'bP'; // h5
            updatedBoard[4][6] = 'bN'; // g4
            updatedBoard[5][6] = 'bK'; // g3
            updatedBoard[6][3] = 'bR'; // d2
            updatedBoard[7][5] = 'wK'; // f1

            setScenarioDescription_2("Checkmate the opponent in 3 move.");
            setTrainingStarted(true);
            break;

          case "Vukovic_Mate_#3":
            updatedBoard[0][2] = 'bR'; // c8
            updatedBoard[3][5] = 'wK'; // f5
            updatedBoard[3][7] = 'bK'; // h5
            updatedBoard[4][4] = 'wN'; // e4
            updatedBoard[4][6] = 'wR'; // g4
            updatedBoard[5][7] = 'wP'; // h3

            setScenarioDescription_2("Checkmate the opponent in 2 move.");
            setTrainingStarted(true);
            break;

          default:
            break;
        }
        break;

      case 'checkmate_II':
        setpieceDescription("Piece checkmates II Challenging checkmates");
        setScenarioDescription("Try this!");
        switch (scenario) {
          case "Queen_vs_bishop_mate":
            updatedBoard[2][3] = 'bK'; // d6
            updatedBoard[2][4] = 'bB'; // e6
            updatedBoard[5][3] = 'wK'; // d3
            updatedBoard[5][4] = 'wQ'; // e3

            setScenarioDescription_2("Keep your pieces on the opposite color squares from the enemy bishop to stay safe. Use your queen to encroach on the king and look for double attacks. Mate in 10 if played perfectly.");
            setTrainingStarted(true);
            break;

          case "Queen_vs_knight_mate":
            updatedBoard[2][3] = 'bK'; // d6
            updatedBoard[2][4] = 'bN'; // e6
            updatedBoard[5][3] = 'wK'; // d3
            updatedBoard[5][4] = 'wQ'; // e3

            setScenarioDescription_2("Force the enemy king to the edge of the board while avoiding tricky knight forks. Mate in 12 if played perfectly.");
            setTrainingStarted(true);
            break;

          case "Queen_vs_rook_mate":
            updatedBoard[1][3] = 'bK'; // d7
            updatedBoard[1][4] = 'bR'; // e7
            updatedBoard[3][3] = 'wK'; // d5
            updatedBoard[3][4] = 'wQ'; // e5

            setScenarioDescription_2("Normally the winning process involves the queen first winning the rook by a fork and then checkmating with the king and queen, but forced checkmates with the rook still on the board are possible in some positions or against incorrect defense. Mate in 18 if played perfectly.");
            setTrainingStarted(true);
            break;

          case "Two_bishop_mate":
            updatedBoard[2][3] = 'bK'; // d6
            updatedBoard[5][2] = 'wB'; // c3
            updatedBoard[5][3] = 'wB'; // d3
            updatedBoard[5][4] = 'wK'; // e3

            setScenarioDescription_2("When trying to checkmate with two bishops, there are two important principles to follow. One, the bishops are best when they are near the center of the board and on adjacent diagonals. This cuts off the opposing king. Two, the king must be used aggressively, in conjunction with the bishops.Mate in 13 if played perfectly.");
            setTrainingStarted(true);
            break;

          case "Knight_and_bishop_mate#1":
            updatedBoard[2][1] = 'bK'; // b6
            updatedBoard[2][3] = 'wK'; // d6
            updatedBoard[4][2] = 'wB'; // c4
            updatedBoard[4][3] = 'wN'; // d4

            setScenarioDescription_2("Of the basic checkmates, this is the most difficult one to force, because the knight and bishop cannot form a linear barrier to the enemy king from a distance. The checkmate can be forced only in a corner that the bishop controls. The mating process often requires accurate play, since a few errors could result in a draw either by the fifty-move rule or stalemate.Mate in 10 if played perfectly.");
            setTrainingStarted(true);
            break;

          case "Knight_and_bishop_mate#2":
            updatedBoard[2][3] = 'bK'; // d6
            updatedBoard[3][3] = 'wB'; // d5
            updatedBoard[4][3] = 'wK'; // d4
            updatedBoard[6][3] = 'wN'; // d2

            setScenarioDescription_2("Of the basic checkmates, this is the most difficult one to force, because the knight and bishop cannot form a linear barrier to the enemy king from a distance. The checkmate can be forced only in a corner that the bishop controls. The mating process often requires accurate play, since a few errors could result in a draw either by the fifty-move rule or stalemate.Mate in 19 if played perfectly.");
            setTrainingStarted(true);
            break;

          case "Two_knights_vs_pawn":
            updatedBoard[0][6] = 'bK'; // g8
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[3][4] = 'wK'; // e5
            updatedBoard[4][4] = 'wN'; // e4
            updatedBoard[4][5] = 'wN'; // f4

            setScenarioDescription_2("Two knights can't force checkmate by themselves, but if the enemy has a pawn, we can avoid stalemate and force mate.Mate in 15 if played perfectly.");
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
      CM1: piece === 'CM1',
      CP1: piece === 'CP1',
      CP2: piece === 'CP2',
      CP3: piece === 'CP3',
      CP4: piece === 'CP4',
      CM2: piece === 'CM2',
    });
  };

  const handlePawnClick = () => handlePieceClick('pawn');
  const handleRookClick = () => handlePieceClick('rook');
  const handleBishopClick = () => handlePieceClick('bishop');
  const handleKnightClick = () => handlePieceClick('knight');
  const handleQueenClick = () => handlePieceClick('queen');
  const handleKingClick = () => handlePieceClick('king');
  const handleCM1Click = () => handlePieceClick('CM1')
  const handleCP1Click = () => handlePieceClick('CP1')
  const handleCP2Click = () => handlePieceClick('CP2')
  const handleCP3Click = () => handlePieceClick('CP3')
  const handleCP4Click = () => handlePieceClick('CP4')
  const handleCM2Click = () => handlePieceClick('CM2')

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
          <div className="description">
            <div className="piece_description">{pieceDescription}</div>
            <div className='scenario'>
              <p className="scenario_description">{scenarioDescription}</p>
              <p className="scenario_description 2">{scenarioDescription_2}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lesson-buttons-container">
            {/* Pawn Button and Scenarios */}
            <button onClick={handlePawnClick} className="lesson-piece-button_L pawn">Pawn</button>
            {showScenarios.pawn && (
              <>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('pawn', 'basic')}>Basic</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('pawn', 'capture')}>Capture</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('pawn', 'training_1')}>Training 1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('pawn', 'training_2')}>Training 2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('pawn', 'training_3')}>Training 3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('pawn', 'special_move')}>Special Move</button>
              </>
            )}

            {/* Bishop Button and Scenarios */}
            <button onClick={handleBishopClick} className="lesson-piece-button_L bishop">Bishop</button>
            {showScenarios.bishop && (
              <>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('bishop', 'basic')}>Basic</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('bishop', 'training_1')}>Training 1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('bishop', 'training_2')}>Training 2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('bishop', 'training_3')}>Training 3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('bishop', 'training_4')}>Training 4</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('bishop', 'final')}>Final</button>
              </>
            )}

            {/* Knight Button and Scenarios */}
            <button onClick={handleKnightClick} className="lesson-piece-button_L knight">Knight</button>
            {showScenarios.knight && (
              <>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('knight', 'basic')}>The Basic</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('knight', 'training_1')}>Training 1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('knight', 'training_2')}>Training 2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('knight', 'training_3')}>Training 3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('knight', 'training_4')}>Training 4</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('knight', 'final')}>Final</button>
              </>
            )}


            {/* Rook Button and Scenarios */}
            <button onClick={handleRookClick} className="lesson-piece-button_L rook">Rook</button>
            {showScenarios.rook && (
              <>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('rook', 'basic')}>The Basic</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('rook', 'training_1')}>Training 1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('rook', 'training_2')}>Training 2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('rook', 'training_3')}>Training 3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('rook', 'training_4')}>Training 4</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('rook', 'final')}>Final</button>
              </>
            )}

            {/* Queen Button and Scenarios */}
            <button onClick={handleQueenClick} className="lesson-piece-button_L queen">Queen</button>
            {showScenarios.queen && (
              <>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('queen', 'basic')}>The Basic</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('queen', 'training_1')}>Training 1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('queen', 'training_2')}>Training 2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('queen', 'training_3')}>Training 3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('queen', 'final')}>Final</button>
              </>
            )}


            {/* King Button and Scenarios */}
            <button onClick={handleKingClick} className="lesson-piece-button_L king">King</button>
            {showScenarios.king && (
              <>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('king', 'basic')}>The Basic</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('king', 'training')}>Training</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('king', 'final')}>Final</button>
              </>
            )}

            {/* basic_checkmate_1 Button and Scenarios */}
            <button onClick={handleCM1Click} className="lesson-piece-button_L basic-checkmate">Basic Checkmate_1</button>
            {showScenarios.CM1 && (
              <>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('basic_checkmate_1', 'queen_and_rook_mate')}>Queen & Rook Mate</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('basic_checkmate_1', 'two_rook_mate')}>Two Rook Mate</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('basic_checkmate_1', 'queen_and_bishop_mate')}>Queen & Bishop Mate</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('basic_checkmate_1', 'queen_and_knight_mate')}>Queen & Knight Mate</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('basic_checkmate_1', 'queen_mate')}>Queen Mate</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('basic_checkmate_1', 'rook_mate')}>Rook Mate</button>
              </>
            )}
{/* checkmate_pattern_I Button and Scenarios */}
            <button onClick={handleCP1Click} className="lesson-piece-button_L checkmate_pattern_I">checkmate_pattern_I</button>
            {showScenarios.CP1 && (
              <>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Back-Rank_Mate_#1')}>Back-Rank Mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Back-Rank_Mate_#2')}>Back-Rank Mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Back-Rank_Mate_#3')}>Back-Rank Mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Back-Rank_Mate_#4')}>Back-Rank Mate #4</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Hook_mate_#1')}>Hook mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Hook_mate_#2')}>Hook mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Hook_mate_#3')}>Hook mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Anastasias_mate_#1')}>Anastasia's mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Anastasias_mate_#2')}>Anastasia's mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Anastasias_mate_#3')}>Anastasia's mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Anastasias_mate_#4')}>Anastasia's mate #4</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Blind_swine_mate_#1')}>Blind swine mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Blind_swine_mate_#2')}>Blind swine mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Blind_swine_mate_#3')}>Blind swine mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Smothered_mate_#1')}>Smothered mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Smothered_mate_#2')}>Smothered mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Smothered_mate_#3')}>Smothered mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_I', 'Smothered_mate_#4')}>Smothered mate #4</button>
              </>
            )}

            {/* checkmate_pattern_II Button and Scenarios */}
            <button onClick={handleCP2Click} className="lesson-piece-button_L checkmate_pattern_II">checkmate_pattern_II</button>
            {showScenarios.CP2 && (
              <>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Double_Bishop_mate_#1')}>Double Bishop mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Double_Bishop_mate_#2')}>Double Bishop mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Double_Bishop_mate_#3')}>Double Bishop mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Bodens_mate_#1')}>Boden's mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Bodens_mate_#2')}>Boden's mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Bodens_mate_#3')}>Boden's mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Balestra_mate_#1')}>Balestra mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Arabian_mate_#1')}>Arabian mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Arabian_mate_#2')}>Arabian mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Arabian_mate_#3')}>Arabian mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Corner_mate_#1')}>Corner mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Corner_mate_#2')}>Corner mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Morphys_mate_#1')}>Morphy's mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Morphys_mate_#2')}>Morphy's mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Morphys_mate_#3')}>Morphy's mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Pillsburys_mate_#1')}>Pillsbury's mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Pillsburys_mate_#2')}>Pillsbury's mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Damianos_mate_#1')}>Damiano's mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Damianos_mate_#2')}>Damiano's mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Damianos_mate_#3')}>Damiano's mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Lollis_mate_#1')}>Lolli's mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Lollis_mate_#2')}>Lolli's mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_II', 'Lollis_mate_#3')}>Lolli's mate #3</button>
              </>
            )}

            {/* checkmate_pattern_III Button and Scenarios */}
            <button onClick={handleCP3Click} className="lesson-piece-button_L checkmate_pattern_III">checkmate_pattern_III</button>
            {showScenarios.CP3 && (
              <>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Opera_mate_#1')}>Opera mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Opera_mate_#2')}>Opera mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Opera_mate_#3')}>Opera mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Anderssens_mate_#1')}>Anderssen's mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Anderssens_mate_#2')}>Anderssen's mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Anderssens_mate_#3')}>Anderssen's mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Dovetail_mate_#1')}>Dovetail mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Dovetail_mate_#2')}>Dovetail mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Dovetail_mate_#3')}>Dovetail mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Dovetail_mate_#4')}>Dovetail mate #4</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Cozios_mate_#1')}>Cozio's mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Swallows_mate_#1')}>Swallow's mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Swallows_mate_#2')}>Swallow's mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Epaulette_mate_#1')}>Epaulette mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Epaulette_mate_#2')}>Epaulette mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Epaulette_mate_#3')}>Epaulette mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Pawn_mate_#1')}>Pawn mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_III', 'Pawn_mate_#2')}>Pawn mate #2</button>
              </>
            )}

            {/* checkmate_pattern_IV Button and Scenarios */}
            <button onClick={handleCP4Click} className="lesson-piece-button_L checkmate_pattern_IV">checkmate_pattern_IV</button>
            {showScenarios.CP4 && (
              <>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Suffocation_mate_#1')}>Suffocation mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Suffocation_mate_#2')}>Suffocation mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Grecos_mate_#1')}>Greco's mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Grecos_mate_#2')}>Greco's mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Grecos_mate_#3')}>Greco's mate #3</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Max_Langes_mate_#1')}>Max Lange's mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Max_Langes_mate_#2')}>Max Lange's mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Blackburnes_mate_#1')}>Blackburne's mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Rétis_Mate_#1')}>Réti's Mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Légals_Mate_#1')}>Légal's Mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Kill_Box_Mate_#1')}>Kill Box Mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Triangle_Mate_#1')}>Triangle Mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Vukovic_Mate_#1')}>Vukovic Mate #1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Vukovic_Mate_#2')}>Vukovic Mate #2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_pattern_IV', 'Vukovic_Mate_#3')}>Vukovic Mate #3</button>
              </>
            )}

            {/* checkmate_II Button and Scenarios */}
            <button onClick={handleCM2Click} className="lesson-piece-button_L checkmate_II">checkmate_II</button>
            {showScenarios.CM2 && (
              <>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_II', 'Queen_vs_bishop_mate')}>Queen vs bishop mate</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_II', 'Queen_vs_knight_mate')}>Queen vs knight mate</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_II', 'Queen_vs_rook_mate')}>Queen vs rook mate</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_II', 'Two_bishop_mate')}>Two bishop mate</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_II', 'Knight_and_bishop_mate#1')}>Knight and bishop mate#1</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_II', 'Knight_and_bishop_mate#2')}>Knight and bishop mate#2</button>
                <button className="lesson-choice-buttons" onClick={() => setupScenario('checkmate_II', 'Two_knights_vs_pawn')}>Two knights vs pawn</button>
              </>
            )}
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

