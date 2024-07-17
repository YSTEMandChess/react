import React from 'react';
import './Square.css';

const Square = ({ color, piece, onClick }) => {
  return (
    <div className={`square ${color}`} onClick={onClick}>
      {piece && <img src={piece} alt="" className="piece" />}
    </div>
  );
};

export default Square;
