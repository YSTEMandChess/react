const StockfishManager = require("./StockfishManager");
const stockfishManager = new StockfishManager();

const initializeSocket = (io, socket) => {
  socket.on("start-session", ({ sessionType, fen }) => {
    try {
      stockfishManager.registerSession(socket, sessionType, fen);
      socket.emit("session-started", { success: true, id: socket.id });
    } catch (err) {
      socket.emit("session-error", { error: err.message });
    }
  });

  socket.on("update-fen", ({ fen }) => {
    try {
      stockfishManager.updateFen(socket.id, fen);
    } catch (err) {
      socket.emit("update-error", { err: err.message });
    }
  });

  socket.on("evaluate-fen", ({ fen, move, level }) => {
    try {
      stockfishManager.evaluateFen(socket.id, fen, move, level);
    } catch (err) {
      socket.emit("evaluation-error", { error: err.message });
    }
  });

  socket.on("disconnect", () => {
    stockfishManager.deleteSession(socket.id);
  });
};

module.exports = initializeSocket;
module.exports.__stockfishManager = stockfishManager;