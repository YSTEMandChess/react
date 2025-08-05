import React, { useEffect, useRef, useState } from 'react';
import './lesson-overlay.scss';
import { environment } from '../../../environments/environment';

interface LessonOverlayProps {
  propPieceName: string;
  propLessonNumber: number;
  navigateFunc: () => void;
  styleType: string;
}

const LessonOverlay: React.FC<LessonOverlayProps> = ({
  propPieceName,
  propLessonNumber,
  navigateFunc,
  styleType
}) => {
  const [lessonData, setLessonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // 🛠 Dummy: Replace this with actual implementation
  const startRecording = () => {
    console.log('Recording started...');
  };

  // 🛠 Dummy: Replace this with actual async call logic
  const httpGetAsync = (url: string, callback: (response: string) => void) => {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
        callback(xmlHttp.responseText);
    };
    xmlHttp.open('GET', url, true); // true for asynchronous
    xmlHttp.send(null);
  };

  // 📦 Load lesson from backend
  const fetchLesson = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${environment.urls.middlewareURL}/lessons/getLesson?piece=${propPieceName}&lessonNum=${propLessonNumber}`
      );
      const data = await response.json();
      setLessonData(data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLessonData(null);
    fetchLesson();
    setPiece(propPieceName);
    setLessonNum(propLessonNumber);
    startRecording();

    const handleMessage = (e: MessageEvent) => {
      if (e.data === 'ReadyToRecieve') {
        if (iframeRef.current && lessonData?.startFen) {
          iframeRef.current.contentWindow?.postMessage(lessonData.startFen, '*');
        }
      } else if (typeof e.data === 'string' && e.data.includes('/')) {
        const level = 'easy'; // can be dynamic
        const url = `${environment.urls.stockFishURL}/?level=${level}&fen=${e.data}`;
        httpGetAsync(url, (response) => {
          const data = JSON.parse(response);
          iframeRef.current?.contentWindow?.postMessage(data.fen, '*');
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [propPieceName, propLessonNumber]);

  const setPiece = (piece: string) => {
    console.log('Set piece:', piece);
  };

  const setLessonNum = (num: number) => {
    console.log('Set lesson number:', num);
  };

  if (loading) return <div className="lesson-overlay">Loading lesson...</div>;

  return (
    <div className={`lesson-overlay ${styleType}`}>
      <h2>{lessonData?.name}</h2>
      <p>{lessonData?.info}</p>
      <iframe
        title="Chess Client"
        src={environment.urls.chessClientURL}
        ref={iframeRef}
        className="lesson-iframe"
      ></iframe>
      <button onClick={navigateFunc}>Exit</button>
    </div>
  );
};

export default LessonOverlay;
