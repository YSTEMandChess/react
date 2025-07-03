import React, { useEffect, useState, useRef } from 'react';
import { useCookies } from 'react-cookie';
import { environment } from '../../../environments/environment';
import pageStyles from './lesson-overlay.module.scss';
import profileStyles from './lesson-overlay-profile.module.scss';
import { SetPermissionLevel } from "../../../globals"; 
// @ts-ignore
import MoveTracker from '../move-tracker/MoveTracker';
import { Chess } from 'chess.js';
import { ReactComponent as RedoIcon } from '../../../images/icons/icon_redo.svg';
import { ReactComponent as BackIcon} from '../../../images/icons/icon_back.svg';
import { ReactComponent as BackIconInactive} from '../../../images/icons/icon_back_inactive.svg';
import { ReactComponent as NextIcon } from '../../../images/icons/icon_next.svg';
import { ReactComponent as NextIconInactive } from '../../../images/icons/icon_next_inactive.svg';
import { useNavigate, useLocation } from 'react-router';

// types for the component props
type LessonOverlayProps = {
  propPieceName?: any;
  propLessonNumber?: any;
  navigateFunc?: any;
  styleType?: any;
};

const LessonOverlay: React.FC<LessonOverlayProps> = ({
        propPieceName = null, 
        propLessonNumber = null,
        navigateFunc = null,
        styleType = "page"
    }) => {

    const styles = styleType === 'profile' ? profileStyles : pageStyles;

    const navigate = useNavigate();
    const location = useLocation();
    let passedPieceName = location.state?.piece; // if received from page navigation
    if(propPieceName) passedPieceName = propPieceName;
    let passedLessonNumber = location.state?.lessonNum; // if received from parent props
    if(propLessonNumber != null) passedLessonNumber = propLessonNumber;
    const [cookies] = useCookies(['login']);
    const [username, setUsername] = useState(null);

    // info needed for time tracking
    const [eventID, setEventID] = useState(null);
    const [startTime, setStartTime] = useState(null);

    let isReady = false; // if chess client is ready to receive
    let lessonStarted = false; // if lesson has started

    // Information for lesson
    const [piece, setPiece] = useState("Checkmate Pattern 1 Recognize the patterns"); // which category of lessons
    const lessonStartFENRef = useRef("");
    let lessonEndFEN = "";
    const [lessonNum, setLessonNum] = useState(0); // current lesson number, 0-indexed
    const [completedNum, setCompletedNum] = useState(0); // # of lessons completed
    const [totalLessons, setTotalLessons] = useState(0); // # of lessons in the category
    const [endSquare, setEndSquare] = useState('');
    const [previousEndSquare, setPreviousEndSquare] = useState('');
    const turnRef = useRef("white");
    const [name, setName] = useState(""); // name of lesson
    const [info, setInfo] = useState(""); // description of lesson

    // Information needed for move tracker
    const prevFenRef = useRef(null)
    const currentFenRef = useRef(null);
    const [moves, setMoves] = useState([])
    const [level, setLevel] = useState(5);

    // Controlling popups
    const [showVPopup, setShowVPopup] = useState(false);
    const [showXPopup, setShowXPopup] = useState(false);
    const [ShowError, setShowError] = useState(false);
    const [showLPopup, setShowLPopup] = useState(true);
    const [showInstruction, setShowInstruction] = useState(false);

    // Use Refs, so functions in event handler can access latest updated variable values
    const getLessonsCompletedRef = useRef(() => {});
    const updateCompletionRef = useRef(() => {});
    const getTotalLessonsRef = useRef(() => {});
    const getCurrentLessonsRef = useRef<(input: number) => void>(() => {});
    const handleUnloadRef = useRef(() => {});

    useEffect(() => {
        startRecording(); // start recording
        window.addEventListener('beforeunload', handleUnloadRef.current); // when unloaded, end recording

        // configure eventer
        const eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
        const eventer = window[eventMethod];
        const messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

        const handleMessage = async (e) => {
            if (e.origin === environment.urls.chessClientURL) {
                // if client is ready to receive
                if (e.data === 'ReadyToRecieve') {
                    isReady = true;
                    getTotalLessonsRef.current()
                }
                // start lesson if not already
                if (!lessonStarted) {
                    getLessonsCompletedRef.current();
                    lessonStarted = true;
                } else if (e.data === lessonEndFEN ) { 
                    setShowVPopup(true); // complete lesson
                } else if (e.data.startsWith("won")) {
                    if (e.data.split(":")[1] == turnRef.current) setShowVPopup(true); // checkmated, complete lesson
                    else setShowXPopup(true) // opponent checkmated, restart
                } else if (e.data.startsWith("restart")){ // game ended without winning
                    setShowXPopup(true)
                }  else if (looksLikeFEN(e.data)) { // client sends board fen after user makes a move
                    // update fens
                    prevFenRef.current = currentFenRef.current
                    currentFenRef.current = e.data

                    // process the move for tracking
                    processMove()

                    const iframe = document.getElementById('chessBd') as HTMLIFrameElement | null;
                    const chessBoard = iframe?.contentWindow;

                    httpGetAsync( // get the next opponent move from stockfish
                        `${environment.urls.stockFishURL}/?level=${level}&fen=${e.data}`,
                        (response) => {
                            const data = JSON.parse(response)
                            const message = JSON.stringify({ boardState: data.fen, color: turnRef.current, lessonFlag: false});
                            // update fens
                            prevFenRef.current = currentFenRef.current
                            currentFenRef.current = data.fen

                            // process the move for tracking
                            processMove()

                            if (isReady) { // sends opponent moved board to client to update UI
                                chessBoard.postMessage(message, environment.urls.chessClientURL);
                            }
                        }
                    );
                }
            }
        };

        eventer(messageEvent, handleMessage, false); // fire eventer

        // Check if passedPieceName is available
        if (passedPieceName != null) setPiece(passedPieceName);
        // Check if passedLessonNumber is available
        if (passedLessonNumber != null) setLessonNum(passedLessonNumber);

        return () => {
            window.removeEventListener('message', handleMessage); // remove event listener
            window.removeEventListener('beforeunload', handleUnloadRef.current); // remove listener when unloading
            handleUnloadRef.current(); // when navigating away, stop recording time spent
            if(navigateFunc) navigateFunc();
        };
    }, []);

    // get # of completed lessons for this category
    getLessonsCompletedRef.current = async () => {
        try {
            // update # of completed lessons
            const response = await fetch(
            `${environment.urls.middlewareURL}/lessons/getCompletedLessonCount?piece=${piece}`, 
            {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${cookies.login}` }
            }
            );
            const completedCount = await response.json();
            setCompletedNum(completedCount);

            if (passedLessonNumber != null) {
                // if navigated from menu, with specified lesson number
                getCurrentLessonsRef.current(passedLessonNumber);
            } else {
                // if directly navigated, current lesson is the next not completed lesson
                setLessonNum(completedCount);
                getCurrentLessonsRef.current(completedCount);
            }
        } catch (error) {
            console.error('Error fetching completed lessons:', error);
            setShowError(true)
        }
    };

    // get the lesson content for a specific number
    getCurrentLessonsRef.current = async (lessonNumber) => {
        try {
            // fetch lesson content
            setShowLPopup(true) // loading popup to wait for response
            let timeoutId = setTimeout(() => { // set time out to prevent fetching from taking too long
                setShowError(true);
            }, 10000);

            const response = await fetch(
            `${environment.urls.middlewareURL}/lessons/getLesson?piece=${piece}&lessonNum=${lessonNumber + 1}`,
            {
                method: 'GET', 
                headers: { 'Authorization': `Bearer ${cookies.login}` }
            }
            );
            const lessonData = await response.json();
            setShowLPopup(false); // disable loading
            clearTimeout(timeoutId); // clear the timeout if fetch succeeded
            setShowInstruction(true); // make sure user reads instruction first

            // Update lesson data & info
            lessonStartFENRef.current = lessonData.startFen
            currentFenRef.current = lessonData.startFen
            turnRef.current = getTurnFromFEN(lessonData.startFen)
            setInfo(lessonData.info)
            setName(lessonData.name)
            
            // Check if we've reached the end of lessons
            if (!lessonData || lessonData.lessonNum === undefined) {
                alert('Congratulations! You have completed all lessons for this piece.');
                return
            }
            // if not, let client update board UI 
            sendLessonToChessBoard();

        } catch (error) {
            console.error('Error fetching lesson:', error);
        }
    };

    // get total # of lessons for category
    getTotalLessonsRef.current = async () => {
        try {
            // fetch
            const response = await fetch(
            `${environment.urls.middlewareURL}/lessons/getTotalPieceLesson?piece=${piece}`,
            {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${cookies.login}` }
            }
            );
            const total = await response.json();
            setTotalLessons(total); // update in UI
        } catch (error) {
            console.error('Error fetching total lessons:', error);
        }
    };

    // Update the user's lesson progress in this category
    updateCompletionRef.current = async () => {
        try {      
            if (lessonNum === completedNum) { // allow back end update only for the first unfinished lesson
                setCompletedNum(prevNum => prevNum + 1);
                await fetch(
                `${environment.urls.middlewareURL}/lessons/updateLessonCompletion?piece=${piece}&lessonNum=${lessonNum}`,
                {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${cookies.login}` }
                })
            };

            if (lessonNum < totalLessons - 1) {
                // Move to next lesson if there are any
                setLessonNum(prevNum => prevNum + 1);
                getCurrentLessonsRef.current(lessonNum + 1);
            }
        } catch (error) {
            console.error('Error updating lesson completion:', error);
        }
    };

    // send data to stock fish
    const httpGetAsync = (theUrl, callback) => {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) callback(xmlHttp.responseText);
        };
        xmlHttp.open('POST', theUrl, true);
        xmlHttp.send(null);
    };

    // send lesson to chess client to update UI
    const sendLessonToChessBoard = () => {
        // get board iframe
        const iframe = document.getElementById('chessBd') as HTMLIFrameElement | null;
        const chessBoard = iframe?.contentWindow;

        // post message to client
        const message = JSON.stringify({
            boardState: lessonStartFENRef.current,
            endState: lessonEndFEN,
            lessonFlag: true,
            endSquare,
            color: turnRef.current,
            previousEndSquare,
            clearhighlight: true
        });
        chessBoard.postMessage(message, environment.urls.chessClientURL);
    };

    // Navigate to previous lesson
    const previousLesson = () => {
        if (lessonNum > 0) { // if there is a previous lesson
            // update and fetch previous lesson
            setLessonNum(prevNum => prevNum - 1);
            getCurrentLessonsRef.current(lessonNum - 1);

            // clear move tracker
            setMoves([])
            currentFenRef.current = null;
        }
    };
    
    // Navigate to next lesson
    const nextLesson = () => {
        if (lessonNum < completedNum && lessonNum < totalLessons - 1) { // no navigation beyond first uncompleted lesson or last lesson
            // update and fetch next lesson
            setLessonNum(prevNum => prevNum + 1);
            getCurrentLessonsRef.current(lessonNum + 1);

            // clear move tracker
            setMoves([])
            currentFenRef.current = null;
        }
    };

    // reset board to play again
    function handleReset() {
        // get chessBoard iframe
        const iframe = document.getElementById('chessBd') as HTMLIFrameElement | null;
        const chessBoard = iframe?.contentWindow;

        // for client to reset board
        const message = JSON.stringify({ boardState: lessonStartFENRef.current, color: turnRef.current, lessonFlag: false, clearhighlight: true});
        chessBoard.postMessage(message, environment.urls.chessClientURL);

        // clean move tracker
        setMoves([])
        currentFenRef.current = lessonStartFENRef.current
    }

    // user agrees to complete lesson
    const handleVPopup = () => {
        setShowVPopup(false); // disable popup
        setShowLPopup(true) // load next lesson
        updateCompletionRef.current(); // update # of lessons completed

        // clean move tracker
        setMoves([])
        currentFenRef.current = lessonStartFENRef.current
    }

    // user agrees to restart lesson after failure
    const handleXPopup = () => {
        setShowXPopup(false);
        handleReset()
    }

    // user finished instruction reading
    const handleShowInstruction = () => {
        setShowInstruction(false);
    }

    // checks if a client message is a fen
    function looksLikeFEN(str) {
        return typeof str === 'string' && str.split(' ').length === 6;
    }

    // calculate which turn is playing , black or white
    function getTurnFromFEN(fen) {
        if (!fen || typeof fen !== 'string') {
            throw new Error('Invalid FEN string');
        }

        const parts = fen.split(' ');
        const turn = parts[1];

        if (turn === 'w') return 'white';
        if (turn === 'b') return 'black';

        throw new Error('Could not determine turn from FEN');
    }

    // update the moves for tracking
    function processMove() {
        // if previous fen is not set (ie the first move has not been made), do nothing
        if (prevFenRef.current) {
            const move = getMoveFromFens(prevFenRef.current, currentFenRef.current)
            // if the move is not null, update the moves (the move will be null only when the computer makes no move ie checkmate or statemate)
            if (move) {
                setMoves(prev => [...prev, move]) // update moves
            }
            
        }
    }

    // Calculate what move is made by board fen before & after the move
    function getMoveFromFens(prevFEN, currFEN) {
        const chess = new Chess(prevFEN)
        const moves = chess.moves({verbose: true})

        for (let i = 0; i < moves.length; i++) {
            const possibleChess = new Chess(prevFEN)
            possibleChess.move(moves[i])
            
            if (getPositionKey(possibleChess.fen()) === getPositionKey(currFEN)) {
                return moves[i].san
            }
        }

        // move not found
        return null
    }

    function getPositionKey(fen) {
        // only compare the first 4 parts of the FEN (board, active color, castling, en passant)
        if(!fen) return;
        return fen.split(" ").slice(0, 3).join(" ")
    }

    // start recording when users started browsing website
    async function startRecording() {
        const uInfo = await SetPermissionLevel(cookies); // get logged-in user info

        // do nothing if the user is not logged in
        if(uInfo.error) return;
        setUsername(uInfo.username); // else record username

        // start recording user's time spent browsing the website
        const response = await fetch(
        `${environment.urls.middlewareURL}/timeTracking/start?username=${uInfo.username}&eventType=lesson&eventName=${piece}`, 
        {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${cookies.login}` }
        }
        );
        if(response.status != 200) console.log(response) // error handling

        // if data is fetched, record for later updates
        const data = await response.json();
        setEventID(data.eventId);
        setStartTime(data.startTime);
    }

    // handler called when user exist the website, complete recording time
    handleUnloadRef.current = async () => {
        try {
            const startDate = new Date(startTime)
            const endDate = new Date();
            const diffInMs = endDate.getTime() - startDate.getTime(); // time elapsed in milliseconds
            const diffInSeconds = Math.floor(diffInMs / 1000); // time elapsed in seconds

            // update the time users spent browsing website
            const response = await fetch(
                `${environment.urls.middlewareURL}/timeTracking/update?username=${username}&eventType=lesson&eventId=${eventID}&totalTime=${diffInSeconds}&eventName=${piece}`, 
                {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${cookies.login}` }
                }
            );
            console.log("i put in eventname", piece)
            if(response.status != 200) console.log(response) // error handling
        } catch (err) {
            console.log(err)
        }
    };

    return (
        <div className={styles.lessonContainer}>
            <div className={styles.switchLesson} onClick={() => {
                if(navigateFunc) navigateFunc();
                else navigate("/lessons-selection");
            }}>Switch Lesson</div>
            <div className={styles.container}>
                <div className={styles.rightContainer}>
                    {/* Lesson info */}
                    <div className={styles.lessonHeader}>
                    <h1 className={styles.pieceDescription}>{piece}</h1>
                    <button className={styles.resetLesson} onClick={handleReset}>
                        <RedoIcon/>
                    </button>
                    </div>
                    <h1 className={styles.subheading}>{lessonNum + 1} / {totalLessons}: {name}</h1>
                    <p className={styles.lessonDescription}>{info}</p>
        
                
                    {/* deactivate previous button, if there are no lessons before it*/}
                    <div className={styles.prevNextContainer}>
                    {
                        lessonNum <= 0? ( 
                        <button className={[styles.prevNextLessonButtonInactive, styles.prev].join(' ')}>
                            <BackIconInactive/>
                            <p className={styles.buttonDescription}>Back</p>
                        </button>
                        ) : (
                            
                        <button className={[styles.prevNextLessonButton, styles.prev].join(' ')} onClick={previousLesson}>
                            <BackIcon/>
                            <p className={styles.buttonDescription}>Back</p>
                        </button>
                        )
                    }
        
                    {/* deactivate next button, if it goes beyond first uncompleted, or beyond last available lesson */}
                    {((lessonNum >= completedNum) || (lessonNum >= totalLessons - 1))? (
                        <button className={[styles.prevNextLessonButtonInactive, styles.next].join(' ')}>
                            <p className={styles.buttonDescription}>Next</p>
                            <NextIconInactive/>
                        </button>
                        ) : (
                        <button className={[styles.prevNextLessonButton, styles.next].join(' ')} onClick={nextLesson}>
                            <p className={styles.buttonDescription}>Next</p>
                            <NextIcon/>
                        </button>
                        )
                    }
                    </div>
                    {/* <MoveTracker moves={moves} /> */}
                </div>
                <iframe src={environment.urls.chessClientURL} className={styles.chessBoard} id="chessBd" title="Chess Lesson Board"/>
            </div>
            {/* connection error popup */}
            {ShowError && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                    <div className={styles.errorCross}>
                        <svg width="80" height="80" viewBox="0 0 120 120">
                        <circle
                            className={styles.circle}
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke="#f57c7c"
                            strokeWidth="6"
                        ></circle>
                        <path
                            d="M40 40 L80 80"
                            fill="none"
                            stroke="#f57c7c"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />
                        <path
                            d="M80 40 L40 80"
                            fill="none"
                            stroke="#f57c7c"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />
                        </svg>
                    </div>
                    <p className={styles.popupHeader}>Failed to load content</p>
                    <p className={styles.popupSubheading}>Please reload page</p>
                    </div>
                </div>
                )}
            
            {/* lesson completed popup */}
            {showVPopup && (
                <div className={styles.popup}>
                <div className={styles.popupContent}>
                    <div className={styles.successCheckmark}>
                    <svg width="80" height="80" viewBox="0 0 120 120">
                        <circle className={styles.circle} cx="60" cy="60" r="54" fill="none" stroke="#beea8b" stroke-width="6"></circle>
                        <path className={styles.checkmark} d="M35 60 L55 80 L85 40" fill="none" stroke="#beea8b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    </div>
                    <p className={styles.popupHeader}>Lesson completed</p>
                    <p className={styles.popupSubheading}>Good job</p>
                    <button className={styles.popupButton} onClick={handleVPopup}>OK</button>
                </div>
                </div>
            )}

            {/* lesson not done yet popup */}
            {showXPopup && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                    <div className={styles.errorCross}>
                        <svg width="80" height="80" viewBox="0 0 120 120">
                        <circle
                            className={styles.circle}
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke="#f57c7c"
                            strokeWidth="6"
                        ></circle>
                        <path
                            d="M40 40 L80 80"
                            fill="none"
                            stroke="#f57c7c"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />
                        <path
                            d="M80 40 L40 80"
                            fill="none"
                            stroke="#f57c7c"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />
                        </svg>
                    </div>
                    <p className={styles.popupHeader}>Lesson failed</p>
                    <p className={styles.popupSubheading}>Please try again</p>
                    <button className={styles.popupButton} onClick={handleXPopup}>OK</button>
                    </div>
                </div>
                )}
            
            {/* loading to wait for lesson fetching */}
            {showLPopup && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                    <div className={styles.loadingSpinner}>
                        <svg width="80" height="80" viewBox="0 0 120 120">
                        <circle
                            className={styles.spinner}
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke="#a3d0ff"
                            strokeWidth="6"
                        ></circle>
                        </svg>
                    </div>
                    <p className={styles.popupHeader}>Loading lesson...</p>
                    <p className={styles.popupSubheading}>Please wait</p>
                    </div>
                </div>
            )}

            {/* have users read instructions first */}
            {showInstruction && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                    <p className={styles.popupHeader}>Read this instruction:</p>
                    <p className={styles.popupSubheading}>{info}</p>
                    <button className={styles.popupButton} onClick={handleShowInstruction}>Finished reading!</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default LessonOverlay;