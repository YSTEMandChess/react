import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useCookies } from 'react-cookie';
import { environment } from '../../../environments/environment';
import pageStyles from './lesson-overlay.module.scss';
import profileStyles from './lesson-overlay-profile.module.scss';
// @ts-ignore
import MoveTracker from '../move-tracker/MoveTracker';
import { Chess } from 'chess.js';
import { ReactComponent as RedoIcon } from '../../../images/icons/icon_redo.svg';
import { ReactComponent as BackIcon} from '../../../images/icons/icon_back.svg';
import { ReactComponent as BackIconInactive} from '../../../images/icons/icon_back_inactive.svg';
import { ReactComponent as NextIcon } from '../../../images/icons/icon_next.svg';
import { ReactComponent as NextIconInactive } from '../../../images/icons/icon_next_inactive.svg';
import { useNavigate, useLocation } from 'react-router';

import PromotionPopup from '../../Lessons/PromotionPopup';

// Custom Hooks
import { useChessGameLogic } from './hooks/useChessGameLogic';
import { useLessonManager } from './hooks/useLessonManager';
import { useSocketChessEngine } from './hooks/useSocketChessEngine';
import { useTimeTracking } from './hooks/useTimeTracking';

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

    let isReady = false; // if chess client is ready to receive
    let lessonStarted = false; // if lesson has started

    // Information for lesson
    const [piece, setPiece] = useState("Checkmate Pattern 1 Recognize the patterns"); // which category of lessons
    const lessonStartFENRef = useRef("");
    const lessonEndFENRef = useRef("");
    const lessonTypeRef = useRef("default");
    const [endSquare, setEndSquare] = useState("");
    const [previousEndSquare, setPreviousEndSquare] = useState("");
    const turnRef = useRef("white");
    const [name, setName] = useState(""); // name of lesson
    const [info, setInfo] = useState(""); // description of lesson

    // Information needed for move tracker
    const [level, setLevel] = useState(20);

    // Controlling popups
    const [showVPopup, setShowVPopup] = useState(false);
    const [showXPopup, setShowXPopup] = useState(false);
    const [ShowError, setShowError] = useState(false);
    const [showLPopup, setShowLPopup] = useState(true);
    const [showInstruction, setShowInstruction] = useState(false);

    const [isPromoting, setIsPromoting] = useState(false);
    const [promotionSource, setPromotionSource] = useState("");
    const [promotionTarget, setPromotionTarget] = useState("");

    // callback for the socketChessEngine
    const handleEvaluationComplete = useCallback((data) => {
        const iframe = document.getElementById('chessBd') as HTMLIFrameElement | null;
        const chessBoard = iframe?.contentWindow;

        const message = JSON.stringify({
            boardState: data.newFEN || "", // fallback if only engineOutput sent
            color: turnRef.current,
            lessonFlag: false,
        });

        prevFenRef.current = currentFenRef.current;
        currentFenRef.current = data.newFEN;
        processMove();

        if (isReady && chessBoard) {
            chessBoard.postMessage(message, environment.urls.chessClientURL);
        }
    }, []);

    // FROM CUSTOM HOOKS
    const socketRef = useSocketChessEngine(handleEvaluationComplete);
    
    const {
        lessonData,
        lessonNum,
        completedNum,
        totalLessons,
        getLessonsCompletedRef,
        getTotalLessonsRef,
        getCurrentLessonsRef,
        updateCompletionRef,
        setLessonNum,
    } = useLessonManager(piece, cookies, passedLessonNumber);

    const { 
        moves, 
        processMove, 
        resetLesson, 
        currentFenRef, 
        prevFenRef 
    } = useChessGameLogic();

    useTimeTracking(piece, cookies);

    // eventer setup and socket communication
    useEffect(() => {
        // configure eventer
        const eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
        const eventer = window[eventMethod];
        const messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

        const handleMessage = async (e) => {
            console.log(e);
            if (e.origin === environment.urls.chessClientURL) {
                console.log("e.data!!!!", e.data)
                // if client is ready to receive
                if (e.data === 'ReadyToRecieve') {
                    isReady = true;
                    getTotalLessonsRef.current()
                }
                // start lesson if not already
                if (!lessonStarted) {
                    getLessonsCompletedRef.current();
                    lessonStarted = true;
                } else if (e.data === lessonEndFENRef.current ) { 
                    setShowVPopup(true); // complete lesson
                } else if (typeof e.data === 'string' && e.data.startsWith("won")) { // for all lesson types, should check if there's checkmate
                    if (e.data.split(":")[1] == turnRef.current) setShowVPopup(true); // checkmated, complete lesson
                    else setShowXPopup(true) // opponent checkmated, restart lesson
                } else if (typeof e.data === 'string' && e.data.startsWith("draw")){ // for all lesson types, should check if there's a draw
                    if (lessonTypeRef.current == "draw" || lessonTypeRef.current == "equalize"){
                        setShowVPopup(true); // if lesson's goal is to draw or equalize
                    } else {
                        setShowXPopup(true) // if other lesson type, a draw is a failed lesson
                    }
                } else if (e.data.action == "promote"){
                    if(lessonTypeRef.current == "promote") // if the goal of lesson is just to promote pawn
                    {
                        setShowVPopup(true); // lesson completed
                    } else { // for other lesson types, allow user to choose what the pawn should promote to
                        setIsPromoting(true);
                        setPromotionSource(e.data.from);
                        setPromotionTarget(e.data.to);
                    }
                } else if (typeof e.data === 'string' && looksLikeFEN(e.data)) { // client sends board fen after user makes a move
                    // update fens
                    prevFenRef.current = currentFenRef.current
                    currentFenRef.current = e.data

                    // process the move for tracking
                    processMove() 

                    socketRef.current.emit("evaluate-fen", {
                        fen: e.data,
                        move: "",
                        level: level
                    });

                    console.log("FEN SENT to stockfishServer");
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

            if(navigateFunc) navigateFunc();
        };
    }, []);

    // react to lessonData changes
    useEffect(() => {
        if (!lessonData) return;

        setShowLPopup(false);
        setShowInstruction(true);

        // Check if we've reached the end of lessons
        if (!lessonData.lessonNum) {
            alert('Congratulations! You have completed all lessons for this piece.');
            return
        }

        // Update lesson data & info
        lessonStartFENRef.current = lessonData.startFen
        lessonEndFENRef.current = lessonData.endFen
        currentFenRef.current = lessonData.startFen
        turnRef.current = getTurnFromFEN(lessonData.startFen)
        setInfo(lessonData.info)
        setName(lessonData.name)

        // update lesson type for completion checking
        if(lessonData.info.includes("Checkmate the opponent") || lessonData.name.includes("= Win")){
            lessonTypeRef.current = "checkmate";
        } else if (lessonData.info.includes("Get a winning position")) {
            lessonTypeRef.current = "position";
        }  else if (lessonData.info.includes("Equalize in")) {
            lessonTypeRef.current = "equalize";
        } else if (lessonData.info.includes("promote your pawn")) {
            lessonTypeRef.current = "promote";
        } else if (lessonData.info.includes("Hold the draw") || lessonData.name.includes("Draw")) {
            lessonTypeRef.current = "draw";
        } else {
            lessonTypeRef.current = "default";
        }

        // Update the session's fen
        socketRef.current.emit("update-fen", { fen: lessonData.startFen });

        sendLessonToChessBoard();

    }, [lessonData]);

    // send lesson to chess client to update UI
    const sendLessonToChessBoard = () => {
        // get board iframe
        const iframe = document.getElementById('chessBd') as HTMLIFrameElement | null;
        const chessBoard = iframe?.contentWindow;

        // post message to client
        const message = JSON.stringify({
            boardState: lessonStartFENRef.current,
            endState: lessonEndFENRef.current,
            lessonFlag: true, 
            choosePromotionFlag: true, // the user can select what to promote
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
            resetLesson(null);
        }
    };
    
    // Navigate to next lesson
    const nextLesson = () => {
        if (lessonNum < completedNum && lessonNum < totalLessons - 1) { // no navigation beyond first uncompleted lesson or last lesson
            // update and fetch next lesson
            setLessonNum(prevNum => prevNum + 1);
            getCurrentLessonsRef.current(lessonNum + 1);

            // clear move tracker
            resetLesson(null);
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
        resetLesson(lessonStartFENRef.current)
    }

    // user agrees to complete lesson
    const handleVPopup = () => {
        setShowVPopup(false); // disable popup
        setShowXPopup(false);
        if(lessonNum < totalLessons - 1) setShowLPopup(true) // load next lesson
        updateCompletionRef.current(); // update # of lessons completed

        // clean move tracker
        resetLesson(lessonStartFENRef.current)
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

    function promotePawn(position, piece) {
        setIsPromoting(false);
        
        // get chessBoard iframe
        const iframe = document.getElementById('chessBd') as HTMLIFrameElement | null;
        const chessBoard = iframe?.contentWindow;

        // to alert client of new promotion
        const message = JSON.stringify({ delayedPromote: true, from: promotionSource, to: promotionTarget, promotion: piece.toLowerCase()});
        chessBoard.postMessage(message, environment.urls.chessClientURL);
    }

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
                    <button className={styles.resetLesson} data-testid="reset-button" onClick={handleReset}>
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
                    { styleType != 'profile' && (<MoveTracker moves={moves} />) }
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
            {showXPopup && !showVPopup && (
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
            {/* <button onClick={handleVPopup}>mock complete</button> */}

            {isPromoting ? <PromotionPopup position={promotionSource} promoteToPiece={promotePawn} /> : null /* Show promotion popup if needed */}
        </div>
    );
};

export default LessonOverlay;