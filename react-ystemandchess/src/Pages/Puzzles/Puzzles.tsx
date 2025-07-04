import React, { useRef, useState, useEffect } from "react";
import "./Puzzles.scss";
import { Chess } from "chess.js";
import { themesName, themesDescription } from '../../services/themesService';
import Swal from 'sweetalert2';
import { environment } from "../../environments/environment";

const chessClientURL = environment.urls.chessClientURL;

// Global variables (keeping similar to Angular version)
let puzzleIndex = 0;
var moveList: string[] = [];
var computerColor: string;
var isPuzzleEnd = false;
var prevFEN: string;
var currentPuzzle: any;

function Puzzles() {
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
      console.log("DEBUG — full moveList at lesson start:", moveList);
      if (moveList.length === 0) return;
      const computerMove = moveList.shift();
      console.log("DEBUG — full moveList at lesson start:", moveList);
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
        console.log("DEBUG", newPlayerColor);
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

      // 1. Reset the iframe board
      postToBoard({ command: "reset" });

      // 2. Wait for reset, then send puzzle setup
      setTimeout(() => {
        if (!fen || fen.split(" ").length < 2 || fen.split("/").length !== 8) {
            console.warn("Invalid FEN detected before sending to iframe:", fen);
            return;
        }

        postToBoard({
        PuzzleId: currentPuzzle?.PuzzleId,
        FEN: fen,
        Moves: currentPuzzle?.Moves,
        Rating: currentPuzzle?.Rating,
        Themes: currentPuzzle?.Themes
        });


        // 3. Wait for setup, then send the first computer move if needed
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

    useEffect(() => {
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
        
        initializeComponent();
    }, []);
    
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
                                    Swal.fire('Puzzle completed', 'Good Job', 'success').then(() => getNextPuzzle());
                                }, 200);
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
            }
            
        };
    
        eventer(messageEvent, messageHandler, false);
    
        return () => {
            const cleanupEventer = (window as any)[window.removeEventListener ? 'removeEventListener' : 'detachEvent'];
            const cleanupMessageEvent = window.removeEventListener ? 'message' : 'onmessage';
            cleanupEventer(cleanupMessageEvent, messageHandler, false);
        };
    }, [currentFen, prevFen, playerColor, puzzleArray, currentPuzzle, isPuzzleEnd, prevMove]);

    return (
        <div id="mainElements">
            <iframe ref={chessboard} src={chessClientURL} title="board" id="chessBoard"></iframe>

            <div id="hintMenu">
                <button 
                    id="newPuzzle"
                    onClick={() => {
                        isPuzzleEnd = false;
                        getNextPuzzle();
                    }}
                >
                    Get New Puzzle
                </button>
                
                <button 
                    id="openDialog"
                    onClick={openDialog}
                >
                    Show Hint
                </button>
                
                <div id="hint-text" style={{ display: 'none' }}></div>
            </div>
        </div>
    );
}

export default Puzzles;