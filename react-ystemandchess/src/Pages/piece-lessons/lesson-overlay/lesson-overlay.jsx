import React, { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { environment } from '../../../environments/environment';
import PlayLesson from '../play-lesson/PlayLesson';
import './lesson-overlay.scss';

const LessonOverlay = () => {
    const [lessonStartFEN, setLessonStartFEN] = useState("rnbqkb2/pppppp2/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    const [lessonEndFEN, setLessonEndFEN] = useState("rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2");
    const [endSquare, setEndSquare] = useState('');
    const [previousEndSquare, setPreviousEndSquare] = useState('');
    const [lessonNum, setLessonNum] = useState(0);
    const [totalLessons, setTotalLessons] = useState(0);
    const [currentFEN, setCurrentFEN] = useState('');
    const [level, setLevel] = useState(5);
    const [cookies] = useCookies(['piece', 'login']);
    const piece = cookies.piece;
    const [displayLessonNum, setDisplayLessonNum] = useState(0);
    let isReady = false;
    let lessonStarted = false;

    useEffect(() => {
        const eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
        const eventer = window[eventMethod];
        const messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

        const handleMessage = async (e) => {
            if (e.origin === environment.urls.chessClientURL) {
                console.log("e.data", e.data)
                if (e.data === 'ReadyToRecieve') {
                    isReady = true;
                }
                if (!lessonStarted) {
                    // await getLessonsCompleted();
                    sendLessonToChessBoard()
                    lessonStarted = true;
                } else if (e.data === lessonEndFEN) {
                    // updateLessonCompletion();
                    alert(`Lesson ${displayLessonNum} completed!`);
                    // await getLessonsCompleted();
                } else if (looksLikeFEN(e.data)) {
                    console.log("valid fen")
                    setCurrentFEN(e.data);
                    let newLevel = level;
                    if (newLevel <= 1) newLevel = 1;
                    else if (newLevel >= 30) newLevel = 30;

                    const chessBoard = document.getElementById('chessBd').contentWindow;

                    httpGetAsync(
                        `${environment.urls.stockFishURL}/?level=${newLevel}&fen=${e.data}`,
                        (response) => {
                            const data = JSON.parse(response)
                            const message = JSON.stringify({ boardState: data.fen, color: "white", lessonFlag: false});
                            console.log(message)
                            if (isReady) {
                                console.log("ready")
                                chessBoard.postMessage(message, environment.urls.chessClientURL);
                            }
                        }
                    );
                }
            }
        };

        eventer(messageEvent, handleMessage, false);

        // getTotalLesson();

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    function looksLikeFEN(str) {
        return typeof str === 'string' && str.split(' ').length === 6;
    }

    // const getLessonsCompleted = async () => {
    //     const url = `${environment.urls.middlewareURL}/getCompletedLesson.php/?jwt=${cookies.login}&piece=${piece}`;
    //     httpGetAsync(url, (response) => {
    //         const data = JSON.parse(response);
    //         setLessonNum(data);
    //         getCurrentLesson();
    //     });
    // };

    // const getCurrentLesson = async () => {
    //     const url = `${environment.urls.middlewareURL}/getLesson.php/?jwt=${cookies.login}&piece=${piece}&lessonNumber=${lessonNum}`;
    //     setPreviousEndSquare(endSquare);
    //     httpGetAsync(url, (response) => {
    //         const data = JSON.parse(response);
    //         setLessonStartFEN(data.startFen);
    //         setLessonEndFEN(data.endFen);
    //         setDisplayLessonNum(data.lessonNumber);
    //         if (checkIfLessonsAreCompleted()) return;
    //         setEndSquare(data.endSquare);
    //         sendLessonToChessBoard();
    //     });
    // };

    // const checkIfLessonsAreCompleted = () => {
    //     if (displayLessonNum === undefined) {
    //         alert(
    //             'Congratulations all current lessons for this piece have been completed!\n' +
    //             'Come back soon for more lessons or go over previous lessons.'
    //         );
    //         return true;
    //     }
    //     return false;
    // };

    // const getTotalLesson = async () => {
    //     const url = `${environment.urls.middlewareURL}/getTotalPieceLesson.php/?jwt=${cookies.login}&piece=${piece}`;
    //     httpGetAsync(url, (response) => {
    //         console.log(response)
    //         const data = JSON.parse(response);
    //         setTotalLessons(data);
    //     });
    // };

    // const newGameInit = () => {
    //     setCurrentFEN(lessonStartFEN);

    //     const chessBoard = document.getElementById('chessBd').contentWindow;
    //     const message = JSON.stringify({ boardState: lessonStartFEN, color });
    //     if (isReady) {
    //         chessBoard.postMessage(message, environment.urls.chessClientURL);
    //     }

    //     if (color === 'white') {
    //         setLevel(5);
    //         setColor('black');
    //         let newLevel = level;
    //         if (newLevel <= 1) newLevel = 1;
    //         else if (newLevel >= 30) newLevel = 30;

    //         httpGetAsync(
    //             `${environment.urls.stockFishURL}/?level=${newLevel}&fen=${currentFEN}`,
    //             (response) => {
    //                 const chessBoard = document.getElementById('chessBd').contentWindow;
    //                 const message = JSON.stringify({ boardState: response, color: 'black' });
    //                 if (isReady) {
    //                     chessBoard.postMessage(message, environment.urls.chessClientURL);
    //                 }
    //             }
    //         );
    //     }
    // };

    const sendLessonToChessBoard = () => {
        const chessBoard = document.getElementById('chessBd').contentWindow;
        const message = JSON.stringify({
            boardState: lessonStartFEN,
            endState: lessonEndFEN,
            lessonFlag: true,
            endSquare,
            color: "white",
            previousEndSquare,
        });
        chessBoard.postMessage(message, environment.urls.chessClientURL);
    };

    // const previousLesson = () => {
    //     if (lessonNum > 0) {
    //         setLessonNum(lessonNum - 1);
    //         setPreviousEndSquare(endSquare);
    //         getCurrentLesson();
    //     }
    // };

    // const nextLesson = () => {
    //     if (lessonNum + 1 < totalLessons) {
    //         setLessonNum(lessonNum + 1);
    //         setPreviousEndSquare(endSquare);
    //         getCurrentLesson();
    //     }
    // };

    // const updateLessonCompletion = async () => {
    //     const url = `${environment.urls.middlewareURL}/updateLessonCompletion.php/?jwt=${cookies.login}&piece=${piece}&lessonNumber=${lessonNum}`;
    //     httpGetAsync(url, () => {});
    // };

    const httpGetAsync = (theUrl, callback) => {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) callback(xmlHttp.responseText);
        };
        xmlHttp.open('POST', theUrl, true);
        xmlHttp.send(null);
    };

    return (
        <div id="lesson-container">
            <div id="chess-board">
                <PlayLesson chessLessonSrc={environment.urls.chessClientURL} />
            </div>
            <div id="lesson-content">
                <h2>Pawn-It moves forward only</h2>
                <div id="try-this">
                    <p>Try this!</p>
                    <p>Pawns move one square only. But when they reach the other side of the board, they become a stronger piece!</p>
                </div>
                <div id="bottom">
                    <button type="button" id="previous">
                        &lt; Back
                    </button>
                    <button type="button" id="next">
                        Next &gt;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LessonOverlay;
