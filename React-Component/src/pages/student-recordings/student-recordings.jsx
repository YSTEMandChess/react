import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const StudentRecordings = () => {
  const [recordings, setRecordings] = useState(new Map());
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      const uInfo = await setPermissionLevel(Cookies);
      if (uInfo.error === undefined) {
        setStudentName(uInfo.username);
      }
      if (Cookies.get('student')) {
        setStudentName(Cookies.get('student'));
      }
      getRecordings();
    };
    fetchUserInfo();
  }, []);

  const getRecordings = () => {
    const url = `${process.env.REACT_APP_MIDDLEWARE_URL}/meetings/parents/recordings/?childUsername=${studentName}`;
    httpGetAsync(url, 'GET', (response) => {
      const data = JSON.parse(response);
      const newRecordings = new Map(recordings);
      data.forEach((recording) => {
        const recordingDate = getRecordingString(recording.meetingStartTime);
        const newArr = newRecordings.has(recordingDate)
          ? newRecordings.get(recordingDate).concat(recording.filesList)
          : recording.filesList;
        newRecordings.set(recordingDate, newArr);
      });
      setRecordings(newRecordings);
    });
  };

  const getRecordingString = (recordingDate) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    if (recordingDate) {
      const dateString = new Date(recordingDate);
      return `${monthNames[dateString.getMonth()]} ${dateString.getDate()}, ${dateString.getFullYear()}`;
    }
    return null;
  };

  const verify = (fileName) => {
    const url = `${process.env.REACT_APP_MIDDLEWARE_URL}/meetings/singleRecording/?filename=${fileName}`;
    httpGetAsync(url, 'GET', (response) => {
      if (window.confirm('Download now?')) {
        window.open(JSON.parse(response));
      }
    });
  };

  const httpGetAsync = (theUrl, method, callback) => {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
        callback(xmlHttp.responseText);
    };
    xmlHttp.open(method, theUrl, true);
    xmlHttp.setRequestHeader(
      'Authorization',
      `Bearer ${Cookies.get('login')}`
    );
    xmlHttp.send(null);
  };

  return (
    <div>
      <header>
        <h1>Recordings here</h1>
        <h2>
          Note: we recommend using
          <a href="https://www.videolan.org/vlc/index.html">VLC</a> media players to watch the recordings.
        </h2>
        <h2>Recordings will have to be downloaded again after seven days.</h2>
      </header>
      <div id="recordings">
        <h2>{studentName} Recordings</h2>
        {Array.from(recordings).map(([key, value]) => (
          <div key={key}>
            <h1>{key}</h1>
            {value.map((myRecord, index) => (
              <a key={index} onClick={() => verify(myRecord)}>
                <h5>{myRecord}</h5>
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentRecordings;
