import React, { useState, useEffect, useRef } from 'react';

let studentID = null;
let mentorID = null;
let role = null;

const debugMode = true;

// Button styles
const buttonStyle = {
  backgroundColor: 'blue',
  color: 'white',
  border: 'none',
  borderRadius: '15px',
  padding: '10px 20px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
  margin: "5px"
};

const chessStyle = {
  border: 'none', // Removes default border
  borderRadius: '15px', // Makes it a rounded rectangle
  overflow: 'hidden', // Prevents internal scrolling
  margin: "5px"
};

const videoStyle = {
  border: 'none', // Removes default border
  overflow: 'hidden', // Prevents internal scrolling
  margin: "5px"
};


const ParentWindow = ({sID="student", mID="mentor", r="mentor"}) => {

  const host = window.location.port; // Get the hostname or IP address of the server

  const chessIframeRef = useRef(null);
  const videoIframeRef = useRef(null);

  const [studentIdRef, setStudentId] = useState(null);
  const [mentorIdRef, setMentorId] = useState(null);
  const [roleRef, setRole] = useState(null);

  useEffect( () => {
    studentID = sID;
    mentorID = mID;
    role = r;

    // Debug mode
    if (debugMode) {
      if (host == "3000") { role="student"; }
      else if (host == "3001") {role="mentor"; }
    }
    console.log(host);

    // Set visuals
    setMentorId(mentorID);
    setStudentId(studentID);
    setRole(role);

    // Making a new chess game
    enterUsers();
    newGame();

  }, []);

  const newVideo = () => {
    // Sending video iframe data 
    console.log("Starting Video");
    console.log(role);
    console.log(studentID);
    console.log(mentorID);

    const data = {command: "userinfo", channel: "ystem-chess",  student: studentID, mentor: mentorID, role:role};
    videoIframeRef.current.contentWindow.postMessage(JSON.stringify(data), '*');

  };

  const newGame = () => {
    const data = { command: 'newgame' };
    chessIframeRef.current.contentWindow.postMessage(JSON.stringify(data), '*');
  };

  const enterUsers = () => {
    const data = { command: 'userinfo', student: studentID, mentor: mentorID, role: role };
    chessIframeRef.current.contentWindow.postMessage(JSON.stringify(data), '*');
  };

  const endGame = () => {
    const data = { command: 'endgame' };
    chessIframeRef.current.contentWindow.postMessage(JSON.stringify(data), '*');
  };

  const undo = () => {
    const data = { command: 'undo' };
    chessIframeRef.current.contentWindow.postMessage(JSON.stringify(data), '*');
  };

  return (
    <div>

      {/* Iframe embedding the child application */}



      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Row 1 */}
        <div style={{ display: 'flex', width: '100%' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>            
            <img src='profile.png' width='100px'>
            
            </img>
            <p>{studentIdRef}</p>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>            
              
              
              
                            <iframe
                id="videoconference"
                style={videoStyle}
                ref={videoIframeRef}
                src="/video-conferencing/index.html"
                
                width="300px"
                height="200px"
                title="Video"
              ></iframe>

              




            </div>

        </div>
        {/* Row 2 */}
        <div style={{ display: 'flex', width: '100%' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <iframe
                id="chessboard"
                style={chessStyle}
                ref={chessIframeRef}
                src="/chessClient/index.html"
                width="400px"
                height="400px"
                
                title="Chessboard"
              ></iframe>
              <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>

                {/* Buttons for game control */}
                <button 
                  onClick={newGame} 
                  style={{ ...buttonStyle}}>
                  Start New Game
                </button>
                <button 
                  onClick={endGame} 
                  style={{ ...buttonStyle }}>
                  End Game
                </button>
                <button 
                  onClick={undo} 
                  style={{ ...buttonStyle}}>
                  Undo
                </button>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ParentWindow;
