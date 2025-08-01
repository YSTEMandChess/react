import { useLessonContext } from "../context/LessonContext";
import { getPieceMoves } from "../helpers/moveHelpers";

export function useChessboardInteractions() {
  const {
    board,
    setBoard,
    highlightedSquares,
    setHighlightedSquares,
    draggingPiece,
    setDraggingPiece,
    setIsPromoting,
    setPromotionPosition,
    lesson,
    setLessonEnded,
  } = useLessonContext();

  // Handle hover to show possible moves
  const handleSquareHover = (key: any) => {
    const [row, col] = key.split("-").map(Number);
    const piece = board[row][col];
    setHighlightedSquares([]);
    if (piece) {
      const possibleMoves = getPieceMoves(piece, key, board);
      setHighlightedSquares(possibleMoves);
    } else {
      const targetPiece = board[row][col];
      if (
        targetPiece &&
        draggingPiece?.piece &&
        targetPiece[0] !== draggingPiece.piece.color
      ) {
        setHighlightedSquares((prev) => [...prev, key]);
      }
    }
  };

  // Handle drag start
  const handleDragStart = (e: any, piece: any, position: any) => {
    setDraggingPiece({ piece, position });
    e.dataTransfer.setDragImage(e.target, 20, 20);
  };

  // Handle drop on a square
  const handleDrop = (key: any) => {
    if (highlightedSquares.includes(key)) {
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
        // Piece captured
      }

      const updatedBoard: any = [...board];
      updatedBoard[endRow][endCol] = draggingPiece ? draggingPiece.piece : "";
      updatedBoard[startRow][startCol] = null;

      // Pawn promotion
      if (
        (draggingPiece.piece === "wP" && endRow === 0) ||
        (draggingPiece.piece === "bP" && endRow === 7)
      ) {
        setPromotionPosition(key);
        setIsPromoting(true);
      } else {
        setBoard(updatedBoard);
      }
    }
    setDraggingPiece(null);
    setHighlightedSquares([]);
  };

  // Handle drag over a square (allow dropping)
  const handleDragOver = (e: any) => {
    e.preventDefault();
  };

  // Promote pawn
  const promotePawn = (position: any, piece: string) => {
    const [row, col] = position.split("-").map(Number);
    const updatedBoard = [...board];
    const color = board[row][col] !== null ? board[row][col]![0] : "";
    const newPiece = color === "w" ? `w${piece}` : `b${piece}`;
    updatedBoard[row][col] = newPiece;
    setBoard(updatedBoard);
    setIsPromoting(false);
  };

  // Reset board to lesson start
  const resetBoard = () => {
    if (lesson) {
      setLessonEnded(false);
      setBoard(JSON.parse(JSON.stringify(lesson.board)));
    }
  };

  return {
    getPieceMoves,
    handleSquareHover,
    handleDragStart,
    handleDrop,
    handleDragOver,
    promotePawn,
    resetBoard,
  };
}
