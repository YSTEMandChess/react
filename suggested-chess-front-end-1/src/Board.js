import React, { useState } from 'react';
import Square from './Square';
import pieces from './Piece';
import './Board.css';

const initialBoard = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

const Board = () => {
  const [board, setBoard] = useState(initialBoard);

  const handleSquareClick = (row, col) => {
    // Add logic to handle piece movement
  };

  const renderSquare = (row, col, piece) => {
    const isBlack = (row + col) % 2 === 1;
    const color = isBlack ? 'black' : 'white';
    return (
      <Square
        key={`${row}-${col}`}
        color={color}
        piece={pieces[piece]}
        onClick={() => handleSquareClick(row, col)}
      />
    );
  };

  return (
    <div className="board">
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => renderSquare(rowIndex, colIndex, piece))
      )}
    </div>
  );
};

export default Board;
