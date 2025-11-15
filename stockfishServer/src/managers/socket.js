const StockfishManager = require("./StockfishManager");
const stockfishManager = new StockfishManager();

/**
 * Initializes socket event handlers for Stockfish interactions
 * @param {Server} io - Socket.IO server instance
 * @param {Socket} socket - Connected socket instance
 */
const initializeSocket = (io, socket) => {
  // Start a new Stockfish session for the client
  socket.on("start-session", ({ sessionType, fen }) => {
    try {
      stockfishManager.registerSession(socket, sessionType, fen);
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
  socket.on("evaluate-fen", ({ fen, move, level }) => {
    try {
      stockfishManager.evaluateFen(socket.id, fen, move, level);
    } catch (err) {
      socket.emit("evaluation-error", { error: err.message });
    }
  });

  // Clean up session when client disconnects
  socket.on("disconnect", () => {
    stockfishManager.deleteSession(socket.id);
  });
};

module.exports = initializeSocket;
module.exports.__stockfishManager = stockfishManager;