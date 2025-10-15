require("dotenv").config();

const express = require("express");
const rateLimit = require("express-rate-limit");
const { Chess } = require("chess.js");
const Stockfish = require("stockfish");
const querystring = require("querystring");
const url = require("url");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");

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

// Main API route
app.get("/", (req, res) => {
  const params = querystring.parse(url.parse(req.url, true).search?.substring(1));
  const { fen, move = "", level = 10, info = false } = params;

  // Validate input
  if (!fen || isNaN(level)) {
    return res.status(400).json({ error: "Missing or invalid parameters!" });
  }

  const maxLevel = 30;
  var lines = [];
  var depth = Math.min(parseInt(level), maxLevel);
  const engine = Stockfish();

  const game = new Chess(fen);

  engine.onmessage = (line) => {
    if (info) {

      lines.push(line);
      if (line.startsWith("bestmove")) {
        res.json({ output: lines });
      }
    }
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


// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Stockfish server running on port ${PORT}`);
});
