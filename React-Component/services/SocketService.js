import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useSocketService = (url) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io.connect(url, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      console.log('socket service connected');
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [url]);

  const emitMessage = (eventName, message) => {
    socketRef.current.emit(eventName, message);
  };

  const listen = (eventName, callback) => {
    if (socketRef.current) {
      socketRef.current.on(eventName, (data) => {
        callback(data);
      });
    }
  };

  return { emitMessage, listen };
};

export default useSocketService;
