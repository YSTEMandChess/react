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

  // Check if Stockfish engine is ready (UCI isready command)
  socket.on("isready", () => {
    try {
      stockfishManager.isReady(socket.id);
    } catch (err) {
      socket.emit("isready-error", { error: err.message });
    }
  });

  // Start a new game (UCI newgame command)
  socket.on("newgame", ({ fen }) => {
    try {
      stockfishManager.newGame(socket.id, fen);
    } catch (err) {
      socket.emit("newgame-error", { error: err.message });
    }
  });

  // Get the current position of the board
  socket.on("get-current-position", () => {
    try {
      const position = stockfishManager.getCurrentPosition(socket.id);
      socket.emit("current-position", position);
    } catch (err) {
      socket.emit("position-error", { error: err.message });
    }
  });

  // Clean up session when client disconnects
  socket.on("disconnect", () => {
    stockfishManager.deleteSession(socket.id);
  });
};

module.exports = initializeSocket;
module.exports.__stockfishManager = stockfishManager;