import React, { useState, useEffect, useRef } from 'react';
import { SocketService } from '../../services/socket/socket.service';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';

const Play = () => {
  const [userRole, setUserRole] = useState('');
  const [findStudentName, setFindStudentName] = useState('');
  const [findMentorName, setFindMentorName] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [chessSrc, setChessSrc] = useState('');
  const [displayMoves, setDisplayMoves] = useState([]);
  const [isStepLast, setIsStepLast] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentFen, setCurrentFen] = useState('');
  const [messageQueue, setMessageQueue] = useState([]);
  const scrollFrame = useRef(null);
  const scrollContainer = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  
  const socket = SocketService();

  useEffect(() => {
    const userContent = getUserContent();
    if (userContent) {
      setFindStudentName(userContent.username);
      setUserRole(userContent.role);
      setChessSrc(`${environment.urls.chessClientURL}`);
      fetchMeetingData(userContent);
    }

    socket.listen('isStepLastUpdate', (data) => {
      setIsStepLast(data);
    });

    socket.listen('boardState', (data) => {
      handleBoardState(data);
    });

    window.addEventListener('message', handleMessageEvent);
  }, []);

  const getUserContent = () => {
    const loginCookie = getCookie('login');
    return loginCookie ? JSON.parse(atob(loginCookie.split('.')[1])) : null;
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  const fetchMeetingData = (userContent) => {
    const url = `${environment.urls.middlewareURL}/meetings/inMeeting`;
    fetch(url, { method: 'GET' })
      .then((response) => response.json())
      .then((response) => {
        if (response === 'There are no current meetings with this user.') return;
        const meeting = response[0];
        setMeetingId(meeting.meetingId);
        setFindMentorName(meeting.studentUsername);
        initializeWebcam(meeting.meetingId, userContent.role);
      });
  };

  const initializeWebcam = (meetingId, role) => {
    // Add webcam initialization logic here
  };

  const handleBoardState = (data) => {
    setTimeout(() => {
      getMovesList();
      setTimeout(() => scrollToBottom(), 1000);
    }, 1000);
    if (isReady && isStepLast) {
      const newData = JSON.parse(data);
      const chessBoard = document.getElementById('chessBd').contentWindow;
      chessBoard.postMessage(
        JSON.stringify({
          boardState: newData.boardState,
          color: newData.color,
        }),
        environment.urls.chessClientURL
      );
    } else {
      setMessageQueue([...messageQueue, data]);
    }
  };

  const handleMessageEvent = (e) => {
    if (e.origin !== environment.urls.chessClientURL) return;
    const info = e.data;
    // Handle the received message here
  };

  const scrollToBottom = () => {
    scrollContainer.current.scroll({
      top: scrollContainer.current.scrollHeight,
      left: 0,
      behavior: 'smooth',
    });
  };

  const isUserNearBottom = () => {
    const threshold = 150;
    const position =
      scrollContainer.current.scrollTop +
      scrollContainer.current.offsetHeight;
    const height = scrollContainer.current.scrollHeight;
    return position > height - threshold;
  };

  const scrolled = () => {
    setIsNearBottom(isUserNearBottom());
  };

  const getMovesList = () => {
    const url = `${environment.urls.middlewareURL}/meetings/getBoardState?meetingId=${meetingId}`;
    fetch(url, { method: 'GET' })
      .then((response) => response.json())
      .then((response) => {
        const finalMove = response.moves.length > 0
          ? response.moves[response.moves.length - 1]
          : response.moves;
        setDisplayMoves(finalMove || []);
        setCurrentStep(finalMove.length > 0 ? finalMove.length - 1 : 0);
      });
  };

  const imgPos = (index) => {
    return (
      `../../assets/images/chessPieces/wikipedia/${displayMoves[index].image}.png`
    );
  };

  const setMove = (index, direction) => {
    setCurrentStep(
      index <= 0
        ? 0
        : index > displayMoves.length - 1
          ? displayMoves.length - 1
          : index
    );
    if (direction !== 'backward') {
      setIsStepLast(displayMoves.length - 1 === index);
    } else {
      setIsStepLast(displayMoves.length <= index);
    }
    socket.emitMessage('isStepLastUpdate', isStepLast);
    const movePos = index <= 0 ? 0 : index - 1;
    changeBoardState(displayMoves[movePos]?.fen);
    if (isNearBottom) scrollToBottom();
  };

  const changeBoardState = (fen) => {
    const chessBoard = document.getElementById('chessBd').contentWindow;
    chessBoard.postMessage(
      JSON.stringify({
        boardState: fen,
      }),
      environment.urls.chessClientURL
    );
  };

  return (
    <div className="game_wrapper">
      <Header />
      <div className="chess">
        <div className="stream_wrapper">
          <div className="container">
            <div className="row">
              <div className={`col-lg-3 col-12 col-md-6 order-sm-1 order-1 mt-sm-4 mt-lg-0 order-lg-0 px-4 ${userRole === 'student' ? 'video-student' : 'video-col'}`}>
                <div id="draggable">
                  <div className="jitsi" id="local_stream"></div>
                  <div className="role-username" id="local_streamName">
                    <b>{findStudentName}</b><br />{userRole === 'mentor' ? 'MENTOR' : 'STUDENT'}
                  </div>
                </div>
                <div id="draggable-remote">
                  <div className="jitsi" id="remote_stream"></div>
                  <div className="role-studentname" id="remote_streamName"><b>{findMentorName}</b><br />{userRole === 'mentor' ? 'STUDENT' : 'MENTOR'}</div>
                </div>
              </div>
              <div className="col-lg-6 col-12 order-lg-1">
                <div className={`chessboard ${!isStepLast ? 'disable-board' : ''}`}>
                  <iframe src={chessSrc} id="chessBd"></iframe>
                </div>
              </div>
              {displayMoves.length > 0 && (
                <div className="col-lg-3 col-md-6 col-12 order-2 order-sm-2 mt-sm-4 mt-lg-0">
                  <div className="steps-div">
                    <div className="display-step">
                      <div className="text-center">
                        <span>Steps</span>
                        <hr className="steps-decoration" />
                      </div>
                      <div className="table-moves" onScroll={scrolled} ref={scrollFrame}>
                        <div style={{ width: '100px' }}>
                          {displayMoves.map((item, i) => (
                            <div
                              key={i}
                              onClick={() => setMove(i, 'direct')}
                              style={{ backgroundColor: '#b5d6e1' }}>
                              {i % 2 === 0 && (
                                <p className={i === currentStep ? 'tableMove-selected' : ''}>
                                  <img src={imgPos(i)} alt="" className="imgRes" /> {item.pos}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div style={{ width: '100px' }}>
                          {displayMoves.map((item, i) => (
                            <div
                              key={i}
                              onClick={() => setMove(i, 'direct')}
                              style={{ backgroundColor: '#b5d6e1' }}>
                              {i % 2 !== 0 && (
                                <p className={i === currentStep ? 'tableMove-selected' : ''}>
                                  <img src={imgPos(i)} alt="" className="imgRes" /> {item.pos}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Play;
