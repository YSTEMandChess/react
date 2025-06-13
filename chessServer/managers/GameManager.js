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

        // Player already in a game
        if (game) {
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

        const moveResult = board.move({ from: moveFrom, to: moveTo });

        if (!moveResult) {
            throw new Error("Invalid move!");
        }

        // Save board state
        game.pastStates.push(board.fen())

        return {
            boardState: board.fen(),
            move: moveResult,
            studentId: game.student.id,
            mentorId: game.mentor.id
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
    broadcastBoardState(game, io) {
        const fen = game.boardState.fen();

        io.to(game.student.id).emit("boardstate", JSON.stringify({ boardState: fen }));
        io.to(game.mentor.id).emit("boardstate", JSON.stringify({ boardState: fen }));
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

        const payload = JSON.stringify({ from, to });

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