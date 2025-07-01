import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './Puzzles.css';

const Puzzles = ({ puzzlesService, chessService, environment }) => {
  const [chessSrc, setChessSrc] = useState(null);
  const [chess, setChess] = useState(null);
  const [activeState, setActiveState] = useState({
    PuzzleId: "YzaYa",
    FEN: "2kr3r/1pp2ppp/p1pb1n2/4q3/NPP1P3/P2P1P1P/5P2/R1BQ1RK1 w - - 1 16",
    Moves: "d3d4 e5h2",
    Rating: 910,
    RatingDeviation: 76,
    Popularity: 96,
    NbPlays: 128,
    Themes: "mate mateIn1 middlegame oneMove",
    GameUrl: "https://lichess.org/nPeulvcd#31"
  });
  const [moveList, setMoveList] = useState([]);
  const [themeList, setThemeList] = useState([]);
  const [playerMove, setPlayerMove] = useState([]);
  const [prevMove, setPrevMove] = useState([]);
  const [currentFen, setCurrentFen] = useState('');
  const [prevFen, setPrevFen] = useState('');
  const [dbIndex, setDbIndex] = useState(0);

  useEffect(() => {
    const chessInstance = new chessService('chessBoard', true);
    setChess(chessInstance);
    setChessSrc(environment.urls.chessClientURL);
    initPuzzleArray();
    shuffleArray(puzzlesService.puzzleArray);
    setActiveState(puzzlesService.puzzleArray[0]);
    setMoveList(puzzlesService.puzzleArray[0].Moves.split(" "));
    setThemeList(puzzlesService.puzzleArray[0].Themes.split(" "));
    updateInfoBox();

    const newPuzzleBtn = document.getElementById('newPuzzle');
    const openDialogBtn = document.getElementById('openDialog');
    const closeDialogBtn = document.getElementById('closeDialog');

    newPuzzleBtn.addEventListener('click', getNewPuzzle);
    openDialogBtn.addEventListener('click', openDialog);
    closeDialogBtn.addEventListener('click', closeDialog);

    window.addEventListener('message', handleMessage);

    return () => {
      newPuzzleBtn.removeEventListener('click', getNewPuzzle);
      openDialogBtn.removeEventListener('click', openDialog);
      closeDialogBtn.removeEventListener('click', closeDialog);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleMessage = (e) => {
    let info = e.data;
    if (info[0] === "{") {
      let jsonInfo = JSON.parse(info);
      if ("from" in jsonInfo && "to" in jsonInfo) {
        setPlayerMove([jsonInfo.from, jsonInfo.to]);
      }
    }
    if (info && typeof info !== "object") {
      if (isFen(info)) {
        setPrevFen(currentFen);
        setCurrentFen(info);
        var chessBoard = document.getElementById('chessBoard').contentWindow;
        chessBoard.postMessage(JSON.stringify({ boardState: info }), environment.urls.chessClientURL);
      }
      var activeColor = info.split(" ")[1];
      if (activeColor && activeColor !== activeState.FEN.split(" ")[1]) {
        handleComputerMove();
      }
    }
  };

  const handleComputerMove = () => {
    var move = getMove();
    if (move[0] !== playerMove[0] || move[1] !== playerMove[1]) {
      setMoveList([move[0] + move[1], ...moveList]);
      setCurrentFen(prevFen);
      var chessBoard = document.getElementById('chessBoard').contentWindow;
      chessBoard.postMessage(JSON.stringify({ boardState: prevFen }), environment.urls.chessClientURL);
      chessBoard.postMessage(JSON.stringify({ highlightFrom: prevMove[0], highlightTo: prevMove[1] }), environment.urls.chessClientURL);
    } else {
      if (moveList.length === 0) {
        Swal.fire('Puzzle completed', 'Good Job', 'success').then(() => {
          document.getElementById('newPuzzle').click();
        });
      } else {
        setPrevMove([move[0], move[1]]);
        setTimeout(() => {
          var chessBoard = document.getElementById('chessBoard').contentWindow;
          chessBoard.postMessage(JSON.stringify({ from: move[0], to: move[1] }), environment.urls.chessClientURL);
        }, 500);
      }
    }
  };

  const getMove = () => {
    var move = moveList.shift();
    var moveFrom = move.slice(0, 2);
    var moveTo = move.slice(2, 4);
    return [moveFrom, moveTo];
  };

  const openDialog = () => {
    var hintText = document.getElementById('hint-text');
    hintText.style.display = hintText.style.display === "block" ? "none" : "block";
  };

  const closeDialog = () => {
    const dialog = document.getElementById('myDialog');
    dialog.close();
  };

  const getNewPuzzle = () => {
    setDbIndex((dbIndex + 1) % puzzlesService.puzzleArray.length);
    setActiveState(puzzlesService.puzzleArray[dbIndex]);
    setMoveList(puzzlesService.puzzleArray[dbIndex].Moves.split(" "));
    setThemeList(puzzlesService.puzzleArray[dbIndex].Themes.split(" "));
    updateInfoBox();
  };

  const updateInfoBox = () => {
    var hints = "";
    themeList.forEach((theme, i) => {
      hints += `<b>${puzzlesService.themesName[theme]}</b>: \n${puzzlesService.themesDescription[theme]}${i !== themeList.length - 1 ? "\n\n" : ""}`;
    });
    document.getElementById("hint-text").innerHTML = hints;
  };

  const isFen = (fen) => {
    return fen.split("/").length === 8;
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  const initPuzzleArray = () => {
    fetch(`${environment.urls.middlewareURL}/puzzles/list`)
      .then(res => res.json())
      .then(data => {
        puzzlesService.puzzleArray = data;
        shuffleArray(puzzlesService.puzzleArray);
      });
  };

  return (
    <div className="container">
      <div id="mainElements">
        <iframe id="chessBoard" src={chessSrc}></iframe>

        <div id="hintMenu">
          <div className="dialog-container">
            <dialog id="myDialog">
              <h1>This is a place holder header</h1>
              <p>This is a dialog place holder text</p>
              <button id="closeDialog">Close</button>
            </dialog>
          </div>

          <button id="newPuzzle">Get New Puzzle</button>
          <button id="openDialog">Show Hint</button>
          <p id="hint-text" className="hint">Hints will show here</p>
        </div>
      </div>
    </div>
  );
};

export default Puzzles;
