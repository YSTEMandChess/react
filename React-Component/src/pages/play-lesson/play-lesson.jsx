import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const PlayLesson = () => {
  const [chessLessonSrc, setChessLessonSrc] = useState('');
  
  useEffect(() => {
    const url = 'https://example.com/chessLessonUrl'; // Replace with your URL
    setChessLessonSrc(url);
  }, []);

  return (
    <div className="cont">
      <div className="row">
        <div className="lichess">
          <iframe src={chessLessonSrc} id="chessBd"></iframe>
        </div>
        <div className="jitsi" id="local_stream"></div>
        <div className="jitsi" id="remote_stream">
          <iframe
            src="https://meet.jit.si/"
            className="jitsi"
            frameBorder="0"
            style={{ position: 'relative', height: '100%', width: '100%' }}
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default PlayLesson;
