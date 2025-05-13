import "./Lessons.scss";
import React, { useState, useEffect, useRef } from 'react';
import { ReactComponent as RedoIcon } from './icon_redo.svg';
import { ReactComponent as BackIcon} from './icon_back.svg';
import { ReactComponent as NextIcon } from './icon_next.svg';
import { getScenario } from "./Scenarios";

const Lessons = () => {
  const [board, setBoard] = useState(initializeBoard()); // Initialize the board with chess pieces
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [draggingPiece, setDraggingPiece] = useState(null); // Track which piece is being dragged

  // Description for each Scenarios
  const [scenario, setScenario] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("Try this!");
  const [pieceDescription, setpieceDescription] = useState("Pawn");

  const initBoardRef = useRef(null); // Original board for current training lesson in order to restry
  const counterRef = useRef(0); // Counter for updating different scenarios

  // State for showing scenario buttons for pieces
  const [showScenarios, setShowScenarios] = useState({
    pawn: true,
    rook: false,
    bishop: false,
    knight: false,
    queen: false,
    king: false,
    CM1: false
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
      setLessonTitle("");
      setLessonDescription("");
      setpieceDescription("Choose a lesson!");
    }
  };

  // Check for black pieces every time the board state changes
  useEffect(() => {
    checkBlackPieces();
  }, [board]);

  // Set up the board for different scenarios
  const setupScenario = (piece, scenario) => {
    const updatedBoard = initializeBoard(); // Reset board

    // setup the board by scenario
    switch (piece) {
      case 'pawn':
        setpieceDescription("Pawn")
        switch (scenario) {
          case 'basic':
            updatedBoard[4][0] = 'wP'; // a5
            updatedBoard[5][5] = 'bP'; // f3
            setLessonTitle("Basic")
            setLessonDescription("White pawn moves one square only. But when they reach the other side of the board, they become a stronger piece!");
            setTrainingStarted(true); // Mark training as started
            break;
          case 'capture':
            updatedBoard[5][4] = 'wP'; // e3
            updatedBoard[3][3] = 'bP'; // d5
            updatedBoard[2][2] = 'bP'; // c6
            updatedBoard[1][3] = 'bP'; // d7
            setLessonTitle("Capture")
            setLessonDescription("A pawn on the second rank can move 2 squares at once!");
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
            setLessonTitle("Training 1")
            setLessonDescription("Capture black pawns and promote!");
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
            setLessonTitle("Training 2")
            setLessonDescription("Capture black pawns and promote!");
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
            setLessonTitle("Training 3")
            setLessonDescription("No need to promote. Capture all black pawns.");
            setTrainingStarted(true); // Mark training as started
            break;
          case 'special_move':
            updatedBoard[6][4] = 'wP'; // e2
            updatedBoard[2][3] = 'bP'; // d6
            setLessonTitle("Special Move")
            setLessonDescription("A pawn on the second rank can move two squares forward.");
            setTrainingStarted(true); // Mark training as started
            break;
          default:
            break;
        }
        break;
      case 'rook':
        setpieceDescription("Rook")
        switch (scenario) {
          case 'basic':
            updatedBoard[6][4] = 'wR'; // e2
            updatedBoard[2][4] = 'bP'; // e6
            setLessonTitle("Basic")
            setLessonDescription("Click on the rook to bring it to the pawn!");
            setTrainingStarted(true);
            break;
          case 'training_1':
            updatedBoard[1][2] = 'wR'; // c7
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[3][5] = 'bP'; // f5
            setLessonTitle("Training 1")
            setLessonDescription("Grab all the pawns!");
            setTrainingStarted(true);
            break;
          case 'training_2':
            updatedBoard[5][4] = 'wR'; // e3
            updatedBoard[5][1] = 'bP'; // b3
            updatedBoard[6][7] = 'bP'; // h2
            updatedBoard[5][7] = 'bP'; // h3
            setLessonTitle("Training 2")
            setLessonDescription("The fewer moves you make, the better!");
            setTrainingStarted(true);
            break;
          case 'training_3':
            updatedBoard[0][7] = 'wR'; // h8
            updatedBoard[0][5] = 'bP'; // f8
            updatedBoard[7][6] = 'bP'; // g1
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[0][6] = 'bP'; // g8
            updatedBoard[1][7] = 'bP'; // h7
            setLessonTitle("Training 3")
            setLessonDescription("The fewer moves you make, the better!");
            setTrainingStarted(true);
            break;
          case 'training_4':
            updatedBoard[1][2] = 'wR'; // c7
            updatedBoard[4][4] = 'wR'; // e4
            updatedBoard[4][0] = 'bP'; // a4
            updatedBoard[5][6] = 'bP'; // g3
            updatedBoard[1][6] = 'bP'; // g7
            updatedBoard[4][7] = 'bP'; // h4
            setLessonTitle("Training 4")
            setLessonDescription("Use two rooks to speed things up!");
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
            setLessonTitle("Final")
            setLessonDescription("Use two rooks to speed things up!");
            setTrainingStarted(true);
            break;

          default:
            break;
        }
        break;
      case "bishop":
        setpieceDescription("Bishop");
        switch (scenario) {
          case 'basic':
            updatedBoard[6][6] = 'wB'; // g2
            updatedBoard[1][7] = 'bP'; // h7
            updatedBoard[4][4] = 'bP'; // e4
            setLessonTitle("Basic")
            setLessonDescription("Grab all the black pawns!");
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
            setLessonTitle("Training 1")
            setLessonDescription("The fewer moves you make, the better!");
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
            setLessonTitle("Training 2")
            setLessonDescription("Grab all the black pawns!");
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
            setLessonTitle("Training 3")
            setLessonDescription("One light-squared bishop, one dark-squared bishop. You need both!");
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
            setLessonTitle("Training 4")
            setLessonDescription("Grab all the black pawns!");
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
            setLessonTitle("Training 5")
            setLessonDescription("One light-squared bishop, one dark-squared bishop. You need both!");
            setTrainingStarted(true);
            break;
          default:
            break;
        }
        break;

      case 'knight':
        setpieceDescription("Knight");
        switch (scenario) {
          case 'basic':
            updatedBoard[4][4] = 'wN'; // e4
            updatedBoard[3][2] = 'bP'; // c5
            updatedBoard[1][3] = 'bP'; // d7
            setLessonTitle("Basic")
            setLessonDescription("Knights have a fancy way of jumping around!");
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
            setLessonTitle("Training 1")
            setLessonDescription("Grab all the pawns!");
            setTrainingStarted(true);
            break;

          case 'training_2':
            updatedBoard[1][2] = 'wN'; // c7
            updatedBoard[2][1] = 'bP'; // b6
            updatedBoard[3][3] = 'bP'; // d5
            updatedBoard[1][3] = 'bP'; // d7
            updatedBoard[2][4] = 'bP'; // e6
            updatedBoard[4][5] = 'bP'; // f4
            setLessonTitle("Training 2")
            setLessonDescription("Grab all the pawns!");
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
            setLessonTitle("Training 3")
            setLessonDescription("Knights can jump over obstacles! Escape and vanquish the pawns!");
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
            setLessonTitle("Training 4")
            setLessonDescription("Grab all the pawns!");
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
            setLessonTitle("Final")
            setLessonDescription("Grab all the pawns!");
            setTrainingStarted(true);
            break;

        }
        break;

      case 'queen':
        setpieceDescription("Queen");
        switch (scenario) {
          case 'basic':
            updatedBoard[6][4] = 'wQ'; // e2
            updatedBoard[1][2] = 'bP'; // c7
            updatedBoard[3][4] = 'bP'; // e5
            setLessonTitle("Basic")
            setLessonDescription("Grab all the pawns!");
            setTrainingStarted(true);
            break;
          case 'training_1':
            updatedBoard[4][3] = 'wQ'; // d4
            updatedBoard[5][0] = 'bP'; // a3
            updatedBoard[6][5] = 'bP'; // f2
            updatedBoard[0][5] = 'bP'; // f8
            updatedBoard[5][7] = 'bP'; // h3
            setLessonTitle("Training 1")
            setLessonDescription("Grab all the pawns!");
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
            setLessonTitle("Training 2")
            setLessonDescription("Grab all the pawns!");
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
            setLessonTitle("Training 3")
            setLessonDescription("Grab all the pawns!");
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
            setLessonTitle("Final")
            setLessonDescription("Grab all the pawns!");
            setTrainingStarted(true);
            break;

          default:
            break;
        }
        break;

      case 'king':
        setpieceDescription("King - The most important piece");
        switch (scenario) {
          case 'basic':
            updatedBoard[6][3] = 'wK'; // d2
            updatedBoard[2][3] = 'bP'; // d6
            setLessonTitle("Basic")
            setLessonDescription("The king is slow.");
            setTrainingStarted(true);
            break;
          case 'training':
            updatedBoard[7][4] = 'wK'; // e1
            updatedBoard[6][2] = 'bP'; // c2
            updatedBoard[5][3] = 'bP'; // d3
            updatedBoard[6][4] = 'bP'; // e2
            setLessonTitle("Training")
            setLessonDescription("Grab all the pawns!");
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
            setLessonTitle("Final")
            setLessonDescription("Grab all the pawns!");
            setTrainingStarted(true);
            break;

          default:
            break;
        }
        break;

      case 'CM1':
        setpieceDescription("Basic checkmates");

        switch (scenario) {
          case 'qr_mate':
            updatedBoard[7][0] = 'wQ'; // a1
            updatedBoard[5][4] = 'wK'; // e3
            updatedBoard[7][7] = 'wR'; // h1
            updatedBoard[2][3] = 'bK'; // d6
            setLessonTitle("Queen and rook mate")
            setLessonDescription("Use your queen and rook to restrict the king and deliver checkmate. Mate in 3 if played perfectly.");
            setTrainingStarted(true);
            break;

          case 'rr_mate':
            updatedBoard[7][0] = 'wR'; // a1
            updatedBoard[7][7] = 'wR'; // h1
            updatedBoard[5][4] = 'wK'; // e3
            updatedBoard[2][3] = 'bK'; // d6
            setLessonTitle("Two-rook mate")
            setLessonDescription("Use your rooks to restrict the king and deliver checkmate. Mate in 4 if played perfectly.");
            setTrainingStarted(true);
            break;

          case 'qb_mate':
            updatedBoard[5][2] = 'wQ'; // c3
            updatedBoard[5][3] = 'wB'; // d3
            updatedBoard[5][4] = 'wK'; // e3
            updatedBoard[2][3] = 'bK'; // d6
            setLessonTitle("Queen and bishop mate")
            setLessonDescription("Use your queen and bishop to restrict the king and deliver checkmate. Mate in 5 if played perfectly.");
            setTrainingStarted(true);
            break;

          case 'qk_mate':
            updatedBoard[5][2] = 'wQ'; // c3
            updatedBoard[5][3] = 'wN'; // d3
            updatedBoard[5][4] = 'wK'; // e3
            updatedBoard[2][3] = 'bK'; // d6
            setLessonTitle("Queen and knight mate")
            setLessonDescription("Use your queen and knight to restrict the king and deliver checkmate. Mate in 5 if played perfectly.");
            setTrainingStarted(true);
            break;

          case 'q_mate':
            updatedBoard[7][4] = 'wQ'; // e1
            updatedBoard[5][4] = 'wK'; // e3
            updatedBoard[2][3] = 'bK'; // d6
            setLessonTitle("Queen mate")
            setLessonDescription("Use your queen to restrict the king, force it to the edge of the board and deliver checkmate. The queen can't do it alone, so use your king to help. Mate in 6 if played perfectly.");
            setTrainingStarted(true);
            break;

          case 'r_mate':
            updatedBoard[7][4] = 'wR'; // e1
            updatedBoard[5][4] = 'wK'; // e3
            updatedBoard[2][3] = 'bK'; // d6
            setLessonTitle("Rook mate")
            setLessonDescription("Use your rook to restrict the king, force it to the edge of the board and deliver checkmate. The rook can't do it alone, so use your king to help. Mate in 11 if played perfectly.");
            setTrainingStarted(true);
            break;

          default:
            console.error("Scenario not found.");
            break;
        }
        break;


      default:
        break;
    }
    setBoard(updatedBoard);
    initBoardRef.current = JSON.parse(JSON.stringify(updatedBoard));
    setHighlightedSquares([]); // clear highlight
  };

  // Going back and forth between different scenarios, x: -1 or 1
  const rotateScenario = (x) => {
    const keys = Object.keys(showScenarios);
    const currentIndex = keys.findIndex(key => showScenarios[key]);
    console.log(currentIndex)
    const nextIndex = (currentIndex + x + keys.length) % keys.length;

    const newState = {};
    keys.forEach((key, index) => {
      newState[key] = index === nextIndex;
    });

    setTrainingStarted(false);
    setShowScenarios(newState);
    setLessonTitle("");
    setLessonDescription("Try this!");
    setBoard(initializeBoard());

    switch (Object.keys(showScenarios)[nextIndex]) {
      case 'pawn':
        setpieceDescription("Pawn");
        break;
      case 'rook':
        setpieceDescription("Rook");
        break;
      case 'bishop':
        setpieceDescription("Bishop");
        break;
      case 'knight':
        setpieceDescription("Knight");
        break;
      case 'queen':
        setpieceDescription("Queen");
        break;
      case 'king':
        setpieceDescription("King");
        break;
      case 'CM1':
        setpieceDescription("Basic checkmates");
        break;
      default:
        setpieceDescription("");
    }
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
    if (initBoardRef.current) {
      setBoard(JSON.parse(JSON.stringify(initBoardRef.current)))
    }
    console.log(getScenario(1))
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
            <h1 className="piece_description">{pieceDescription}</h1>
            <button className='reset-lesson' onClick={resetBoard}>
              <RedoIcon/>
            </button>
          </div>

          <h1 className='subheading'>{lesson.name}</h1>
          <p className="lesson-description">{lesson.info}</p>

          <div className='prev-next-button-container'>
            <button className="prevNextLessonButton prev" onClick={() => rotateScenario(-1)}>
              <BackIcon/>
              <p className="button-description">Back</p>
            </button>
            <button className="prevNextLessonButton next" onClick={() => rotateScenario(1)}>
              <p className="button-description">Next</p>
              <NextIcon/>
            </button>
          </div>
        </div>

      </div>
      <div>
        <div className="lesson-buttons-container">
            {/* Pawn Button and Scenarios */}
            {/* <button onClick={handlePawnClick} className="lesson-piece-button_L basic">Basic</button> */}
            {/* Bishop Button and Scenarios */}
            {/* <button onClick={handleBishopClick} className="lesson-piece-button_L bishop">Capture</button> */}
            {/* Knight Button and Scenarios */}
            {/* <button onClick={handleKnightClick} className="lesson-piece-button_L knight">Training 1</button> */}
            {/* Rook Button and Scenarios */}
            {/* <button onClick={handleRookClick} className="lesson-piece-button_L rook">Training 2</button> */}
            {/* Queen Button and Scenarios */}
            {/* <button onClick={handleQueenClick} className="lesson-piece-button_L queen">Training 3</button> */}
            {/* King Button and Scenarios */}
            {/* <button onClick={handleKingClick} className="choice-buttons">Special Move</button> */}

            {showScenarios.pawn && (
                <>
                  <button className="lesson-buttons" onClick={() => setupScenario('pawn', 'basic')}>Basic</button>
                  <button className="lesson-buttons" onClick={() => setupScenario('pawn', 'capture')}>Capture</button>
                  <button className="lesson-buttons" onClick={() => setupScenario('pawn', 'training_1')}>Training 1</button>
                  <button className="lesson-buttons" onClick={() => setupScenario('pawn', 'training_2')}>Training 2</button>
                  <button className="lesson-buttons" onClick={() => setupScenario('pawn', 'training_3')}>Training 3</button>
                  <button className="lesson-buttons" onClick={() => setupScenario('pawn', 'special_move')}>Special Move</button>
                </>
              )}
            
            {showScenarios.bishop && (
              <>
                <button className="lesson-buttons" onClick={() => setupScenario('bishop', 'basic')}>Basic</button>
                <button className="lesson-buttons" onClick={() => setupScenario('bishop', 'training_1')}>Training 1</button>
                <button className="lesson-buttons" onClick={() => setupScenario('bishop', 'training_2')}>Training 2</button>
                <button className="lesson-buttons" onClick={() => setupScenario('bishop', 'training_3')}>Training 3</button>
                <button className="lesson-buttons" onClick={() => setupScenario('bishop', 'training_4')}>Training 4</button>
                <button className="lesson-buttons" onClick={() => setupScenario('bishop', 'final')}>Final</button>
              </>
            )}

            {showScenarios.knight && (
              <>
                <button className="lesson-buttons" onClick={() => setupScenario('knight', 'basic')}>The Basic</button>
                <button className="lesson-buttons" onClick={() => setupScenario('knight', 'training_1')}>Training 1</button>
                <button className="lesson-buttons" onClick={() => setupScenario('knight', 'training_2')}>Training 2</button>
                <button className="lesson-buttons" onClick={() => setupScenario('knight', 'training_3')}>Training 3</button>
                <button className="lesson-buttons" onClick={() => setupScenario('knight', 'training_4')}>Training 4</button>
                <button className="lesson-buttons" onClick={() => setupScenario('knight', 'final')}>Final</button>
              </>
            )}

            {showScenarios.rook && (
              <>
                <button className="lesson-buttons" onClick={() => setupScenario('rook', 'basic')}>The Basic</button>
                <button className="lesson-buttons" onClick={() => setupScenario('rook', 'training_1')}>Training 1</button>
                <button className="lesson-buttons" onClick={() => setupScenario('rook', 'training_2')}>Training 2</button>
                <button className="lesson-buttons" onClick={() => setupScenario('rook', 'training_3')}>Training 3</button>
                <button className="lesson-buttons" onClick={() => setupScenario('rook', 'training_4')}>Training 4</button>
                <button className="lesson-buttons" onClick={() => setupScenario('rook', 'final')}>Final</button>
              </>
            )}

            {showScenarios.queen && (
              <>
                <button className="lesson-buttons" onClick={() => setupScenario('queen', 'basic')}>The Basic</button>
                <button className="lesson-buttons" onClick={() => setupScenario('queen', 'training_1')}>Training 1</button>
                <button className="lesson-buttons" onClick={() => setupScenario('queen', 'training_2')}>Training 2</button>
                <button className="lesson-buttons" onClick={() => setupScenario('queen', 'training_3')}>Training 3</button>
                <button className="lesson-buttons" onClick={() => setupScenario('queen', 'final')}>Final</button>
              </>
            )}

            {showScenarios.king && (
            <>
              <button className="lesson-buttons" onClick={() => setupScenario('king', 'basic')}>The Basic</button>
              <button className="lesson-buttons" onClick={() => setupScenario('king', 'training')}>Training</button>
              <button className="lesson-buttons" onClick={() => setupScenario('king', 'final')}>Final</button>
            </>
            )}

            {showScenarios.CM1 && (
            <>
              <button className="lesson-buttons" onClick={() => setupScenario('CM1', 'qr_mate')}>Queen-rook</button>
              <button className="lesson-buttons" onClick={() => setupScenario('CM1', 'rr_mate')}>Two-rook</button>
              <button className="lesson-buttons" onClick={() => setupScenario('CM1', 'qb_mate')}>Queen-bishop</button>
              <button className="lesson-buttons" onClick={() => setupScenario('CM1', 'qk_mate')}>Queen-knight</button>
              <button className="lesson-buttons" onClick={() => setupScenario('CM1', 'q_mate')}>Queen</button>
              <button className="lesson-buttons" onClick={() => setupScenario('CM1', 'r_mate')}>Rook</button>
            </>
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

