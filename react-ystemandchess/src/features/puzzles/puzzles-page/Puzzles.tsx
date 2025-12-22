import React, { useRef, useState, useEffect } from "react";
import pageStyles from "./Puzzles.module.scss";
import profileStyles from "./Puzzles-profile.module.scss";
import { Chess } from "chess.js";
import { themesName, themesDescription } from "../../../core/services/themesService";
import Swal from 'sweetalert2';
import { environment } from "../../../environments/environment";
import { v4 as uuidv4 } from "uuid";
import { SetPermissionLevel } from "../../../globals";
import { useCookies } from 'react-cookie'; 

const chessClientURL = environment.urls.chessClientURL;

// Global variables (keeping similar to Angular version)
let puzzleIndex = 0;
var moveList: string[] = [];
var computerColor: string;
var isPuzzleEnd = false;
var prevFEN: string;
var currentPuzzle: any;

// types for the puzzle props
type PuzzlesProps = {
  student?: any;
  mentor?: any;
  role?: any;
  styleType?: any;
};

const Puzzles: React.FC<PuzzlesProps> = ({
  student = null,
  mentor = null,
  role = "student",
  styleType = "page"
}) => {
  const styles = styleType === "profile" ? profileStyles : pageStyles;

    const chessboard = useRef<HTMLIFrameElement>(null);
    const [puzzleArray, setPuzzleArray] = useState<any[]>([]);
    const [playerMove, setPlayerMove] = useState<string[]>([]);
    const [prevMove, setPrevMove] = useState<string[]>([]);
    const [currentFen, setCurrentFen] = useState<string>('');
    const [prevFen, setPrevFen] = useState<string>('');
    const [dbIndex, setDbIndex] = useState<number>(0);
    const [info, setInfo] = useState<string>("Welcome to puzzles");
    const [playerColor, setPlayerColor] = useState<string>('');
    const [themeList, setThemeList] = useState<string[]>([]);
    const [status, setStatus] = useState<string>("");
    const swalRef = useRef<string>("");
    const [cookies] = useCookies(['login']);

    // needed for time tracking
    const [eventID, setEventID] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [username, setUsername] = useState(null);
    const handleUnloadRef = useRef(() => {});

    const postToBoard = (msg: any) => {
    const board = chessboard.current;
    if (!board || !board.contentWindow) return;

    const payload: any = { ...msg };

    if (msg.from && msg.to && !msg.nextMove) {
        const tempChess = new Chess(prevFEN);
        try {
            const moveResult = tempChess.move({
                from: msg.from,
                to: msg.to,
                promotion: 'q'
            });

            if (!moveResult) {
                console.warn("Invalid move (null):", msg);
                return;
            }

            prevFEN = tempChess.fen();
            payload.testFEN = prevFEN; // add for testing
        } catch (error) {
            console.warn("Invalid move (exception):", msg, error);
            return;
        }
    }

    board.contentWindow.postMessage(JSON.stringify(payload), chessClientURL);
  };

    // Helper: Play the next computer move from moveList, update FEN, and highlight
    const playComputerMove = () => {
      if (moveList.length === 0) return;
      const computerMove = moveList.shift();
      if (!computerMove) return;
      const moveFrom = computerMove.substring(0, 2);
      const moveTo = computerMove.substring(2, 4);

      setPrevMove([moveFrom, moveTo]); // For highlighting

      setTimeout(() => {
          // Do NOT update FEN here — let iframe do it
          // Do NOT include boardState in this message
          const chessBoard = chessboard.current;
          if (chessBoard && chessBoard.contentWindow) {
              const expectedMove = moveList[0];
            if (!expectedMove || expectedMove.length < 4) {
                console.warn("Expected move missing or invalid:", expectedMove);
                return;
            }


              chessBoard.contentWindow.postMessage(
                  JSON.stringify({
                      from: moveFrom,
                      to: moveTo,
                      nextMove: [
                          expectedMove.substring(0, 2),
                          expectedMove.substring(2, 4),
                      ],
                  }),
                  chessClientURL
              );
          }
      }, 300);
  };

    const setStateAsActive = (state: any) => {
        if (!state?.FEN || !state?.Moves || !state?.Themes) {
            console.warn("Puzzle is missing required fields:", state);
            return;
        }
        console.log("click state---->", state);
        // Determine which side is to move in the FEN
        const sideToMove = state.FEN.split(" ")[1];
        // Player is the opposite color
        const newPlayerColor = sideToMove === 'w' ? 'b' : 'w';
        setPlayerColor(newPlayerColor);
        

        const firstObj = {
            'theme': state.Themes,
            'fen': state.FEN,
            'event': ''
        };
        console.log("first obj---->", firstObj);

        setTimeout(() => {
            currentPuzzle = state;
            startLesson(firstObj);
        }, 200);
    };

    const startLesson = ({ theme, fen, event }: { theme: string, fen: string, event: string }) => {
        if (!fen || fen.split("/").length !== 8) {
            console.warn("Invalid or missing FEN:", fen);
            return;
        }
      setCurrentFen(fen);
      prevFEN = fen;
      
      moveList = currentPuzzle?.Moves?.split(" ") || [];
      if (moveList.length === 0) {
        console.warn("Empty or invalid moveList:", currentPuzzle);
        return;
      }

      isPuzzleEnd = false;
      setPrevMove(["", ""]);

      setTimeout(() => {
        if (!fen || fen.split(" ").length < 2 || fen.split("/").length !== 8) {
            console.warn("Invalid FEN detected before sending to iframe:", fen);
            return;
        }

        const hintText = document.getElementById("hint-text");
        if(!hintText) return;

        // 1. First send puzzle setup
        postToBoard({
            PuzzleId: currentPuzzle?.PuzzleId,
            FEN: fen,
            Moves: currentPuzzle?.Moves,
            Rating: currentPuzzle?.Rating,
            Themes: currentPuzzle?.Themes,
            Hints: hintText.innerHTML
        });

        // 2. Wait for setup, then send the first computer move if needed
        setTimeout(() => {
            // If the puzzle starts with a computer move, play it
            const tempChess = new Chess(fen);

            // First move is always by computer
            playComputerMove();

            // Otherwise, wait for player move
        }, 200);
      }, 200);
    };

    const getNextPuzzle = () => {
        if (!puzzleArray || puzzleArray.length === 0) {
            console.error("Puzzle array is empty");
            return;
        }
        console.log("getting new puzzle...");
    
        const newDbIndex = (dbIndex + 1) % puzzleArray.length;
        setDbIndex(newDbIndex);
    
        const nextPuzzle = puzzleArray[newDbIndex];
        if (!nextPuzzle.Moves) {
            console.error("Selected puzzle has no moves");
            return;
        }
    
        currentPuzzle = nextPuzzle; // Set currentPuzzle before calling setStateAsActive
        isPuzzleEnd = false;
        setPrevMove(["", ""]); // Reset prevMove for highlighting
    
        setThemeList(nextPuzzle.Themes.split(" "));
        console.log("Loading puzzle:", nextPuzzle.PuzzleId, "with FEN:", nextPuzzle.FEN);
        if (!nextPuzzle?.FEN || nextPuzzle.FEN.split("/").length !== 8) {
            console.warn("Skipping puzzle with invalid FEN:", nextPuzzle);
            return;
        }
        setStateAsActive(nextPuzzle); // This will call startLesson
        updateInfoBox(nextPuzzle.Themes.split(" "));
    };

    const isFEN = (data: string): boolean => {
        return data.split("/").length === 8;
    };

    const shuffleArray = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    const initPuzzleArray = async () => {
        try {
            const response = await fetch(`${environment.urls.middlewareURL}/puzzles/random?limit=20`);
            if (response.ok) {
                const jsonData = await response.json();
                setPuzzleArray(jsonData);
                return jsonData;
            } else {
                throw new Error('Failed to fetch puzzles from backend');
            }
        } catch (error) {
            console.error('Error fetching puzzles:', error);
            setPuzzleArray([]);
            return [];
        }
    };

    const prefetchPuzzles = async () => {
        try {
            const response = await fetch(`${environment.urls.middlewareURL}/puzzles/random?limit=20`);
            if (response.ok) {
                const jsonData = await response.json();
                setPuzzleArray(prev => [...prev, ...jsonData]);
            }
        } catch (error) {
            console.error('Error prefetching puzzles:', error);
        }
    };

    const updateInfoBox = (themes?: string[]) => {
      const currentThemes = themes || themeList;
      if (!currentThemes || currentThemes.length === 0) return;

      const colorDisplay = playerColor === 'w' ? 'White' : 'Black';
      const rating = currentPuzzle?.Rating || 'N/A';

      let hints = `<div style="margin-bottom: 14px;"><b>Puzzle Rating:</b> ${rating}</div>`;

      for (let i = 0; i < currentThemes.length; i++) {
        const key = currentThemes[i];
        const name = themesName[key] || key;
        const desc = themesDescription[key];

        if (!desc || desc === "No description available") continue;

        hints += `<div style="margin-bottom: 14px;"><b>${name}:</b> ${desc}</div>`;
      }

      // notify other players to also update their hints
      postToBoard({command: "message", message: hints})

      const hintText = document.getElementById("hint-text");
      if (hintText) {
        hintText.innerHTML = hints;
        hintText.style.display = "none"; // Still hidden until Show Hint clicked
      }
    }; 

    const openDialog = () => {
      const hintText = document.getElementById('hint-text');
      if (hintText) {
        hintText.style.display = hintText.style.display === "block" ? "none" : "block";
      }
    };

    // initialize component, fetch puzzles & initiate first puzzle
    const initializeComponent = async () => {
        const puzzles = await initPuzzleArray();
        if (puzzles && puzzles.length > 0) {
            setPuzzleArray(puzzles);
            // Initialize first puzzle
            const firstPuzzle = puzzles[0];
            currentPuzzle = firstPuzzle;
            moveList = firstPuzzle?.Moves?.split(" ") || [];
            if (moveList.length === 0) {
                console.warn("No valid moves in initial puzzle:", firstPuzzle);
                return;
            }

            setThemeList(firstPuzzle.Themes.split(" "));
            setStateAsActive(firstPuzzle);
            updateInfoBox(firstPuzzle.Themes.split(" "));
        }
    };

    // try joining puzzle as guest / creating puzzle as host
    const joinOrCreatePuzzle = () => {
        if(!student) student = uuidv4(); // generate random username for navBar puzzles & unlogged-in users
        if(!mentor) mentor = uuidv4();
        postToBoard({ // send student & mentor info  before server creates a game
            command: "userinfo",
            student: student,
            mentor: mentor,
            role: role
        });
        // try creating / joining, server will then notify whether user is a guest or host
        postToBoard({command: "newPuzzle"}); 
    }

    // start recording when users started browsing website
    async function startRecording() {
        const uInfo = await SetPermissionLevel(cookies); // get logged-in user info

        // do nothing if the user is not logged in
        if(uInfo.error) return;
        setUsername(uInfo.username); // else record username

        // start recording user's time spent browsing the website
        const response = await fetch(
        `${environment.urls.middlewareURL}/timeTracking/start?username=${uInfo.username}&eventType=puzzle`, 
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
                `${environment.urls.middlewareURL}/timeTracking/update?username=${username}&eventType=puzzle&eventId=${eventID}&totalTime=${diffInSeconds}`, 
                {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${cookies.login}` }
                }
            );
            if(response.status != 200) console.log(response) // error handling

            console.log("time spent on puzzles:", diffInSeconds);
        } catch (err) {
            console.log(err)
        }
    };

    useEffect(() => {
        startRecording();
        window.addEventListener('beforeunload', handleUnloadRef.current);

        return () => {
            window.removeEventListener('beforeunload', handleUnloadRef.current); // remove listener when unloading
            handleUnloadRef.current(); // when navigating away, stop recording time spent
        }
    }, [])
    
    useEffect(() => {
        const eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
        const eventer = (window as any)[eventMethod];
        const messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';
    
        const messageHandler = (e: MessageEvent) => {
            let info = e.data;
            if (typeof info === 'string' && info[0] === "{") {
                try {
                    let jsonInfo = JSON.parse(info);
                    if (
                        "from" in jsonInfo && "to" in jsonInfo &&
                        typeof jsonInfo.from === 'string' && typeof jsonInfo.to === 'string' &&
                        jsonInfo.from.length === 2 && jsonInfo.to.length === 2
                    ) {
                        const playerAttemptedMove = `${jsonInfo.from}${jsonInfo.to}`
                        // Only allow if it's the player's turn and moveList[0] is the expected move
                        if (isPuzzleEnd || !moveList || moveList.length === 0) return;

                        const expectedPlayerMove = moveList[0]; 
                        // Now, moveList[0] is always the player's move

                        if (playerAttemptedMove === expectedPlayerMove) {
                            // Correct move
                            moveList.shift(); // Remove player's move

                            setPrevFen(currentFen);

                            if (moveList.length === 0) {
                                isPuzzleEnd = true;
                                setTimeout(() => {
                                    Swal.fire('Puzzle completed', 'Good Job', 'success').then((result) => {
                                        if(result.isConfirmed) postToBoard({command: "message", message: "next puzzle"}); // notify other players to move on to the next puzzle
                                    });
                                }, 200);
                                postToBoard({command: "message", message: "puzzle completed"}) // notify other players of the completed puzzle
                            } else {
                                // Now it's computer's turn, play the next move automatically
                                playComputerMove();
                            }
                        } else {
                            // Incorrect move, reload the puzzle
                            Swal.fire('Incorrect move', 'Try again!', 'error').then(() => {
                                startLesson({
                                    theme: currentPuzzle.Themes,
                                    fen: currentPuzzle.FEN,
                                    event: ''
                                });
                            });
                        }
                    }
                } catch (error) {
                    console.log("Error parsing JSON from iframe:", error);
                }
            } else if (info && typeof info === 'string' && isFEN(info)) {
                // FEN update from iframe (after a move)
                setCurrentFen(info); // Update current FEN based on board's state
                // Highlighting logic for computer's response (if prevMove is set)
                if (prevMove[0] && prevMove[1]) {
                    const chessBoard = chessboard.current;
                    if (chessBoard && chessBoard.contentWindow) {
                        chessBoard.contentWindow.postMessage(
                            JSON.stringify({
                                highlightFrom: prevMove[0],
                                highlightTo: prevMove[1]
                            }),
                            chessClientURL
                        );
                        setPrevMove(["", ""]); // Reset after highlighting
                    }
                }
            } else if (typeof info == "string" && info == "host"){ // user has created a new puzzle in server
                setStatus("host"); // change status
                initializeComponent(); 
                if (styleType === "profile") {
                    if (status){
                        if (role == "student") Swal.fire('Your mentor has left!', 'Creating a new puzzle for you', 'success');
                        else Swal.fire('Your student has left!', 'Creating a new puzzle for you', 'success');
                    } else {
                        if (role == "student") Swal.fire('You hosted a new puzzle!', 'Your mentor might join later', 'success');
                        else Swal.fire('You hosted a new puzzle!', 'Your student might join later', 'success');
                    }
                }
            } else if (typeof info == "string" && info == "guest"){ // user has joined an existing puzzle in server
                if (status == "host") {
                    if (role == "student") Swal.fire('Your mentor has joined you!', 'You can now also see their moves,', 'success');
                    else Swal.fire('Your student has joined you!', 'You can now also see their moves,', 'success');
                } else {
                    setStatus("guest"); 
                    if (role == "student") Swal.fire('You joined your mentor\'s puzzle!', 'Have fun collaborating.', 'success');
                    else Swal.fire('You joined your student\'s puzzle!', 'Have fun collaborating.', 'success');
                }
                // no need to fetch lessons, guest's chessboard is dependent on host's for simplicity
            } else if (typeof info == "string" && info == "puzzle completed" ) { // puzzle completed
                if (status == "guest") { // host would already have fired alert
                    Swal.fire('Puzzle completed', 'Good Job', 'success').then((result) => {
                        if(result.isConfirmed) postToBoard({command: "message", message: "next puzzle"}); // notify other players to move on to the next puzzle
                    });
                }
            } else if (typeof info == "string" && info == "next puzzle") { // player / other users want to move to the next puzzle
                Swal.close();
                if(status == "guest"){
                    Swal.fire({
                        title: 'Loading next lesson',
                        text: 'Please wait...',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                            swalRef.current = "loading";
                        },
                        willClose: () => {
                            swalRef.current = "";
                        }
                    });
                }
                getNextPuzzle();
            } else if (typeof info == "string" && info.startsWith("<div")) { // other users want to update the hint text
                if(status == "guest") { // host initiates, only guests receive
                    const hintText = document.getElementById("hint-text");
                    if (hintText) {
                        hintText.innerHTML = info;
                        hintText.style.display = "none"; // Still hidden until Show Hint clicked
                    }
                }
            } else if (typeof info == "string" && info == "new game received") {
                if(swalRef.current == "loading") Swal.close();
            }
        };
    
        eventer(messageEvent, messageHandler, false);
    
        return () => {
            const cleanupEventer = (window as any)[window.removeEventListener ? 'removeEventListener' : 'detachEvent'];
            const cleanupMessageEvent = window.removeEventListener ? 'message' : 'onmessage';
            cleanupEventer(cleanupMessageEvent, messageHandler, false);
        };
    }, [currentFen, prevFen, playerColor, puzzleArray, currentPuzzle, isPuzzleEnd, prevMove, status]);

    return (
    <div className={styles.mainElements}>
        <iframe
        onLoad={joinOrCreatePuzzle}
        ref={chessboard}
        className={styles.chessBoard}
        src={chessClientURL}
        title="board"
        id="chessBoard"
        />
        <div className={styles.hintMenu}>
        <div className={styles.hintButtonRow}>
            <button
            className={styles.puzzleButton}
            onClick={() => {
                isPuzzleEnd = false;
                postToBoard({command: "message", message: "next puzzle"});
            }}
            >
            Get New Puzzle
            </button>

            <button className={styles.puzzleButton} onClick={openDialog}>
            Show Hint
            </button>
        </div>
        <div
            id="hint-text"
            className={styles.hintText}
            style={{ display: 'none' }}
        ></div>
        </div>
    </div>
    );


}

export default Puzzles;