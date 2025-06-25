const Stockfish = require("stockfish");
const crypto = require("crypto");
const { Chess } = require("chess.js");

class StockfishManager {
  constructor() {
    // Session types: lessons, player vs computer, miscellaneous
    this.sessions = new Map();
  }

  _configureEngine(socketId) {
    const session = this.sessions.get(socketId);
    const engine = session.stockfishEngine;

    // Stockfish instance does not exist for this session
    if (!engine) {
      throw new Error("Stockfish instance not set up for this session");
    }

    // Attach 'onmessage' event listener to the stockfish instance at the configuration step
    engine.onmessage = (line) => {
      if (!line) return;

      if (!session.awaitingResponse) return;

      const isInfoMode = session.infoMode;

      if (isInfoMode) {
        session.outputBuffer.push(line);

        if (line.startsWith("bestmove")) {
          session.socket.emit("evaluation-complete", {
            output: session.outputBuffer,
          });

          session.awaitingResponse = false;
          session.outputBuffer = [];
        }
      } else if (line.startsWith("bestmove")) {
        const moveStr = line.split(" ")[1];

        let moveResult = null;
        try {
          moveResult = session.gameInstance.move(moveStr, { sloppy: true });
        } catch (e) {
          return session.socket.emit("evaluation-error", {
            error: "Invalid move from engine",
          });
        }

        const newFEN = session.gameInstance.fen();

        session.socket.emit("evaluation-complete", {
          move: moveStr,
          moveDetails: moveResult,
          newFEN,
        });

        session.awaitingResponse = false;
        session.outputBuffer = [];
      }
    };
  }

  registerSession(socket, sessionType, fen = null, infoMode = false) {
    const socketId = socket.id;

    if (this.sessions.has(socketId)) {
      throw new Error("Session already exists!");
    }

    const game = new Chess(fen || undefined);

    const sessionId = crypto.randomUUID();
    const engine = Stockfish();

    this.sessions.set(socketId, {
      id: sessionId,
      sessionType,
      gameFen: fen,
      infoMode,
      stockfishEngine: engine,
      gameInstance: game,
      outputBuffer: [],
      engineReady: false,
      awaitingResponse: false,
      socket,
    });

    this._configureEngine(socketId);
  }

  evaluateFen(socketId, fen, move = "", level = 10) {
    const session = this.sessions.get(socketId);

    if (!session) {
      throw new Error("Session not found!");
    }

    const engine = session.stockfishEngine;
    session.awaitingResponse = true;
    session.outputBuffer = [];
    session.gameFen = fen;

    const maxLevel = 30;
    const minDepth = Math.min(parseInt(level), maxLevel);

    engine.postMessage(`position fen ${fen} moves ${move}`);
    engine.postMessage(`go depth ${minDepth}`);
  }

  deleteSession(socketId) {
    const session = this.sessions.get(socketId);

    if (session) {
      session.stockfishEngine.terminate?.();
      this.sessions.delete(socketId);
      console.log(`Deleted session for ${socketId}`);
    }
  }
}

module.exports = StockfishManager;
