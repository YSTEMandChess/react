import React, { useEffect, useState, useRef } from 'react';
import { useCookies } from 'react-cookie';
import { environment } from '../../../environments/environment';
import PlayLesson from '../play-lesson/PlayLesson';
import './lesson-overlay.scss';
import MoveTracker from '../move-tracker/MoveTracker';

const LessonOverlay = () => {
    const lessonStartFENRef = useRef("rnbqkb2/pppppp2/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    let lessonEndFEN = "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2";
    const [endSquare, setEndSquare] = useState('');
    const [previousEndSquare, setPreviousEndSquare] = useState('');
    const [lessonNum, setLessonNum] = useState(0);
    const [totalLessons, setTotalLessons] = useState(0);
    const [currentFEN, setCurrentFEN] = useState('');
    const [level, setLevel] = useState(5);
    const [cookies] = useCookies(['piece', 'login']);
    const piece = "Piece Checkmate 1 Basic checkmates";
    const [displayLessonNum, setDisplayLessonNum] = useState(0);
    let isReady = false;
    let lessonStarted = false;

    useEffect(() => {
        const eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
        const eventer = window[eventMethod];
        const messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

        const handleMessage = async (e) => {
            if (e.origin === environment.urls.chessClientURL) {
                console.log("front end received", e.data)
                if (e.data === 'ReadyToRecieve') {
                    isReady = true;
                }
                if (!lessonStarted) {
                    await getLessonsCompleted();
                    lessonStarted = true;
                } else if (e.data === lessonEndFEN || e.data.startsWith("next")) {
                    updateLessonCompletion();
                    alert("lesson completed")
                    await getLessonsCompleted();
                } else if (e.data.startsWith("restart")){
                    alert("try again")
                }  else if (looksLikeFEN(e.data)) {
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

        getTotalLesson();

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    function looksLikeFEN(str) {
        return typeof str === 'string' && str.split(' ').length === 6;
    }

    function handleReset() {
        const chessBoard = document.getElementById('chessBd').contentWindow
        const message = JSON.stringify({ boardState: lessonStartFENRef.current, color: "white", lessonFlag: false});
        chessBoard.postMessage(message, environment.urls.chessClientURL);
    }

    const getLessonsCompleted = async () => {
        try {
            logTime("get # of completed lessons")
            const response = await fetch(
            `${environment.urls.middlewareURL}/lessons/getCompletedLessonCount?piece=${piece}`, 
            {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${cookies.login}` }
            }
            );
            const completedCount = await response.json();

            // The next lesson is the first uncompleted one (completed count + 1)
            // But we index from 0, so just use the completedCount directly
            setLessonNum(completedCount);
            getCurrentLesson(completedCount);
        } catch (error) {
            console.error('Error fetching completed lessons:', error);
        }
    };

    const getCurrentLesson = async (lessonNumber) => {
        // setPreviousEndSquare(endSquare);
        try {
            logTime("fetching current lesson")
            const response = await fetch(
            `${environment.urls.middlewareURL}/lessons/getLesson?piece=${piece}&lessonNum=${lessonNumber}`,
            {
                method: 'GET', 
                headers: { 'Authorization': `Bearer ${cookies.login}` }
            }
            );
                const lessonData = await response.json();
                // Update the lesson data
                setDisplayLessonNum(lessonNumber + 1);
                lessonStartFENRef.current = lessonData.startFen
                // setLessonEndFEN(data.endFen); 
                
                // Check if we've reached the end of lessons, same approach I saw earlier.
                if (!lessonData || lessonData.lessonNum === undefined) {
                    alert('Congratulations! You have completed all lessons for this piece.');
                    return
                }
                // setEndSquare(data.endSquare);
                sendLessonToChessBoard();
            } catch (error) {
                console.error('Error fetching lesson:', error);
        }
    };

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

    const getTotalLesson = async () => {
        try {
            const response = await fetch(
            `${environment.urls.middlewareURL}/lessons/getTotalPieceLesson?piece=${piece}`,
            {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${cookies.login}` }
            }
            );
            
            const total = await response.json();
            setTotalLessons(total);
        } catch (error) {
            console.error('Error fetching total lessons:', error);
        }
    };

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
        logTime("Sending Lesson to board")
        const chessBoard = document.getElementById('chessBd').contentWindow;
        const message = JSON.stringify({
            boardState: lessonStartFENRef.current,
            endState: lessonEndFEN,
            lessonFlag: true,
            endSquare,
            color: "white",
            previousEndSquare,
        });
        chessBoard.postMessage(message, environment.urls.chessClientURL);
    };

    // Navigation functions
    const previousLesson = () => {
        if (lessonNum > 0) {
            logTime("Previous lesson")
            setLessonNum(prevNum => prevNum - 1);
            setPreviousEndSquare(endSquare);
            getCurrentLesson(lessonNum - 1);
        }
    };
    
    const nextLesson = () => {
        if (lessonNum + 1 < totalLessons) {
            logTime("Next lesson")
            setLessonNum(prevNum => prevNum + 1);
            setPreviousEndSquare(endSquare);
            getCurrentLesson(lessonNum + 1);
        }
    };

    // Update the lesson completion function
    const updateLessonCompletion = async () => {
        try {
            await fetch(
            `${environment.urls.middlewareURL}/lessons/updateLessonCompletion?piece=${piece}&lessonNum=${lessonNum}`,
            {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${cookies.login}` }
            }
            );
            
            console.log("updated lesson successful")
            // Move to next lesson if available, otherwise throw an error.
            if (lessonNum + 1 < totalLessons) {
            setLessonNum(prevNum => prevNum + 1);
            getCurrentLesson(lessonNum + 1);
            } else {
            alert('Congratulations! You have completed all lessons for this piece!');
            }
        } catch (error) {
            console.error('Error updating lesson completion:', error);
        }
    };

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
                    <button type="button" id="previous" onClick={previousLesson}>
                        &lt; Back
                    </button>
                    <button type="button" id="next" onClick={nextLesson}>
                        Next &gt;
                    </button>
                </div>
                <button onClick={handleReset} className="reset-btn">Reset</button>
            </div>
            <MoveTracker />
        </div>
    );
};

export default LessonOverlay;

const logTime = (label, data = '') => {
    const timestamp = new Date().toISOString();
    const perfTime = performance.now().toFixed(2);
    console.log(`🕐 [${timestamp}] [${perfTime}ms] ${label}`, data);
};