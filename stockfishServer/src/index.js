// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const rateLimit = require("express-rate-limit");
const { Chess } = require("chess.js");
const Stockfish = require("stockfish");
const querystring = require("querystring");
const url = require("url");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
const { spawn } = require("child_process");

const app = express();

// Set rate limit - 30 requests/minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests! Please try again." },
});
app.use(limiter);

app.use(express.json());
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


//Stockfish function to get the move/game analysis 
function runStockfish({ fen, moves = "", depth = 15 }) {
  return new Promise((resolve) => {
    const engine = spawn("stockfish");
    let infoLines = [];

    engine.stdout.on("data", data => {
      data.toString().split("\n").forEach(line => {
        if (!line.trim()) return;

        if (line.startsWith("info")) infoLines.push(line);

        if (line.startsWith("bestmove")) {
          engine.stdin.write("quit\n");
          engine.kill();
          resolve({
            bestMove: line.split(" ")[1],
            infoLines
          });
        }
      });
    });

    engine.stdin.write("uci\n");
    engine.stdin.write("isready\n");
    engine.stdin.write(`position fen ${fen} ${moves ? "moves " + moves : ""}\n`);
    engine.stdin.write(`go depth ${depth}\n`);
  });
}

//Takes request from middleware and sends back the stockfish engine response
app.post("/analysis",async (req, res) => {
  try{
    const { fen, moves="", depth=12 } = req.body;
    
    if (!fen) return res.status(400).json({ error: "fen required" });

    const result = await runStockfish({
      fen,
      moves,
      depth: Number(depth || 12)
    });

    res.json(result);
  }
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Stockfish error" });
  }

})


// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Stockfish server running on port ${PORT}`);
});
