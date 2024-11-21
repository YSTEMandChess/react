import React from 'react';
import { useCookies } from 'react-cookie';
import { Link } from 'react-router-dom';
import './Lessons.css';

const Lessons = () => {
  const [cookies, setCookie, removeCookie] = useCookies(['piece']);

  const assignPiece = (pieceName) => {
    setCookie('piece', pieceName);
  };

  return (
    <>
      <div id="lessons">
        <div id="pawn-lessons" onClick={() => assignPiece('pawn')}>
          <Link to="/piece-lessons">
            <p>Pawn</p>
          </Link>
        </div>

        <div id="rook-lessons" onClick={() => assignPiece('rook')}>
          <Link to="/piece-lessons">
            <p>Rook</p>
          </Link>
        </div>

        <div id="bishop-lessons" onClick={() => assignPiece('bishop')}>
          <Link to="/piece-lessons">
            <p>Bishop</p>
          </Link>
        </div>

        <div id="horse-lessons" onClick={() => assignPiece('horse')}>
          <Link to="/piece-lessons">
            <p>Horse</p>
          </Link>
        </div>

        <div id="queen-lessons" onClick={() => assignPiece('queen')}>
          <Link to="/piece-lessons">
            <p>Queen</p>
          </Link>
        </div>

        <div id="king-lessons" onClick={() => assignPiece('king')}>
          <Link to="/piece-lessons">
            <p>King</p>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Lessons;
