const { spawn } = require('child_process');
const path = require('path');
const crypto = require("crypto");
const { Chess } = require("chess.js");

// Determine the correct Stockfish binary path based on platform
let enginePath;

switch (process.platform) {
    case 'win32':
      enginePath = path.join(__dirname, "../bin/stockfish_11_win.exe");
      break;
    case 'darwin':
      enginePath = path.join(__dirname, "../bin/stockfish_11_mac");
      break;
    case 'linux':
      enginePath = path.join(__dirname, "../bin/stockfish_11_linux");
      break;
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
}

/**
 * Manages Stockfish engine sessions for multiple clients
 */
class StockfishManager {
  constructor() {
    // Session types: lessons, player vs computer, miscellaneous
    this.sessions = new Map();
  }

  /**
   * Configures engine event listeners for a session
   * @param {string} socketId - Socket ID of the client session
   */
  _configureEngine(socketId) {
    const session = this.sessions.get(socketId);
    const engine = session.stockfishEngine;

    // Stockfish instance does not exist for this session
    if (!engine) {
      throw new Error("Stockfish instance not set up for this session");
    }

    // Initialize UCI protocol
    engine.stdin.write("uci\n");

    // Attach an event listener to listen for output from the engine
    engine.stdout.on("data", (data) => {
      const lines = data.toString().trim().split("\n");

      // Process each line of output from Stockfish
      for (const line of lines) {
        let cleanLine = line.trim();

        if (!cleanLine) continue;

        // Handle UCI protocol responses
        if (cleanLine === "uciok") {
          session.engineReady = true;
          session.socket.emit("engine-ready", { ready: true });
          continue;
        }

        // Handle isready response
        if (cleanLine === "readyok") {
          if (session.pendingCommand === "isready") {
            session.socket.emit("isready-response", { ready: true });
            session.pendingCommand = null;
            session.awaitingResponse = false;
          }
          continue;
        }

        // Only process other responses if we're awaiting a response
        if (!session.awaitingResponse) continue;

        const isInfoMode = session.infoMode;

        // In info mode, collect all engine analysis output
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
        // In move mode, extract and execute the best move
        } else if (cleanLine.startsWith("bestmove")) {
          const moveStr = cleanLine.split(" ")[1];

          // Attempt to execute the move on the game instance
          let moveResult = null;
          try {
            moveResult = session.gameInstance.move(moveStr, { sloppy: true });
          } catch (e) {
            return session.socket.emit("evaluation-error", {
              error: "Invalid move from engine",
            });
          }

          const newFEN = session.gameInstance.fen();

          // Send the move result back to the client
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
    });

    // Handle engine errors
    engine.stderr.on("data", (data) => {
      console.error(`Stockfish engine error for ${socketId}:`, data.toString());
      session.socket.emit("engine-error", {
        error: data.toString(),
      });
    });

    // Handle engine process exit
    engine.on("exit", (code) => {
      console.log(`Stockfish engine exited for ${socketId} with code ${code}`);
      if (code !== 0) {
        session.socket.emit("engine-error", {
          error: `Engine process exited with code ${code}`,
        });
      }
    });
  }

  /**
   * Registers a new Stockfish session for a client
   * @param {Socket} socket - Socket.IO socket instance
   * @param {string} sessionType - Type of session (e.g., 'lesson', 'pvp')
   * @param {string} fen - Optional FEN string for initial board position
   * @param {boolean} infoMode - Whether to return detailed analysis
   */
  registerSession(socket, sessionType, fen = null, infoMode = false) {
    const socketId = socket.id;

    // Ensure session doesn't already exist
    if (this.sessions.has(socketId)) {
      throw new Error("Session already exists!");
    }

    // Initialize a new chess game with the provided FEN or default position
    const game = new Chess(fen || undefined);

    const sessionId = crypto.randomUUID();
    const engine = spawn(enginePath);

    // Create and store the session data
    this.sessions.set(socketId, {
      id: sessionId,
      sessionType,
      gameFen: fen || game.fen(),
      infoMode,
      stockfishEngine: engine,
      gameInstance: game,
      outputBuffer: [],
      engineReady: false,
      awaitingResponse: false,
      pendingCommand: null,
      socket,
    });

    this._configureEngine(socketId);
  }

  /**
   * Updates the FEN position for an existing session
   * @param {string} socketId - Socket ID of the client session
   * @param {string} fen - New FEN string to set
   */
  updateFen(socketId, fen) {
    const session = this.sessions.get(socketId);

    if (!session) {
      throw new Error("Session not found!");
    }

    // Validate FEN string
    if (fen === "" || null) {
      throw new Error("Invalid FEN");
    }

    // Update the game position
    session.gameFen = fen;
    session.gameInstance = new Chess(fen);
  }

  /**
   * Requests Stockfish to evaluate a position and return the best move
   * @param {string} socketId - Socket ID of the client session
   * @param {string} fen - FEN string to evaluate
   * @param {string} move - Optional move to append
   * @param {number} level - Search depth (1-30)
   */
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

    // Limit search depth to maximum of 30
    const maxLevel = 30;
    const minDepth = Math.min(parseInt(level), maxLevel);

    // Send position to engine with optional move sequence
    if (move.length) {
      engine.stdin.write(`position fen ${fen} moves ${move}\n`);
    }
    else {
      engine.stdin.write(`position fen ${fen}\n`);
    }
    
    // Request engine to search to specified depth
    engine.stdin.write(`go depth ${minDepth}\n`);
  }

  /**
   * Checks if the Stockfish engine is ready (UCI isready command)
   * @param {string} socketId - Socket ID of the client session
   */
  isReady(socketId) {
    const session = this.sessions.get(socketId);

    if (!session) {
      throw new Error("Session not found!");
    }

    const engine = session.stockfishEngine;
    session.awaitingResponse = true;
    session.pendingCommand = "isready";
    
    // Send UCI isready command
    engine.stdin.write("isready\n");
  }

  /**
   * Starts a new game (UCI newgame command)
   * Resets the board to the starting position
   * @param {string} socketId - Socket ID of the client session
   * @param {string} fen - Optional FEN string for initial position (defaults to starting position)
   */
  newGame(socketId, fen = null) {
    const session = this.sessions.get(socketId);

    if (!session) {
      throw new Error("Session not found!");
    }

    // Reset the game instance to starting position or provided FEN
    const startingFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const newFen = fen || startingFen;
    
    try {
      session.gameInstance = new Chess(newFen);
      session.gameFen = newFen;
      
      // Send UCI newgame command (ucinewgame)
      const engine = session.stockfishEngine;
      engine.stdin.write("ucinewgame\n");
      
      // Set the position in the engine
      engine.stdin.write(`position fen ${newFen}\n`);
      
      session.socket.emit("newgame-complete", {
        fen: newFen,
        success: true,
      });
    } catch (error) {
      throw new Error(`Invalid FEN for new game: ${error.message}`);
    }
  }

  /**
   * Gets the current position of the board
   * @param {string} socketId - Socket ID of the client session
   */
  getCurrentPosition(socketId) {
    const session = this.sessions.get(socketId);

    if (!session) {
      throw new Error("Session not found!");
    }

    const currentFen = session.gameInstance.fen();
    const history = session.gameInstance.history();
    const turn = session.gameInstance.turn();
    const isCheck = session.gameInstance.inCheck();
    const isCheckmate = session.gameInstance.isCheckmate();
    const isStalemate = session.gameInstance.isStalemate();
    const isDraw = session.gameInstance.isDraw();
    const isGameOver = session.gameInstance.isGameOver();

    return {
      fen: currentFen,
      pgn: session.gameInstance.pgn(),
      history: history,
      turn: turn, // 'w' or 'b'
      isCheck,
      isCheckmate,
      isStalemate,
      isDraw,
      isGameOver,
      moveNumber: session.gameInstance.moveNumber(),
    };
  }

  /**
   * Deletes a session and terminates the Stockfish process
   * @param {string} socketId - Socket ID of the client session
   */
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
