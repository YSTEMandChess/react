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
            socket.emit("error", err.message);
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
        } 
        catch (err) {
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
}

module.exports = registerSocketHandlers;