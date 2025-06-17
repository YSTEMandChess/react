import React, { useState, useEffect } from 'react';
import { environment } from '../../environments/environment';

const PlayMentor = ({ chessLessonSrc }) => {
        const [isReady, setIsReady] = useState(false);

        useEffect(() => {
            // configure eventer
            const eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
            const eventer = window[eventMethod];
            const messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

            // get the iframe
            const iframe = document.getElementById('chessBd') as HTMLIFrameElement | null;
            const chessBoard = iframe?.contentWindow;
    
            const handleMessage = async (e) => {
                if (e.origin === environment.urls.chessClientURL) {
                    // if chess client is ready to receive
                    if (e.data === 'ReadyToRecieve') {
                        setIsReady(true);
                        if(chessBoard) {
                            // sending student info
                            let message = JSON.stringify({ command: "userinfo", student: "alice", mentor: "bob", role: "student" })
                            chessBoard.postMessage(message, environment.urls.chessClientURL);
                            // tell chess client to start a new game
                            message = JSON.stringify({ command: "newgame" })
                            chessBoard.postMessage(message, environment.urls.chessClientURL);
                        }
                    }
                }
            };
    
            eventer(messageEvent, handleMessage, false); // fire eventer
    
            return () => {
                window.removeEventListener('message', handleMessage); // remove event listener
            };
        }, [ isReady ]);
    
    return (
        <iframe
            src={chessLessonSrc}
            id='chessBd'
            title="Chess Game"
            style={{
            width: '600px',
            height: '600px',
            border: 'none'
            }}
        />
    );
}

export default PlayMentor;