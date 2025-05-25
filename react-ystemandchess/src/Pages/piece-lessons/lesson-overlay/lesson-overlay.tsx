import React, { useEffect, useState, useRef } from 'react';
import { useCookies } from 'react-cookie';
import { environment } from '../../../environments/environment';
import PlayLesson from '../play-lesson/PlayLesson';
import './lesson-overlay.scss';
import MoveTracker from '../move-tracker/MoveTracker';
import { Chess } from 'chess.js';
import { ReactComponent as RedoIcon } from '../../../images/icons/icon_redo.svg';
import { ReactComponent as BackIcon} from '../../../images/icons/icon_back.svg';
import { ReactComponent as BackIconInactive} from '../../../images/icons/icon_back_inactive.svg';
import { ReactComponent as NextIcon } from '../../../images/icons/icon_next.svg';
import { ReactComponent as NextIconInactive } from '../../../images/icons/icon_next_inactive.svg';

const LessonOverlay = () => {
    const lessonStartFENRef = useRef("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    const [totalLessons, setTotalLessons] = useState(0);
    let lessonEndFEN = "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2";
    const [endSquare, setEndSquare] = useState('');
    const [previousEndSquare, setPreviousEndSquare] = useState('');
    const [lessonNum, setLessonNum] = useState(0);
    const prevFenRef = useRef(null)
    const currentFenRef = useRef(lessonStartFENRef.current);
    const [moves, setMoves] = useState([])
    const [moveIndex, setMoveIndex] = useState(1)
    const [level, setLevel] = useState(5);
    const [showVPopup, setShowVPopup] = useState(false);
    const [showXPopup, setShowXPopup] = useState(false);
    const [cookies] = useCookies(['piece', 'login']);
    const [name, setName] = useState("");
    const [info, setInfo] = useState("");
    const piece = "Piece Checkmate 1 Basic checkmates";
    const updateCompletionRef = useRef(() => {});
    const getTotalLessonsRef = useRef(() => {});
    const getCurrentLessonsRef = useRef(() => {});
    let isReady = false;
    let lessonStarted = false;

    useEffect(() => {
        const eventMethod: any = !window.addEventListener ? 'addEventListener' : 'attachEvent';
        const eventer: any = window[eventMethod];
        const messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

        const handleMessage = async (e: any) => {
            if (e.origin === environment.urls.chessClientURL) {
                console.log("front end received", e.data)
                if (e.data === 'ReadyToRecieve') {
                    isReady = true;
                }
                if (!lessonStarted) {
                    await getLessonsCompleted();
                    lessonStarted = true;
                } else if (e.data === lessonEndFEN || e.data.startsWith("next")) {
                    setShowVPopup(true);
                } else if (e.data.startsWith("restart")){
                    setShowXPopup(true)
                }  else if (looksLikeFEN(e.data)) {

                    // update fens
                    prevFenRef.current = currentFenRef.current
                    currentFenRef.current = e.data

                    // process the move for tracking
                    processMove()

                    let newLevel = level;
                    if (newLevel <= 1) newLevel = 1;
                    else if (newLevel >= 30) newLevel = 30;

                    const chessBoard = document.getElementById('chessBd').contentWindow;

                    httpGetAsync(
                        `${environment.urls.stockFishURL}/?level=${newLevel}&fen=${e.data}`,
                        (response) => {
                            const data = JSON.parse(response)
                            const message = JSON.stringify({ boardState: data.fen, color: "white", lessonFlag: false});
                            // update fens
                            prevFenRef.current = currentFenRef.current
                            currentFenRef.current = data.fen

                            // process the move for tracking
                            processMove()

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

        getTotalLessonsRef.current()

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
        setMoves([])
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
            getCurrentLessonsRef.current(completedCount);
        } catch (error) {
            console.error('Error fetching completed lessons:', error);
        }
    };

    getCurrentLessonsRef.current = async (lessonNumber) => {
        // setPreviousEndSquare(endSquare);
        try {
            logTime("fetching current lesson", lessonNumber)
            const response = await fetch(
            `${environment.urls.middlewareURL}/lessons/getLesson?piece=${piece}&lessonNum=${lessonNumber}`,
            {
                method: 'GET', 
                headers: { 'Authorization': `Bearer ${cookies.login}` }
            }
            );
                const lessonData = await response.json();
                // Update the lesson data
                lessonStartFENRef.current = lessonData.startFen
                setInfo(lessonData.info)
                setName(lessonData.name)
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

    function processMove() {
        if (prevFenRef.current) {
            const move = getMoveFromFens(prevFenRef.current, currentFenRef.current)
            console.log(move)
            setMoves(prev => [...prev, move])
        }
    }

    function getMoveFromFens(prevFEN, currFEN) {
        const chess = new Chess(prevFEN)
        const moves = chess.moves({verbose: true})

        console.log(getPositionKey(prevFEN), getPositionKey(currFEN))

        for (let i = 0; i < moves.length; i++) {
            const possibleChess = new Chess(prevFEN)
            possibleChess.move(moves[i])
            
            if (getPositionKey(possibleChess.fen()) === getPositionKey(currFEN)) {
                console.log("move found!")
                return moves[i].san
            }
        }

        // move not found
        console.log("move not found :(")
        return null
    }

    function getPositionKey(fen) {
    // only compare the first 4 parts of the FEN (board, active color, castling, en passant)
    return fen.split(" ").slice(0, 3).join(" ")
    }

    getTotalLessonsRef.current = async () => {
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
        if (lessonNum > 1) {
            logTime("Previous lesson")
            setLessonNum(prevNum => prevNum - 1);
            setPreviousEndSquare(endSquare);
            getCurrentLessonsRef.current(lessonNum - 1);
        }
    };
    
    const nextLesson = () => {
        if (lessonNum < totalLessons) {
            logTime("Next lesson")
            setLessonNum(prevNum => prevNum + 1);
            setPreviousEndSquare(endSquare);
            getCurrentLessonsRef.current(lessonNum + 1);
        }
    };

    // Update the lesson completion function
    updateCompletionRef.current = async () => {
        try {
            await fetch(
            `${environment.urls.middlewareURL}/lessons/updateLessonCompletion?piece=${piece}&lessonNum=${lessonNum}`,
            {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${cookies.login}` }
            }
            );
            
            // Move to next lesson if available, otherwise throw an error.
            if (lessonNum + 1 < totalLessons) {
                console.log("lessonNum!!", lessonNum)
                setLessonNum(prevNum => prevNum + 1);
                getCurrentLessonsRef.current(lessonNum + 1);
            }
        } catch (error) {
            console.error('Error updating lesson completion:', error);
        }
    };

    const httpGetAsync = (theUrl: any, callback: any) => {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) callback(xmlHttp.responseText);
        };
        xmlHttp.open('POST', theUrl, true);
        xmlHttp.send(null);
    };

    const handleVPopup = () => {
        setShowVPopup(false);
        updateCompletionRef.current();
    }

    const handleXPopup = () => {
        setShowXPopup(false);
        handleReset()
    }

    return (
        <div id="lesson-container">
            <div className='left-right-container'>

            </div>
            <div id="chess-board">
                <PlayLesson chessLessonSrc={environment.urls.chessClientURL} />
            </div>
            {/* <div id="lesson-content">
                <h2>{piece}</h2>
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
            </div> */}
            <div className='right-container'>
                {/* Description part */}
                <div className='lesson-header'>
                <h1 className="piece_description">{piece}</h1>
                <button className='reset-lesson' onClick={handleReset}>
                    <RedoIcon className='reset-icon'/>
                </button>
                </div>
    
                <h1 className='subheading'>{lessonNum} / {totalLessons}: {name}</h1>
                <p className="lesson-description">{info}</p>
    
                <div className='prev-next-button-container'>
                {
                    lessonNum == 1? (
                    <button className="prevNextLessonButton-inactive prev">
                        <BackIconInactive/>
                        <p className="button-description">Back</p>
                    </button>
                    ) : (
                    <button className="prevNextLessonButton prev" onClick={previousLesson}>
                        <BackIcon/>
                        <p className="button-description">Back</p>
                    </button>
                    )
                }
    
                {lessonNum == totalLessons? (
                    <button className="prevNextLessonButton-inactive next">
                        <p className="button-description">Next</p>
                        <NextIconInactive/>
                    </button>
                    ) : (
                    <button className="prevNextLessonButton next" onClick={nextLesson}>
                        <p className="button-description">Next</p>
                        <NextIcon/>
                    </button>
                    )
                }
                </div>
                <MoveTracker moves={moves} />
            </div>
            
            {showVPopup && (
                <div className="popup">
                <div className="popup-content">
                    <div className="success-checkmark">
                    <svg width="80" height="80" viewBox="0 0 120 120">
                        <circle className="circle" cx="60" cy="60" r="54" fill="none" stroke="#beea8b" stroke-width="6"></circle>
                        <path className="checkmark" d="M35 60 L55 80 L85 40" fill="none" stroke="#beea8b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    </div>
                    <p className="popup-header">Lesson completed</p>
                    <p className="popup-subheading">Good job</p>
                    <button className="popup-button" onClick={handleVPopup}>OK</button>
                </div>
                </div>
            )}

            {showXPopup && (
                <div className="popup">
                    <div className="popup-content">
                    <div className="error-cross">
                        <svg width="80" height="80" viewBox="0 0 120 120">
                        <circle
                            className="circle"
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke="#f57c7c"
                            strokeWidth="6"
                        ></circle>
                        <path
                            className="cross-line1"
                            d="M40 40 L80 80"
                            fill="none"
                            stroke="#f57c7c"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />
                        <path
                            className="cross-line2"
                            d="M80 40 L40 80"
                            fill="none"
                            stroke="#f57c7c"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />
                        </svg>
                    </div>
                    <p className="popup-header">Lesson failed</p>
                    <p className="popup-subheading">Please try again</p>
                    <button className="popup-button" onClick={handleXPopup}>OK</button>
                    </div>
                </div>
                )}

        </div>
    );
};

export default LessonOverlay;

const logTime = (label, data = '') => {
    const timestamp = new Date().toISOString();
    const perfTime = performance.now().toFixed(2);
    console.log(`🕐 [${timestamp}] [${perfTime}ms] ${label}`, data);
};