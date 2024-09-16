import React, { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import Header from '../../Header/Header';
import Footer from '../../Footer/Footer';
import './PlayNolog.css';

const PlayNolog = () => {
  const [messageQueue, setMessageQueue] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [color, setColor] = useState('white');
  const [level, setLevel] = useState(5);
  const [chessSrc, setChessSrc] = useState('');
  const [isStepLast, setIsStepLast] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [move, setMove] = useState('');
  const [displayMoves, setDisplayMoves] = useState([]);
  const [pieceImage, setPieceImage] = useState('');
  const [newGameId, setNewGameId] = useState('');
  const [FEN, setFEN] = useState('');
  const [gameOverMsg, setGameOverMsg] = useState(false);
  const [undoAfterGameOver, setUndoAfterGameOver] = useState(false);
  const [currentFEN, setCurrentFEN] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const prevFEN = useRef(currentFEN);

  const scrollFrame = useRef(null);

  useEffect(() => {
    // Set the chess board source
    setChessSrc('YOUR_CHESS_CLIENT_URL');

    // Event listener for receiving messages from the chess iframe
    window.addEventListener('message', handleMessage);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleMessage = (e) => {
    if (e.origin === 'YOUR_CHESS_CLIENT_URL') {
      prevFEN.current = currentFEN;
      const activeColor = prevFEN.current.split(' ')[1];
      const info = e.data;
      const temp = info.split(':');
      const piece = info.split('-');

      if (info === 'ReadyToRecieve') {
        setIsReady(true);
        sendFromQueue();
      } else if (info === 'checkmate' || info === 'draw' || info === 'gameOver') {
        if (activeColor === 'w') setGameOverMsg(true);
        setUndoAfterGameOver(true);
        gameOverAlert();
      } else if (temp?.length > 1 && temp[0] === 'target') {
        setMove(temp[1]);
      } else if (piece?.length > 1 && piece[0] === 'piece') {
        setPieceImage(piece[1]);
      } else if (typeof info !== 'object' && info && info !== 'draw') {
        setCurrentFEN(info);
        let newLevel = parseInt(document.getElementById('movesAhead').value);
        if (newLevel <= 1) newLevel = 1;
        else if (newLevel >= 30) newLevel = 30;
        setLevel(newLevel);
        storeMoves(newGameId, info, move, pieceImage);
      }
    }
  };

  const sendFromQueue = () => {
    messageQueue.forEach((element) => {
      const chessBoard = document.getElementById('chessBd').contentWindow;
      chessBoard.postMessage(element, 'YOUR_CHESS_CLIENT_URL');
    });
  };

  const storeMoves = (gameId, fen, pos, image) => {
    fetch(`YOUR_MIDDLEWARE_URL/meetings/storeMoves?gameId=${gameId}&fen=${fen}&pos=${pos}&image=${image}`, {
      method: 'POST',
    })
      .then((response) => response.json())
      .then((data) => {
        const finalMove = data.moves.length > 0 ? data.moves[data.moves.length - 1] : data.moves;
        setDisplayMoves(finalMove || []);
        scrollToBottom();
      });
  };

  const scrollToBottom = () => {
    const scrollContainer = scrollFrame.current;
    scrollContainer.scroll({
      top: scrollContainer.scrollHeight,
      left: 0,
      behavior: 'smooth',
    });
  };

  const gameOverAlert = () => {
    if (gameOverMsg) {
      Swal.fire('Game Over', '', 'info');
    }
  };

  return (
    <>
      <Header />
      <div className="container">
        <div className="prompt"></div>
        <div id="play-container">
          <div id="chess-board" className="row">
            <div className="col-12 col-lg-3"></div>
            <div className="chess col-12 col-lg-6">
              <iframe src={chessSrc} id="chessBd" title="Chess Board"></iframe>
            </div>
            <div className="game_wrapper col-12 col-lg-3 mt-2">
              <div className="steps-stud-div">
                <div className="steps-div">
                  <div className="display-step">
                    <div className="text-center">
                      <span>Steps</span>
                      <hr className="steps-decoration" />
                    </div>
                    <div className="table-moves" ref={scrollFrame}>
                      {/* Render moves here */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div id="bottom" className="newGameUndo">
            <button type="button" id="new-game" onClick={() => {}}>New Game</button>
            <button type="button" id="undo" onClick={() => {}}>Undo</button>
            <div className="movesAhead">
              <p id="tag">
                The computer will think
                <input type="number" min="1" step="1" max="30" defaultValue="5" id="movesAhead" />
                moves ahead.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PlayNolog;
