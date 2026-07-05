const { Chess } = require("chess.js")

/**
 * GameManager class handles chess game sessions, state, and logic.
 */
class GameManager {
    constructor() {
        this.ongoingGames = []
    }

    /**
     * 
     * @param {Object} param0 - Contains student, mentor, role, socketId
     * @returns {Object} Game object, assigned color, and new game status
     */
    createOrJoinGame({ student, mentor, role, socketId }) {
        let game = this.ongoingGames.find(
            (g) => g.student.username === student || g.mentor.username === mentor
        );

        if (role != "student" && role != "mentor") {
            throw new Error("Invalid role!");
        }

        // Player already in a game
        if (game) {
            console.log("already in a game")
            if (role == "student") {
                game.student.id = socketId;
                return { game, color: game.student.color, newGame: false };
            }
            else if (role == "mentor") {
                game.mentor.id = socketId;
                return { game, color: game.mentor.color, newGame: false };
            }
            else {
                throw new Error("Invalid role!");
            }
        }

        console.log("creating new game in game manager")
        // Create a new game instance
        const board = new Chess();
        const studentColor = role === "student" ? "black" : "white";
        const mentorColor = role === "student" ? "white" : "black";

        const newGame = {
            student: {
                username: student,
                id: role === "student" ? socketId : null,
                color: studentColor
            },
            mentor: {
                username: mentor,
                id: role === "mentor" ? socketId : null,
                color: mentorColor
            },
            boardState: board,
            pastStates: []
        };

        this.ongoingGames.push(newGame);

        return {
            game: newGame,
            color: role === "student" ? studentColor : mentorColor,
            newGame: true
        };
    }

    /**
     * 
     * @param {Object} param0 - Contains student, mentor, role, socketId
     * @returns {Object} Game object, assigned color, and new game status
     */
    createOrJoinPuzzle({ student, mentor, role, socketId, credentials }, io) {
        let game = this.ongoingGames.find(
            (g) => g.student.username === student || g.mentor.username === mentor
        );
        const socket = io.sockets.sockets.get(socketId); // the socket id that initiated connection

        // must be a student or mentor to connect to server
        if (role != "student" && role != "mentor") {
            throw new Error("Invalid role!");
        }

        // Player already in a puzzle, so serve as a guest
        if (game) {
            console.log("already in a game")
            if (role == "student") {
                game.student.id = socketId; // record guest socket id
                socket.emit("guest"); // notify client that they join as guest
                const socket2 = io.sockets.sockets.get(game.mentor.id);
                socket2.emit("guest"); 
                socket.emit("boardstate", JSON.stringify({ 
                    boardState: game.boardState.fen(), // pass existing game state to guest client
                    color: game.student.color
                }));
                socket.emit("message", JSON.stringify({ message: game.puzzle }));
                console.log("emtting hints!!", game.puzzle);
                return { game, color: game.student.color, newGame: false };
            }
            else if (role == "mentor") {
                game.mentor.id = socketId; // record guest socket id
                socket.emit("guest"); // notify client that they join as guest
                const socket2 = io.sockets.sockets.get(game.student.id);
                socket2.emit("guest"); 
                socket.emit("boardstate", JSON.stringify({ 
                    boardState: game.boardState.fen(), // pass existing game state to guest client
                    color: game.student.color 
                }));
                socket.emit("message", JSON.stringify({ message: game.puzzle }));
                console.log("emtting hints!!", game.puzzle);
                return { game, color: game.mentor.color, newGame: false };
            }
            else {
                throw new Error("Invalid role!");
            }
        }

        // Game has not been created yet, so player will serve as host
        socket.emit("host");
        console.log("creating new game in game manager")

        // Create a new game instance
        const board = new Chess(); // default to a simple chess game
        const studentColor = "white"; // default to white
        const mentorColor = "white"; // in a puzzle, student and mentor are on the same side

        const newGame = {
            student: {
                username: student,
                id: role === "student" ? socketId : null,
                color: studentColor,
                credentials: credentials,
            },
            mentor: {
                username: mentor,
                id: role === "mentor" ? socketId : null,
                color: mentorColor
            },
            boardState: board,
            pastStates: [],
            puzzle: "No hints available",
        };
        console.log("created puzzle:", newGame.puzzle);

        // record the new game created
        this.ongoingGames.push(newGame);

        return {
            game: newGame,
            color: role === "student" ? studentColor : mentorColor,
            newGame: true
        };
    }


    /**
     * Handles a player making a move.
     * @param {*} socketId 
     * @param {*} moveFrom 
     * @param {*} moveTo 
     * @returns {Object} Updated board state, move details, and socket IDs
     */
    makeMove(socketId, moveFrom, moveTo) {
        const game = this.getGameBySocketId(socketId);

        if (!game) {
            throw new Error("Game not found for this socket!");
        }

        const board = game.boardState;
        const move = {from: moveFrom, to: moveTo};
        //console.log(move, typeof(move), typeof(move)==='object');
        const moveResult = board.move(move);
        console.log(moveResult);

        if (!moveResult) {
            throw new Error("Invalid move!");
        }

        // Save board state
        game.pastStates.push(board.fen())

        const flags = moveResult.flags || ""; // e.g., 'c' capture, 'k'/'q' castle, 'e' en passant, 'p' promotion
        const activityEvents = [];

        const captureMap = {
            q: "captureQueen",
            r: "captureRook",
            n: "captureKnight",
            b: "captureBishop",
            p: "capturePawn"
        };

        // Capture (including en passant)
        if (flags.includes("c") || flags.includes("e")) {
            const capLetter = moveResult.captured; // 'q','r','n','b','p'
            const name = capLetter ? captureMap[capLetter] : null;
            if (name) {
            activityEvents.push({
                name,
                meta: {
                from: moveResult.from,
                to: moveResult.to,
                san: moveResult.san
                },
                at: Date.now()
            });
            }
        }

        // Castling
        if (flags.includes("k") || flags.includes("q")) {
            activityEvents.push({
            name: "performCastle",
            meta: { san: moveResult.san },
            at: Date.now()
            });
        }
        //console.log(activityEvents);
        //console.log('student info',game.student);
        return { 
                result: {
                            boardState: board.fen(),
                            move: moveResult,
                            studentId: game.student.id,
                            mentorId: game.mentor.id,
                            studentUsername: game.student.username,
                        },
                activityEvents: activityEvents
        };
    }

    /**
     * Undoes the last move in the game.
     * @param {*} socketId 
     * @returns {Object} Updated board state and undo info
     */
    undoMove(socketId) {
        const game = this.getGameBySocketId(socketId);

        if (!game) {
            throw new Error("Cannot undo: no active game found for this socket.");
        }

        const board = game.boardState;

        // Attempt to undo
        const undoneMove = board.undo();

        if (!undoneMove) {
            throw new Error("No move to undo");
        }

        return {
            boardState: board.fen(),
            undoneMove,
            studentId: game.student.id,
            mentorId: game.mentor.id
        };
    }

    /**
     * Ends a game and removes it from the list.
     * @param {*} studentUsername 
     * @param {*} mentorUsername 
     */
    endGame(studentUsername, mentorUsername) {
        const gameIndex = this.ongoingGames.findIndex(
            (game) =>
                game.student.username == studentUsername && game.mentor.username == mentorUsername
        );

        if (gameIndex === -1) {
            throw new Error("Game not found");
        }

        const [removedGame] = this.ongoingGames.splice(gameIndex, 1);

        return {
            success: true,
            studentId: removedGame.student.id,
            mentorId: removedGame.mentor.id
        };
    }

    /**
     * Emits current board state to both student and mentor.
     * @param {*} game 
     * @param {*} io 
     */
    broadcastBoardState(gameInfo, io) {
        const fen = gameInfo.boardState;

        const studentSocket = io.sockets.sockets.get(gameInfo.studentId);
        const mentorSocket = io.sockets.sockets.get(gameInfo.mentorId);

        if (studentSocket) {
        studentSocket.emit("boardstate", JSON.stringify({ boardState: fen }));
        }
        if (mentorSocket) {
        mentorSocket.emit("boardstate", JSON.stringify({ boardState: fen }));
        }
    }

    /**
     * Emits simple messages to both players.
     * @param {*} socketId 
     * @param {*} message
     * @param {*} io 
     */
    broadcastSimpleMessage(socketId, message, io) {
        const game = this.getGameBySocketId(socketId);

        if (!game) {
            throw new Error("Game not found");
        }

        const payload = JSON.stringify({ message });

        io.to(game.student.id).emit("message", payload);
        io.to(game.mentor.id).emit("message", payload);
    }

    /**
     * Sets board state from provided FEN string.
     * @param {*} socketId 
     * @param {*} fen 
     */
    setBoardState(socketId, fen) {
        const game = this.getGameBySocketId(socketId);

        if (!game) {
            throw new Error("Game not found for this socket!");
        }

        game.boardState.load(fen);

        return {
            game,
            boardState: game.boardState.fen(),
            studentId: game.student.id,
            mentorId: game.mentor.id
        };
    }

    /**
     * Sets board state as in setBoardState, but allows modifying colors (specifically for puzzles)
     * @param {*} socketId 
     * @param {*} fen 
     * @param {*} color
     */
    setBoardColor(socketId, fen, color, hints, io) {
        const game = this.getGameBySocketId(socketId); // find the corresponding game of the client

        if (!game) { // if game does not exist
            throw new Error("Game not found for this socket!");
        }

        // modify board state by fen parameter
        game.boardState.load(fen);
        game.puzzle = hints;
        // modify player color (mentor & player on same side for puzzles)
        game.student.color = color;
        game.mentor.color = color;

        const studentSocket = io.sockets.sockets.get(game.student.id);
        const mentorSocket = io.sockets.sockets.get(game.mentor.id);

        // broadcast state changes to all players, including changes in color
        if (studentSocket) {
            studentSocket.emit("boardstate", JSON.stringify({ boardState: fen, color: color }));
        }
        if (mentorSocket) {
            mentorSocket.emit("boardstate", JSON.stringify({ boardState: fen, color: color }));
        }

        return {
            game,
            boardState: game.boardState.fen(),
            studentId: game.student.id,
            mentorId: game.mentor.id
        };
    }

    /**
     * Emits last move highlight to both players.
     * @param {*} socketId 
     * @param {*} fromMove 
     * @param {*} toMove 
     * @param {*} io 
     */
    broadcastLastMove(socketId, fromMove, toMove, io) {
        const game = this.getGameBySocketId(socketId);

        if (!game) {
            throw new Error("Game not found");
        }

        const payload = JSON.stringify({ fromMove, toMove });

        io.to(game.student.id).emit("lastmove", payload);
        io.to(game.mentor.id).emit("lastmove", payload);
    }

    /**
     * Relays an event to the opponent player.
     * @param {*} socketId 
     * @param {*} eventName 
     * @param {*} data 
     * @param {*} io 
     */
    relayToOpponent(socketId, eventName, data, io) {
        const game = this.getGameBySocketId(socketId);

        if (!game) {
            throw new Error("Game not found");
        }

        const senderId = socketId;
        const receiverId = game.student.id === senderId ? game.mentor.id : game.student.id;

        io.to(receiverId).emit(eventName, JSON.stringify(data));
    }

    /**
     * Finds the game using socket ID.
     * @param {*} socketId 
     * @returns 
     */
    getGameBySocketId(socketId) {
        return this.ongoingGames.find(
            (game) => game.student.id === socketId || game.mentor.id === socketId
        );
    }
}

module.exports = GameManager;