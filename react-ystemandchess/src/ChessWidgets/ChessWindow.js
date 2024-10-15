import React, { useState, useRef, useEffect } from 'react';


// sid : studentId
// mid : mentorId
// r : role
// w : width
// h : height
export const ChessWindow = ({sid, mid, r, w, h}) => {
  
  // setting variables from args 
  const [studentID, setStudentID] = useState(sid);
  const [mentorID, setMentorID] = useState(mid);
  const [role, setRole] = useState(r);

  const [height, setHeight] = useState(h);
  const [width, setWidth] = useState(w);


  
  const iframeRef = useRef(null);


  
  const enterUsers = (student, mentor, role) => {
    const data = { 'command': 'userinfo', 'student': student, 'mentor': mentor, 'role': role };
    console.log(data);
    iframeRef.current.contentWindow.postMessage(JSON.stringify(data), '*');
  };

  useEffect(() => {
    // This function will run once when the component mounts
    setStudentID(`${sid}`);
    setMentorID(`${mid}`);
    setRole(`${r}`);

    console.log(`${sid} ${mid} ${r} ${studentID} ${mentorID} ${role}`);
    
    enterUsers(sid, mid, r);
  }, []); // Empty dependency array ensures it runs only once


  const newGame = () => {
    
    enterUsers(sid, mid, r);
    const data = { command: 'newgame' };
    iframeRef.current.contentWindow.postMessage(JSON.stringify(data), '*');
  };

  const endGame = () => {
    const data = { command: 'endgame' };
    iframeRef.current.contentWindow.postMessage(JSON.stringify(data), '*');
  };

  const undo = () => {
    const data = { command: 'undo' };
    iframeRef.current.contentWindow.postMessage(JSON.stringify(data), '*');
  };

  return (
    <div style={{ textAlign: 'center', width: 400, height: 400}}>
      <iframe
        id="chessboard"
        ref={iframeRef}
        src="chessClient/index.html"
        width='200px'
        height='200px'
        title="Chessboard"
        style={{ display: 'block', margin: '0 auto' }}
      ></iframe>

      {/* Buttons for game control */}
      <div style={{ marginTop: '20px' }}>
        <button onClick={newGame}>Start Game</button>
        <button onClick={endGame}>End Game</button>
        <button onClick={undo}>Undo</button>
      </div>
    </div>
  );
};

export default ChessWindow;
