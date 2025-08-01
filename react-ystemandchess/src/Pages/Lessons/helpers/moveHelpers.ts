type Board = (string | null)[][];

export function isInBounds(row: number, col: number) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

export function getPawnMoves(
  position: { split: any },
  isWhite: boolean,
  board: Board
) {
  if (!isWhite) return [];
  const [row, col] = position.split("-").map(Number);
  const direction = -1;
  const possibleMoves = [];

  if (
    isInBounds(row + direction, col) &&
    board[row + direction][col] === null
  ) {
    possibleMoves.push(`${row + direction}-${col}`);
    const startingRow = 6;
    if (
      row === startingRow &&
      isInBounds(row + 2 * direction, col) &&
      board[row + 2 * direction][col] === null
    ) {
      possibleMoves.push(`${row + 2 * direction}-${col}`);
    }
  }

  const captureMoves = [
    { row: row + direction, col: col - 1 },
    { row: row + direction, col: col + 1 },
  ];

  captureMoves.forEach(({ row, col }) => {
    if (isInBounds(row, col) && board[row][col] && board[row][col][0] !== "w") {
      possibleMoves.push(`${row}-${col}`);
    }
  });

  if (row === 0) {
    return possibleMoves.concat("promote");
  }

  return possibleMoves;
}

export function getRookMoves(
  position: { split: any },
  isWhite: boolean,
  board: Board
) {
  if (!isWhite) return [];
  const [row, col] = position.split("-").map(Number);
  const moves: string[] = [];
  const directions = [
    { r: 1, c: 0 },
    { r: -1, c: 0 },
    { r: 0, c: 1 },
    { r: 0, c: -1 },
  ];

  directions.forEach(({ r, c }) => {
    for (let i = 1; i < 8; i++) {
      const newRow = row + r * i;
      const newCol = col + c * i;
      if (!isInBounds(newRow, newCol)) break;
      if (!board[newRow][newCol]) {
        moves.push(`${newRow}-${newCol}`);
      } else {
        if (board[newRow][newCol][0] !== "w") {
          moves.push(`${newRow}-${newCol}`);
        }
        break;
      }
    }
  });

  return moves;
}

export function getKnightMoves(
  position: { split: any },
  isWhite: boolean,
  board: Board
) {
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

export function getBishopMoves(
  position: { split: any },
  isWhite: boolean,
  board: Board
) {
  if (!isWhite) return [];
  const [row, col] = position.split("-").map(Number);
  const moves: string[] = [];
  const directions = [
    { r: 1, c: 1 },
    { r: 1, c: -1 },
    { r: -1, c: 1 },
    { r: -1, c: -1 },
  ];

  directions.forEach(({ r, c }) => {
    for (let i = 1; i < 8; i++) {
      const newRow = row + r * i;
      const newCol = col + c * i;
      if (!isInBounds(newRow, newCol)) break;
      if (!board[newRow][newCol]) {
        moves.push(`${newRow}-${newCol}`);
      } else {
        if (board[newRow][newCol][0] !== "w") {
          moves.push(`${newRow}-${newCol}`);
        }
        break;
      }
    }
  });

  return moves;
}

export function getKingMoves(
  position: { split: any },
  isWhite: boolean,
  board: Board
) {
  if (!isWhite) return [];
  const [row, col] = position.split("-").map(Number);
  const moves = [];
  const kingMoves = [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
    [row - 1, col - 1],
    [row - 1, col + 1],
    [row + 1, col - 1],
    [row + 1, col + 1],
  ];

  for (const [r, c] of kingMoves) {
    if (isInBounds(r, c) && (!board[r][c] || board[r][c][0] !== "w")) {
      moves.push(`${r}-${c}`);
    }
  }

  return moves;
}

export function getQueenMoves(position: any, isWhite: boolean, board: Board) {
  if (!isWhite) return [];
  return [
    ...getRookMoves(position, isWhite, board),
    ...getBishopMoves(position, isWhite, board),
  ];
}
export function getPieceMoves(
  piece: string | any[],
  position: any,
  board: any[][]
) {
  const color = piece[0];
  switch (piece[1]) {
    case "P":
      return getPawnMoves(position, color === "w", board);
    case "R":
      return getRookMoves(position, color === "w", board);
    case "N":
      return getKnightMoves(position, color === "w", board);
    case "B":
      return getBishopMoves(position, color === "w", board);
    case "K":
      return getKingMoves(position, color === "w", board);
    case "Q":
      return getQueenMoves(position, color === "w", board);
    default:
      return [];
  }
}
