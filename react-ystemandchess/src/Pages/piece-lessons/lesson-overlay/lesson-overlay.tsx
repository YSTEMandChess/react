import React, { useEffect, useState, useRef } from 'react';
import { useCookies } from 'react-cookie';
import { environment } from '../../../environments/environment';
import PlayLesson from '../play-lesson/PlayLesson';
import './lesson-overlay.scss';
// @ts-ignore
import MoveTracker from '../move-tracker/MoveTracker';
import { Chess } from 'chess.js';
import { ReactComponent as RedoIcon } from '../../../images/icons/icon_redo.svg';
import { ReactComponent as BackIcon} from '../../../images/icons/icon_back.svg';
import { ReactComponent as BackIconInactive} from '../../../images/icons/icon_back_inactive.svg';
import { ReactComponent as NextIcon } from '../../../images/icons/icon_next.svg';
import { ReactComponent as NextIconInactive } from '../../../images/icons/icon_next_inactive.svg';
import { useNavigate, useLocation } from 'react-router';

const LessonOverlay = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const lessonStartFENRef = useRef("");
    const [totalLessons, setTotalLessons] = useState(0);
    let lessonEndFEN = "";
    const [endSquare, setEndSquare] = useState('');
    const [previousEndSquare, setPreviousEndSquare] = useState('');
    const [lessonNum, setLessonNum] = useState(0);
    const prevFenRef = useRef(null)
    const currentFenRef = useRef(null);
    const [moves, setMoves] = useState([])
    const [moveIndex, setMoveIndex] = useState(1)
    const [level, setLevel] = useState(5);
    const [showVPopup, setShowVPopup] = useState(false);
    const [showXPopup, setShowXPopup] = useState(false);
    const [showLPopup, setShowLPopup] = useState(true);
    const [showInstruction, setShowInstruction] = useState(false);
    const [cookies] = useCookies(['piece', 'login']);
    const [name, setName] = useState("");
    const [info, setInfo] = useState("");
    const [piece, setPiece] = useState("Piece Checkmate 1 Basic checkmates");
    const getLessonsCompletedRef = useRef(() => {});
    const updateCompletionRef = useRef(() => {});
    const getTotalLessonsRef = useRef(() => {});
    const getCurrentLessonsRef = useRef<(input: number) => void>(() => {});
    let isReady = false;
    let lessonStarted = false;

    const passedPieceName = location.state?.piece;
    const passedLessonNumber = location.state?.lessonNum;

    useEffect(() => {
        const eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
        const eventer = window[eventMethod];
        const messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

        const handleMessage = async (e) => {
            if (e.origin === environment.urls.chessClientURL) {
                if (e.data === 'ReadyToRecieve') {
                    isReady = true;
                    getTotalLessonsRef.current()
                }
                if (!lessonStarted) {
                    if (passedLessonNumber != null && passedPieceName != null) {
                        // Fetch the specific lesson
                        await getCurrentLessonsRef.current(passedLessonNumber);
                        } else {
                        // Otherwise, fetch the default lesson
                        await getLessonsCompletedRef.current();
                        }
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

                    const iframe = document.getElementById('chessBd') as HTMLIFrameElement | null;
                    const chessBoard = iframe?.contentWindow;

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
                                chessBoard.postMessage(message, environment.urls.chessClientURL);
                            }
                        }
                    );
                }
            }
        };

        eventer(messageEvent, handleMessage, false);

        // Check if passedLessonNumber and passedPieceName are available
        if (passedLessonNumber != null && passedPieceName != null) {
            // Fetch the specific lesson
                setLessonNum(passedLessonNumber)
                setPiece(passedPieceName)
                
            }

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    function looksLikeFEN(str) {
        return typeof str === 'string' && str.split(' ').length === 6;
    }

    function handleReset() {
        const iframe = document.getElementById('chessBd') as HTMLIFrameElement | null;
        const chessBoard = iframe?.contentWindow;
        const message = JSON.stringify({ boardState: lessonStartFENRef.current, color: "white", lessonFlag: false});
        chessBoard.postMessage(message, environment.urls.chessClientURL);
        setMoves([])
        currentFenRef.current = lessonStartFENRef.current
    }

    getLessonsCompletedRef.current = async () => {
        try {
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
            
            setShowLPopup(true)
            const response = await fetch(
            `${environment.urls.middlewareURL}/lessons/getLesson?piece=${piece}&lessonNum=${lessonNumber + 1}`,
            {
                method: 'GET', 
                headers: { 'Authorization': `Bearer ${cookies.login}` }
            }
            );

            const lessonData = await response.json();
            // Update the lesson data
            lessonStartFENRef.current = lessonData.startFen
            if(!currentFenRef.current) currentFenRef.current = lessonData.startFen
            setInfo(lessonData.info)
            setName(lessonData.name)
            setShowLPopup(false)
            setShowInstruction(true)
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
            setMoves(prev => [...prev, move])
        }
    }

    function getMoveFromFens(prevFEN, currFEN) {
        const chess = new Chess(prevFEN)
        const moves = chess.moves({verbose: true})

        // console.log(getPositionKey(prevFEN), getPositionKey(currFEN))
        console.log("prevFen", getPositionKey(prevFEN))
        console.log("currFen", getPositionKey(currFEN))

        for (let i = 0; i < moves.length; i++) {
            const possibleChess = new Chess(prevFEN)
            possibleChess.move(moves[i])
            
            if (getPositionKey(possibleChess.fen()) === getPositionKey(currFEN)) {
                // console.log("move found!")
                return moves[i].san
            }
        }

        // move not found
        // console.log("move not found :(")
        return null
    }

    function getPositionKey(fen) {
        // only compare the first 4 parts of the FEN (board, active color, castling, en passant)
        if(!fen) return;
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
        const iframe = document.getElementById('chessBd') as HTMLIFrameElement | null;
        const chessBoard = iframe?.contentWindow;
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
            setLessonNum(prevNum => prevNum - 1);
            setPreviousEndSquare(endSquare);
            getCurrentLessonsRef.current(lessonNum - 1);
            setMoves([])
            currentFenRef.current = null;
        }
    };
    
    const nextLesson = () => {
        if (lessonNum < totalLessons - 1) {
            setLessonNum(prevNum => prevNum + 1);
            setPreviousEndSquare(endSquare);
            getCurrentLessonsRef.current(lessonNum + 1);
            setMoves([])
            currentFenRef.current = null;
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
                setLessonNum(prevNum => prevNum + 1);
                getCurrentLessonsRef.current(lessonNum + 1);
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

    const handleVPopup = () => {
        setShowVPopup(false);
        setShowLPopup(true)
        updateCompletionRef.current();
        setMoves([])
        currentFenRef.current = lessonStartFENRef.current
    }

    const handleXPopup = () => {
        setShowXPopup(false);
        handleReset()
    }

    const handleShowInstruction = () => {
        setShowInstruction(false);
    }

    return (
        <div id="lesson-container">
            <div className='left-right-container'>
                <div className="switchLesson" onClick={() => navigate("/lessons-selection")}>Switch Lesson</div>
            </div>
            <div id="chess-board">
                <PlayLesson chessLessonSrc={environment.urls.chessClientURL} />
            </div>
            <div className='right-container'>
                {/* Description part */}
                <div className='lesson-header'>
                <h1 className="piece_description">{piece}</h1>
                <button className='reset-lesson' onClick={handleReset}>
                    <RedoIcon className='reset-icon'/>
                </button>
                </div>
    
                <h1 className='subheading'>{lessonNum + 1} / {totalLessons}: {name}</h1>
                <p className="lesson-description">{info}</p>
    
                <div className='prev-next-button-container'>
                {
                    lessonNum <= 0? (
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
    
                {lessonNum >= totalLessons - 1? (
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
            
            {showLPopup && (
                <div className="popup">
                    <div className="popup-content">
                    <div className="loading-spinner">
                        <svg width="80" height="80" viewBox="0 0 120 120">
                        <circle
                            className="spinner"
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke="#a3d0ff"
                            strokeWidth="6"
                        ></circle>
                        </svg>
                    </div>
                    <p className="popup-header">Loading lesson...</p>
                    <p className="popup-subheading">Please wait</p>
                    </div>
                </div>
            )}

            {showInstruction && (
                <div className="popup">
                    <div className="popup-content">
                    <p className="popup-header">Read this instruction:</p>
                    <p className="popup-subheading">{info}</p>
                    <button className="popup-button" onClick={handleShowInstruction}>Finished reading!</button>
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