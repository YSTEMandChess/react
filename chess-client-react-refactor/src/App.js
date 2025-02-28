import React, { useState, useRef } from 'react';

const ParentWindow = (sID, mID, r) => {
  const [studentID, setStudentID] = useState(sID);
  const [mentorID, setMentorID] = useState(mID);
  const [role, setRole] = useState(r);
  const [message, setMessage] = useState('Waiting for message...');
  const iframeRef = useRef(null);

  const newGame = () => {
    const data = { command: 'newgame' };
    iframeRef.current.contentWindow.postMessage(JSON.stringify(data), '*');
  };

  const enterUsers = () => {
    const data = { command: 'userinfo', student: studentID, mentor: mentorID, role };
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
    <div>
      <h1>Parent Window</h1>
      <p>This is the parent page. It will receive messages from the embedded child app (JavaScript).</p>

      {/* Iframe embedding the child application */}
      <iframe
        id="chessboard"
        ref={iframeRef}
        src="/chessClient/index.html"
        width="400px"
        height="400px"
        title="Chessboard"
      ></iframe>

      {/* Display received messages */}
      <p>{message}</p>

      {/* Form inputs */}
      <label htmlFor="studentID">Student ID:</label>
      <input
        type="text"
        id="studentID"
        value={studentID}
        onChange={(e) => setStudentID(e.target.value)}
        placeholder="Enter student ID"
      />

      <label htmlFor="mentorID">Mentor ID:</label>
      <input
        type="text"
        id="mentorID"
        value={mentorID}
        onChange={(e) => setMentorID(e.target.value)}
        placeholder="Enter mentor ID"
      />

      <label htmlFor="role">Role:</label>
      <select
        id="role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="student">Student</option>
        <option value="mentor">Mentor</option>
      </select>

      {/* Buttons for game control */}
      <button onClick={enterUsers}>Enter User Info</button>
      <button onClick={newGame}>Start New Game</button>
      <button onClick={endGame}>End Game</button>
      <button onClick={undo}>Undo</button>
    </div>
  );
};

export default ParentWindow;
