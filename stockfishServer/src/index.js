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

function extractScore(line) {
  const mate = line.match(/score mate (-?\d+)/);
  if (mate) return { type: "mate", value: Number(mate[1]) };

  const cp = line.match(/score cp (-?\d+)/);
  if (cp) return { type: "cp", value: Number(cp[1]) };

  return null;
}

function classifyMove(delta) {
  // bestRawCp: from initial position (White to move)
  // playedRawCp: from after White move (Black to move)


  let label;
  if (delta >= -10) label = "Best";
  else if (delta >= -30) label = "Good";
  else if (delta >= -75) label = "Inaccuracy";
  else if (delta >= -200) label = "Mistake";
  else label = "Blunder";

  return label;
}


function extractTopBestMoves(infoLines, limit = 15) {
  return infoLines
    .filter(line => line.includes(" multipv "))
    .map(line => {
      const multipv = Number(line.match(/multipv (\d+)/)?.[1]);

      const mateMatch = line.match(/score mate (-?\d+)/);
      const cpMatch = line.match(/score cp (-?\d+)/);

      const scoreType = mateMatch ? "mate" : "cp";
      const score = mateMatch
        ? Number(mateMatch[1])
        : Number(cpMatch?.[1]);

      const pvPart = line.split(" pv ")[1];
      const bestMove = pvPart?.split(" ")[0];

      return {
        rank: multipv,
        move: bestMove,
        scoreType,
        score
      };
    })
    .sort((a, b) => a.rank - b.rank) // multipv order = strength
    .slice(0, limit);
}


//Stockfish function to get the move/game analysis 
function runStockfish({ fen, moves = "", depth = 15, multipv }) {
  return new Promise((resolve) => {
    const engine = spawn("stockfish");
    let infoLines = [];

    engine.stdout.on("data", data => {
      data.toString().split("\n").forEach(line => {
        if (!line.trim()) return;

        if (line.startsWith(`info depth ${depth}`)) infoLines.push(line.replace(/\s(nodes|nps|hashfull|tbhits|time)\s+\d+/g, ''));

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
    engine.stdin.write(`setoption name MultiPV value ${multipv}\n`);
    engine.stdin.write("setoption name UCI_ShowWDL value true\n");
    engine.stdin.write("isready\n");
    engine.stdin.write(`position fen ${fen} ${moves ? "moves " + moves : ""}\n`);
    engine.stdin.write(`go depth ${depth}\n`);
  });
}

//Takes request from middleware and sends back the stockfish engine response
app.post("/analysis",async (req, res) => {
  try{
    console.log(req.body);
    const { fen, moves="", depth=12, multipv } = req.body;
    
    if (!fen) return res.status(400).json({ error: "fen required" });

    const currentPositionAnalysis = await runStockfish({
      fen,
      depth: Number(depth || 15),
      multipv
    });

    const playerMoveAnalysis = await runStockfish({
      fen,
      moves,
      depth: Number(depth || 15),
      multipv
    })

    const CPUMoveAnalysis = await runStockfish({
      fen,
      moves : `${moves} ${playerMoveAnalysis.bestMove}`,
      depth: Number(depth || 15),
      multipv
    })
    console.log(`${moves} ${playerMoveAnalysis.bestMove}`);
    console.log("current position");
    console.log(currentPositionAnalysis);
    console.log("player move");
    console.log(playerMoveAnalysis);
    console.log("CPU move");
    console.log(CPUMoveAnalysis)

    const topBestMoves = extractTopBestMoves(currentPositionAnalysis.infoLines);
    const nextBestMoves = extractTopBestMoves(CPUMoveAnalysis.infoLines);
    
    const stockFishAnalysis = {
      fen : fen,
      topBestMoves : topBestMoves,
      player_moves : moves,
      evaluation : {
        "before" : extractScore(currentPositionAnalysis.infoLines[0]),
        "after" : extractScore(playerMoveAnalysis.infoLines[0]),
        "delta" : (-1* extractScore(playerMoveAnalysis.infoLines[0]).value ) - extractScore(currentPositionAnalysis.infoLines[0]).value
      },
      classify : classifyMove((-1* extractScore(playerMoveAnalysis.infoLines[0]).value ) - extractScore(currentPositionAnalysis.infoLines[0]).value),
      cpuMove : playerMoveAnalysis.bestMove,
      cpuPV : playerMoveAnalysis.infoLines[0].split(" pv ")[1],
      nextBestMoves : nextBestMoves
    };

    console.log(stockFishAnalysis)
    
    res.json(stockFishAnalysis);
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
