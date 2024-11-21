import React, { useEffect, useState } from 'react';
import Header from '../../Header/Header';
import Footer from '../../Footer/Footer';
//import './BoardAnalyzer.css';
import Chess from '../../models/chess';  // Adjust the path based on where `chess.js` is located
import Chessboard from 'chessboardjsx';  // Assuming you're using chessboardjsx

const BoardAnalyzer = () => {
  const [board, setBoard] = useState(null);
  const [chess] = useState(new Chess());
  const [level, setLevel] = useState(10);
  const [currFen, setCurrFen] = useState(chess.fen());
  const [centipawn, setCentipawn] = useState("0");
  const [principleVariation, setPrincipleVariation] = useState([]);
  const [plies, setPlies] = useState([]);
  const [currMove, setCurrMove] = useState(null);

  useEffect(() => {
    // Initialize Chessboard
    const boardConfig = {
      draggable: true,
      position: currFen,
      onDrop: onDrop,
      onSnapEnd: onSnapEnd,
      pieceTheme: '/assets/images/chessPieces/wikipedia/{piece}.png',
    };
    const boardInstance = Chessboard('board', boardConfig);
    setBoard(boardInstance);
    updateEngineEvaluation();

    // Cleanup on unmount
    return () => {
      boardInstance.destroy();
    };
  }, []);

  const updateEngineEvaluation = () => {
    const url = `${process.env.REACT_APP_STOCKFISH_URL}/?info=true&level=${level}&fen=${chess.fen()}`;
    fetch(url, { method: 'POST' })
      .then((response) => response.text())
      .then((data) => {
        parseStockfish(data);
      });
  };

  const parseStockfish = (response) => {
    const res = JSON.parse(response);
    const split = res[res.length - 2].split(" ");
    let color = "";
    const pvIndex = split.indexOf("pv");

    if (split.includes("mate")) {
      const turnsTillMate = parseInt(split[split.indexOf("mate") + 1]) * (chess.turn() === "b" ? -1 : 1);
      color = turnsTillMate < 0 ? "b" : "w";
      setCentipawn(turnsTillMate === 0 ? "-" : `#${Math.abs(turnsTillMate)}`);
    } else {
      let value = parseInt(split[split.indexOf("cp") + 1]) / 100;
      value *= chess.turn() === "b" ? -1 : 1;
      const sign = value < 0 ? "" : "+";
      setCentipawn(`${sign}${value}`);
    }

    setPrincipleVariation(split.slice(pvIndex + 1, split.length - 2));
    updateCentiPawnEval(color);
  };

  const updateCentiPawnEval = (color) => {
    document.getElementById("centipawn-value").innerText = centipawn;

    const maxCpRange = 20;
    const maxBarRange = 95;
    const CpToHeightRatio = maxBarRange / maxCpRange;
    const evalBar = document.getElementById("centipawn-inner");

    if (centipawn.startsWith("#")) {
      evalBar.style.height = color === "b" ? "0%" : "100%";
    } else {
      const height = Math.min(Math.max(50 + parseFloat(centipawn) * CpToHeightRatio, 100 - maxBarRange), 100);
      evalBar.style.height = `${height}%`;
    }

    let formatPV = "";
    let i = 0;
    let j = 1;

    if (chess.turn() === "b") {
      formatPV = `1... ${principleVariation[0]} `;
      i = 1;
      j = 2;
    }

    for (; i < principleVariation.length; i += 2) {
      formatPV += `${j}. ${principleVariation[i]} `;
      if (i + 1 < principleVariation.length) {
        formatPV += `${principleVariation[i + 1]} `;
      }
      j++;
    }

    document.getElementById("principle-variation").innerText = formatPV;
  };

  const onDrop = (source, target) => {
    const move = chess.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';

    setCurrFen(chess.fen());
    updateMoveList(move);
    updateEngineEvaluation();

    const moveAudioSrc = "/assets/audio/move.ogg";
    const captureAudioSrc = "/assets/audio/capture.ogg";
    const slideAudioSrc = "/assets/audio/slider.ogg";

    if (move.captured || chess.in_check()) {
      playAudio(captureAudioSrc);
    } else if (move.san === "O-O" || move.san === "O-O-O") {
      playAudio(slideAudioSrc);
    } else {
      playAudio(moveAudioSrc);
    }
  };

  const onSnapEnd = () => {
    board.position(chess.fen());
  };

  const playAudio = (src) => {
    const audio = new Audio(src);
    audio.play();
  };

  const updateMoveList = (move) => {
    const moveObj = {
      move: move.san,
      indexes: !currMove ? { pIndex: 0, mIndex: 0 } : getNextMoveIndex(currMove.indexes),
      fen: chess.fen(),
    };

    let updatedPlies = [...plies];
    if (!updatedPlies.length || updatedPlies[updatedPlies.length - 1].length >= 2) {
      updatedPlies.push([moveObj]);
    } else {
      updatedPlies[updatedPlies.length - 1].push(moveObj);
    }

    setPlies(updatedPlies);
    setCurrMove(moveObj);
  };

  const getNextMoveIndex = (indexes) => {
    const { pIndex, mIndex } = indexes;
    return { pIndex: mIndex === 0 ? pIndex : pIndex + 1, mIndex: mIndex === 0 ? 1 : 0 };
  };

  const onFenChange = (e) => {
    const newFen = e.target.value;
    setCurrFen(newFen);
    chess.load(newFen);
    board.position(newFen);
    setPlies([]);
    setCurrMove(null);
  };

  return (
    <>
      <Header />
      <div id="board-analyzer-container">
        <div id="board-fen-container">
          <div id="board-evaluator-container">
            <div id="centipawn-outer">
              <div id="centipawn-inner"></div>
            </div>
            <div id="board"></div>
          </div>
          <div id="fen-container">
            <label htmlFor="fen">FEN</label>
            <input type="text" name="fen" id="fen" value={currFen} onChange={onFenChange} />
          </div>
        </div>
        <div id="sidebar">
          <div id="tools">
            <div id="options">
              <div id="centipawn-value"></div>
              <div id="depth-container">
                <label htmlFor="depth-value" id="depth-label">Depth</label>
                <input type="number" name="depth-value" id="depth-value" min="10" max="20" value={level} onChange={(e) => setLevel(parseInt(e.target.value, 10))} />
              </div>
            </div>
            <div id="principle-variation"></div>
            <div id="move-list">
              {plies.map((ply, i) => (
                <div className="ply" key={i}>
                  <span>{i + 1}.</span>
                  {ply.map((move, j) => (
                    <span key={j} onClick={() => setMove(move)} className={`move ${move === currMove ? 'selected' : ''}`} id={`move-${i}-${j}`}>
                      {move.move}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div id="controls">
            <button onClick={flipBoard} className="control" id="flip-board">Flip</button>
            <button onClick={startPosition} className="control" id="first">{"<<"}</button>
            <button onClick={prevPosition} className="control" id="prev">{"<"}</button>
            <button onClick={nextPosition} className="control" id="next">{">"}</button>
            <button onClick={lastPosition} className="control" id="last">{">>"}</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BoardAnalyzer;
