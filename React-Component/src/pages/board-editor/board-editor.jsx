import React, { useEffect, useState } from 'react';
import Header from '../../Header/Header';
import Footer from '../../Footer/Footer';
//import './BoardEditor.css';
import Chessboard from 'chessboardjsx'; // Assuming you're using chessboardjsx

const BoardEditor = () => {
  const [board, setBoard] = useState(null);
  const [longFen, setLongFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [useAnimation, setUseAnimation] = useState(false);

  useEffect(() => {
    const config = {
      pieceTheme: '/assets/images/chessPieces/wikipedia/{piece}.png',
      draggable: true,
      dropOffBoard: 'trash',
      sparePieces: true,
      position: 'start',
      onChange: onChange,
    };

    const boardInstance = Chessboard('board', config);
    setBoard(boardInstance);

    const handleResize = () => boardInstance.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const onChange = (oldPos, newPos) => {
    const fen = Chessboard.objToFen(newPos);
    setLongFen(fen + " w KQkq - 0 1");
  };

  const flipBoard = () => {
    board.flip();
  };

  const clearBoard = () => {
    board.clear(useAnimation);
    setLongFen("8/8/8/8/8/8/8/8 w KQkq - 0 1");
  };

  const startPosition = () => {
    board.start(useAnimation);
    setLongFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  };

  const onFenChange = (e) => {
    const newFen = e.target.value;
    setLongFen(newFen);
    board.position(newFen);
  };

  return (
    <>
      <Header />
      <div id="board-editor-container">
        <div id="board-fen-container">
          <div id="board"></div>
          <div id="fen-container">
            <label htmlFor="fen">FEN</label>
            <input
              type="text"
              name="fen"
              id="fen"
              value={longFen}
              onChange={onFenChange}
            />
          </div>
        </div>
        <div id="bottom">
          <button type="button" id="flip-board" onClick={flipBoard}>Flip Board</button>
          <button type="button" id="clear-board" onClick={clearBoard}>Clear Board</button>
          <button type="button" id="start-position" onClick={startPosition}>Start Position</button>
          <button type="button" id="analyze-position">
            <a href={`/board-analyzer?fen=${longFen}`}>Analyze Position</a>
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BoardEditor;
