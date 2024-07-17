import React from 'react';
import './ChessBoard.css';

const ChessBoard = () => {
  const renderSquare = (i, color) => {
    return (
      <div key={i} className={`square ${color}`} />
    );
  };

  const renderBoard = () => {
    const squares = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const isBlack = (i + j) % 2 === 1;
        squares.push(renderSquare(i * 8 + j, isBlack ? 'black' : 'white'));
      }
    }
    return squares;
  };

  return (
    <div className="chess-board">
      {renderBoard()}
    </div>
  );
};

export default ChessBoard;
