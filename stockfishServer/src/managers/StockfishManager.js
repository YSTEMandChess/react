const { spawn } = require("child_process");
const crypto = require("crypto");
const { Chess } = require("chess.js");
const path = require("path");

let enginePath;

switch (process.platform) {
  case "win32":
    enginePath = path.join(__dirname, "..", "bin", "stockfish_11_win.exe");
    break;
  case "darwin":
    enginePath = path.join(__dirname, "..", "bin", "stockfish_11_mac");
    break;
  case "linux":
    enginePath = path.join(__dirname, "..", "bin", "stockfish_11_linux");
    break;
  default:
    throw new Error(`Unsupported platform: ${process.platform}`);
}

class StockfishManager {
  constructor() {
    this.sessions = new Map();
  }

  _configureEngine(socketId) {
    const session = this.sessions.get(socketId);

    if (!session) {
      throw new Error(`No session found for ${socketId}`);
    }

    const engine = session.stockfishEngine;

    if (!engine) {
      throw new Error("No Stockfish engine");
    }

    engine.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");

      for (const line of lines) {
        const cleanLine = line.trim();

        if (!cleanLine) continue;

        console.log("Stockfish:", cleanLine);

        if (cleanLine === "readyok") {
          session.engineReady = true;

          console.log("Stockfish ready");

          if (session.resolveReady) {
            session.resolveReady();
          }

          continue;
        }

        if (!session.awaitingResponse) {
          continue;
        }

        if (session.infoMode) {
          session.outputBuffer.push(cleanLine);

          if (cleanLine.startsWith("bestmove")) {
            session.socket.emit("evaluation-complete", {
              mode: "info",
              output: session.outputBuffer,
              gameSocket: session.gameSocket,
            });

            session.awaitingResponse = false;
            session.outputBuffer = [];
          }

          continue;
        }

        if (!cleanLine.startsWith("bestmove")) {
          continue;
        }

        const moveStr = cleanLine.split(" ")[1];

        let moveResult;

        try {
          moveResult = session.gameInstance.move(moveStr, {
            sloppy: true,
          });
        } catch (err) {
          console.error("Invalid Stockfish move:", moveStr);

          session.socket.emit("evaluation-error", {
            error: "Invalid move from Stockfish",
            gameSocket: session.gameSocket,
          });

          session.awaitingResponse = false;
          continue;
        }

        const newFEN = session.gameInstance.fen();

        console.log("Sending evaluation-complete", {
          stockfishSocket: socketId,
          gameSocket: session.gameSocket,
          move: moveStr,
        });

        session.socket.emit("evaluation-complete", {
          mode: "move",
          move: moveStr,
          moveDetails: moveResult,
          newFEN,
          gameSocket: session.gameSocket,
        });

        session.awaitingResponse = false;
        session.outputBuffer = [];
      }
    });

    engine.stderr.on("data", (data) => {
      console.error("Stockfish error:", data.toString());
    });
  }

  registerSession(socket, sessionType, fen = null, infoMode = false, gameSocket) {
    const socketId = socket.id; // Stockfish socket ID

    if (this.sessions.has(socketId)) {
      throw new Error("Session already exists!");
    }

    const game = new Chess(fen || undefined);
    const engine = spawn(enginePath);

    const session = {
      id: crypto.randomUUID(),

      // Stockfish data
      sessionType,
      stockfishSocket: socketId,

      // Chess server socket
      gameSocket,

      gameFen: fen,

      infoMode,

      stockfishEngine: engine,

      gameInstance: game,

      outputBuffer: [],

      engineReady: false,

      awaitingResponse: false,

      readyPromise: null,

      resolveReady: null,

      // Stockfish socket
      socket,
    };

    session.readyPromise = new Promise((resolve) => {
      session.resolveReady = resolve;
    });

    this.sessions.set(socketId, session);

    this._configureEngine(socketId);

    engine.stdin.write("uci\n");
    engine.stdin.write("isready\n");

    console.log(
      "Started Stockfish session:",
      socketId,
      "for game:",
      gameSocket
    );

    return session.readyPromise;
  }

  async evaluateFen(socketId,gameSocket, fen, move = "", level = 10, ) {
    const session = this.sessions.get(socketId);

    console.log("Looking for Stockfish session:", socketId);

    if (!session) {
      throw new Error(`Session not found for ${socketId}`);
    }

    await session.readyPromise;

    const engine = session.stockfishEngine;

    session.awaitingResponse = true;
    session.outputBuffer = [];

    session.gameInstance.load(fen);
    session.gameFen = fen;

    const depth = Math.min(parseInt(level), 30);

    console.log("Sending position:", fen);

    if (move.length) {
      engine.stdin.write(
        `position fen ${fen} moves ${move}\n`
      );
    } else {
      engine.stdin.write(
        `position fen ${fen}\n`
      );
    }

    console.log(
      "Starting Stockfish depth:",
      depth
    );

    engine.stdin.write(
      `go depth ${depth}\n`
    );
  }

  updateFen(socketId, fen) {
    const session = this.sessions.get(socketId);

    if (!session) {
      throw new Error("Session not found!");
    }

    if (!fen) {
      throw new Error("Invalid FEN");
    }

    session.gameFen = fen;
    session.gameInstance = new Chess(fen);
  }

  deleteSession(socketId) {
    const session = this.sessions.get(socketId);

    if (session) {
      session.stockfishEngine.kill();

      this.sessions.delete(socketId);

      console.log(
        `Deleted Stockfish session ${socketId}`
      );
    }
  }
}

module.exports = StockfishManager;