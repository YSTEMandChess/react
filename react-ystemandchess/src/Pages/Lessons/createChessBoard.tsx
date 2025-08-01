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
          onMouseLeave={() => setHighlightedSquares([])} // Clear highlights when mouse leaves
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
