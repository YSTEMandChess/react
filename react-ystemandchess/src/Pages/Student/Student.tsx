import React, { useState } from "react";
import "./Student.scss";
import { environment } from "../../environments/environment";

const Student = () => {
  const chessSrc = environment.urls.chessClientURL;
  const [movesAhead, setMovesAhead] = useState(5);

  return (
    <div className="chess-body">
      <br />
      <br />
      <br />
      <iframe src={chessSrc} title="Chessboard" height="500" width="500" />
      <br />
      <br />
      <br />
      <button>New Game</button>
      <button>Play with a computer</button>
      <button>Undo</button>
      <br />
      <p>
        The computer will think
        <input type="number" min="1" step="1" max="30" value={movesAhead} />
        moves ahead of you
      </p>
      <br />
    </div>
  );
};

export default Student;
