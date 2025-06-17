import React, { useState, useEffect } from 'react';
import { environment } from '../../environments/environment';

const PlayStudent = ({ chessLessonSrc }) => {

    useEffect(() => {
        const handleMessage = (e) => {
            if(e.origin === environment.urls.chessClientURL && e.data === "ReadyToReceive") {
                const iframe = document.getElementById("chessBd") as HTMLIFrameElement | null;
                const chessBoard = iframe?.contentWindow;

                if(chessBoard) {
                    let message = JSON.stringify({
                        command:"userinfo",
                        student: "alice",
                        mentor: "bob",
                        role: "mentor"
                    });
                    chessBoard.postMessage(message, environment.urls.chessClientURL);
                    
                    message = JSON.stringify({ command: "newgame" });
                    chessBoard.postMessage(message, environment.urls.chessClientURL);
                }
            }
        }

        window.addEventListener('message', handleMessage);

        return() => window.removeEventListener("message", handleMessage);
    }, []);

    return(
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

export default PlayStudent;