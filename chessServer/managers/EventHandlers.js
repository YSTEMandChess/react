const GameManager = require("./GameManager");

const gameManager = new GameManager();

/**
 * Registers all socket event handlers for a given connection.
 * @param {Socket} socket - The connected socket instance
 * @param {Server} io - The Socket.IO server instance
 */
const registerSocketHandlers = (socket, io) => {
    console.log("A user connected to socket:", socket.id);

    /**
     * Handles creating a new game or joining an existing one
     * Expected payload: { student, mentor, role }
     */
    socket.on("newgame", (msg) => {
        try {
            const parsed = JSON.parse(msg);

            const result = gameManager.createOrJoinGame({
                student: parsed.student,
                mentor: parsed.mentor,
                role: parsed.role,
                socketId: socket.id
            });

            socket.emit(
                "boardstate",
                JSON.stringify({
                boardState: result.game.boardState.fen(),
                color: result.color
                })
            );
        }
        catch (err) {
            socket.emit("gameerror", err.message);
        }
    });

    /**
     * Handles creating a new puzzle or joining an existing one
     * Expected payload: { student, mentor, role }
     */
    socket.on("newPuzzle", (msg) => {
        try {
            const parsed = JSON.parse(msg);
            // create the new puzzle
            gameManager.createOrJoinPuzzle({
                student: parsed.student,
                mentor: parsed.mentor,
                role: parsed.role,
                socketId: socket.id
            }, io);
        }
        catch (err) {
            socket.emit("gameerror", err.message);
            console.log(err.message);
        }
    });

    /**
     * Handles player move request
     * Expected payload: { from, to }
     */
    socket.on("move", (msg) => {
        try {
            const { from, to } = JSON.parse(msg);
            const result = gameManager.makeMove(socket.id, from, to);
            gameManager.broadcastBoardState(result, io);
        }
        catch (err) {
            socket.emit("error", err.message);
            console.log("move error")
        }
    });

    /**
     * Handles undo move request
     */
    socket.on("undo", () => {
        try {
            const result = gameManager.undoMove(socket.id);
            gameManager.broadcastBoardState(result, io);
        }
        catch (err) {
            socket.emit("error", err.message);
        }
    });

    /**
     * Ends the current game
     * Expected payload: { student, mentor }
     */
    socket.on("endgame", (msg) => {
        try {
            const { student, mentor } = JSON.parse(msg);
            const result = gameManager.endGame(student, mentor);
            io.to(result.studentId).emit("reset");
            io.to(result.mentorId).emit("reset");
            console.log("game ended successfully")
        } 
        catch (err) {
            console.log("error", err.message);
            socket.emit("error", err.message);
        }
    });

    /**
     * Allows board state override
     * Expected payload: { state: fenString }
     */
    socket.on("setstate", (msg) => {
        try {
            const { state } = JSON.parse(msg);
            const result = gameManager.setBoardState(socket.id, state);
            gameManager.broadcastBoardState(result, io);
        }
        catch (err) {
            socket.emit("error", err.message);
        }
    });

    /**
     * Allows board state & color override (specifically for puzzles)
     * Expected payload: { state: fenString, color }
     */
    socket.on("setstateColor", (msg) => {
        try {
            const { state, color } = JSON.parse(msg);
            gameManager.setBoardColor(socket.id, state, color, io); // modify the game in the server game manager
        }
        catch (err) {
            socket.emit("error", err.message);
        }
    });

    /**
     * Broadcasts the last move made (for highlighting)
     * Expected payload: { from, to }
     */
    socket.on("lastmove", (msg) => {
        try {
            const { from, to } = JSON.parse(msg);
            gameManager.broadcastLastMove(socket.id, from, to, io);
        }
        catch (err) {
            socket.emit("error", err.message);
        }
    });

    /**
     * Broadcasts any simple string messages
     * Expected payload: { message }
     */
    socket.on("message", (msg) => {
        try {
            const { message } = JSON.parse(msg);
            gameManager.broadcastSimpleMessage(socket.id, message, io);
        }
        catch (err) {
            socket.emit("error", err.message);
        }
    });

    const relayEvents = [
        "addgrey",
        "removegrey",
        "mousexy",
        "piecedrag",
        "piecedrop",
        "highlight"
    ];

    // Generic relay handler
    relayEvents.forEach((eventName) => {
        socket.on(eventName, (msg) => {
        try {
            const data = JSON.parse(msg);
            gameManager.relayToOpponent(socket.id, eventName, data, io);
        } catch (err) {
            socket.emit("error", err.message);
        }
        });
    });

    socket.on("disconnect", () => {
        const game = gameManager.getGameBySocketId(socket.id);
        if (!game) {
            console.log("game not found for this socket")
            return;
        }

        const result = gameManager.endGame(game.student.username, game.mentor.username);

        // reset game
        io.to(result.studentId).emit("reset");
        io.to(result.mentorId).emit("reset");
        console.log("game ended successfully")
    });
}

module.exports = registerSocketHandlers;