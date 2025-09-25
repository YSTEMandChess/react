const { spawn } = require('child_process');
const crypto = require("crypto");
const { Chess } = require("chess.js");

let enginePath;

switch (process.platform) {
    case 'win32':
      enginePath = "./bin/stockfish_11_win.exe";
      break;
    case 'darwin':
      enginePath = "./bin/stockfish_11_mac";
      break;
    case 'linux':
      enginePath = "./bin/stockfish_11_linux";
      break;
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
}

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

    // Attach an event listener to listen for output from the engine
    engine.stdout.on("data", (data) => {
      const lines = data.toString().trim().split("\n");

      for (const line of lines) {
        let cleanLine = line.trim();

        if (!cleanLine) return;
        if (!session.awaitingResponse) return;

        const isInfoMode = session.infoMode;

        if (isInfoMode) {
        session.outputBuffer.push(cleanLine);

        if (cleanLine.startsWith("bestmove")) {
          session.socket.emit("evaluation-complete", {
            mode: 'info',
            output: session.outputBuffer,
          });

          session.awaitingResponse = false;
          session.outputBuffer = [];
        }
      } else if (cleanLine.startsWith("bestmove")) {
        const moveStr = cleanLine.split(" ")[1];

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
          mode: 'move',
          move: moveStr,
          moveDetails: moveResult,
          newFEN,
        });

        session.awaitingResponse = false;
        session.outputBuffer = [];
      }
      }

      

    })


    
  }

  registerSession(socket, sessionType, fen = null, infoMode = false) {
    const socketId = socket.id;

    if (this.sessions.has(socketId)) {
      throw new Error("Session already exists!");
    }

    const game = new Chess(fen || undefined);

    const sessionId = crypto.randomUUID();
    const engine = spawn(enginePath);

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

  updateFen(socketId, fen) {
    const session = this.sessions.get(socketId);

    if (!session) {
      throw new Error("Session not found!");
    }

    if (fen === "" || null) {
      throw new Error("Invalid FEN");
    }

    session.gameFen = fen;
    session.gameInstance = new Chess(fen);
  }

  evaluateFen(socketId, fen, move = "", level = 10) {
    const session = this.sessions.get(socketId);

    if (!session) {
      throw new Error("Session not found!");
    }

    const engine = session.stockfishEngine;
    session.awaitingResponse = true;
    session.outputBuffer = [];
    session.gameInstance.load(fen);
    session.gameFen = fen;

    const maxLevel = 30;
    const minDepth = Math.min(parseInt(level), maxLevel);

    if (move.length) {
      engine.stdin.write(`position fen ${fen} moves ${move}\n`);
    }
    else {
      engine.stdin.write(`position fen ${fen}\n`);
    }
    
    engine.stdin.write(`go depth ${minDepth}\n`);
  }

  deleteSession(socketId) {
    const session = this.sessions.get(socketId);

    if (session) {
      session.stockfishEngine.kill();
      this.sessions.delete(socketId);
      console.log(`Deleted session for ${socketId}`);
    }
  }
}

module.exports = StockfishManager;
