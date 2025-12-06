// Load environment variables from .env file
require("dotenv").config();

const http = require("http");
const express = require("express");
const rateLimit = require("express-rate-limit");
const { Chess } = require("chess.js");
const Stockfish = require("stockfish");
const querystring = require("querystring");
const url = require("url");
const { Server } = require("socket.io");
const initializeSocket = require("./managers/socket");

const app = express();

// Set rate limit - 30 requests/minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests! Please try again." },
});
app.use(limiter);

// CORS headers
app.use((req, res, next) => {
  // WARNING: allow only selected access for production
  res.setHeader("Access-Control-Allow-Origin", "*");  

  res.setHeader("Content-Type", "application/json");
  next();
});

/**
 * Main API route - evaluates chess positions using Stockfish engine
 * Accepts FEN string, optional move, difficulty level, and info flag
 */
app.get("/", (req, res) => {
  // Parse query parameters from the URL
  const params = querystring.parse(url.parse(req.url, true).search?.substring(1));
  const { fen, move = "", level = 10, info = false } = params;

  // Validate input
  if (!fen || isNaN(level)) {
    return res.status(400).json({ error: "Missing or invalid parameters!" });
  }

  // Set maximum depth level and create engine instance
  const maxLevel = 30;
  var lines = [];
  var depth = Math.min(parseInt(level), maxLevel);
  const engine = Stockfish();

  // Create a new chess game from the provided FEN position
  const game = new Chess(fen);

  // Handle messages from the Stockfish engine
  engine.onmessage = (line) => {
    // If info mode is requested, collect all engine output lines
    if (info) {

      lines.push(line);
      if (line.startsWith("bestmove")) {
        res.json({ output: lines });
      }
    }
    // Otherwise, return only the best move with details
    else if (line.startsWith("bestmove")) {
      const moveResult = game.move(line.split(" ")[1], { sloppy: true });

      if (moveResult) {
        const color = moveResult.color;
        const piece = moveResult.piece.toUpperCase();
        const move = color + piece;
        const target = moveResult.to;
        res.end(`${game.fen()} move:${move} target:${target}`);
      }
      else {
        res.end("Invalid move or game state");
      }
    }
  }

  // Send position + evaluation command to the engine
  engine.postMessage(`position fen ${fen} moves ${move}`);
  engine.postMessage(`go depth ${depth}`);

  // Set timeout for safety
  setTimeout(() => {
    if (!res.writableEnded) {
      res.status(504).json({ error: "Engine timeout!" });
    }
  }, 5000);
});


// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  initializeSocket(io, socket);
});

// Start the server
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Stockfish server running on port ${PORT}`);
  console.log(`REST API available at http://localhost:${PORT}/`);
  console.log(`Socket.IO server ready for connections`);
});
