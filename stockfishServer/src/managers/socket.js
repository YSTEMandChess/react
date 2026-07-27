const StockfishManager = require("./StockfishManager");
const stockfishManager = new StockfishManager();

/**
 * Initializes socket event handlers for Stockfish interactions
 * @param {Server} io - Socket.IO server instance
 * @param {Socket} socket - Connected socket instance
 */
const initializeSocket = (socket) => {
  // Start a new Stockfish session for the client
        console.log('trying to start')

  socket.on("start-session", ({ sessionType, fen, gameSocket }) => {
    try {
            console.log("game Socketttttt", gameSocket)

      stockfishManager.registerSession(socket, sessionType, fen,undefined, gameSocket);
      socket.emit("session-started", { success: true, id: socket.id });
    } catch (err) {
      socket.emit("session-error", { error: err.message });
    }
  });

  // Update the FEN position for the client's session
  socket.on("update-fen", ({ fen }) => {
    try {
      stockfishManager.updateFen(socket.id, fen);
    } catch (err) {
      socket.emit("update-error", { err: err.message });
    }
  });

  // Request Stockfish to evaluate a position
  socket.on("evaluate-fen",  ({fen, move, level,gameSocket} ) => {
    try {
      console.log("game Socketttttt", gameSocket)
      stockfishManager.evaluateFen(socket.id, gameSocket, fen, move, level);
    } catch (err) {
      socket.emit("evaluation-error", { error: err.message });
    }
  });

  // End the current session without disconnecting the socket
  socket.on("end-session", () => {
    try {
      stockfishManager.deleteSession(socket.id);
      socket.emit("session-ended", { success: true });
    } catch (err) {
      console.error("Error ending session:", err);
    }
  });

  // Clean up session when client disconnects
  socket.on("disconnect", () => {
    stockfishManager.deleteSession(socket.id);
  });
};

module.exports = initializeSocket;
module.exports.__stockfishManager = stockfishManager;