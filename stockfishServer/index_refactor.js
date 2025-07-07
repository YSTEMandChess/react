const http = require("http");
const { spawn } = require("child_process");
const chess = require("chess.js");
const querystring = require("querystring");
const url = require("url");

const maxLevel = 99;

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  // Parse params from URL
  const params = querystring.parse(url.parse(req.url, true).search?.substring(1));
  if (!params.fen || !params.level) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Missing fen or level parameter" }));
    return;
  }

  // Cap the level
  let level = parseInt(params.level);
  if (isNaN(level) || level > maxLevel) level = maxLevel;

  let enginePath;

  switch (process.platform) {
    case 'win32':
      enginePath = "./bin./stockfish_20011801_x64.exe";
      break;
    case 'darwin':
      enginePath = "./bin/stockfish-macos";
      break;
    case 'linux':
      enginePath = "./bin/stockfish-ubuntu";
      break;
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
}

  // Spawn the stockfish engine process
  const engine = spawn(enginePath);

  engine.stdout.on("data", (data) => {
    const line = data.toString().trim();
    console.log("engine output:", line)

    if (line.includes("bestmove")) {
      let move = getBestMove(line);

      if(params.fen == "5k2/3q2pp/8/4N3/8/8/6PP/5RK1 b - - 1 1") {
        move = "f8e7";
      } else if (params.fen == "r4k2/2r2pp1/3P3p/8/4B3/5N2/6PP/5RK1 b - - 0 1"){
        move = "c7d7";
      } else if (params.fen == "8/1b1Q1ppk/p3p2p/1p1q4/3Ppb2/1P2B1P1/P6P/2R3K1 w - - 1 2"){
        move = "d7d5";
      } else if (params.fen == "r6r/2q2P1p/p1k3p1/1p1Bp3/8/2P1B3/P1PR2PP/5RK1 b - - 0 24"){
        move = "c6d7";
      } else if (params.fen == "2b5/7p/3k2pP/1p1p1pPB/1P1P1K2/8/5P2/8 b - - 1 1"){
        move = "c8e6";
      } else if (params.fen == "2r2r1k/1pN1Qpbp/p3Bpp1/qb6/8/8/PP3PPP/2RR2K1 b - - 11 23"){
        move = "b5e2";
      } else if (params.fen == "8/6p1/5p1k/BP1B4/5P1p/7P/2R3P1/r5Kn w - - 1 2") {
        move = "a5e1";
      } else if (params.fen == "5q2/1b4pk/1p2p1n1/1PNpPp2/P2P1P1p/rB3R1P/1Q4PK/8 b - - 3 46") {
        move = "a3b3";
      } else if (params.fen == "rnb2r1k/pp1n1ppB/4p3/3pP3/3p3Q/2N4N/PPP2PP1/R3K2R b KQ - 0 12"){
        move = "g7g5";
      } else if (params.fen == "8/5pk1/4p3/1p6/6P1/4P2p/PR2KP2/3r4 w - - 1 2"){
        move = "e2d1";
      } else if (params.fen == "r6k/ppN2pPp/6p1/5q2/1p3Rn1/1P6/P5PP/3R1K2 b - - 0 2"){
        move = "h8g8";
      } else if (params.fen == "1q2rk2/1p3ppp/p4R2/2N5/1P6/6P1/P1Q3KP/8 b - - 0 1"){
        move = "b8c8";
      } else if (params.fen == "8/2k5/3r1Np1/1p4K1/5P2/8/1n2R3/8 b - - 4 57"){
        move = "d6d1";
      } else if (params.fen == "8/8/8/8/1k6/p7/8/1K6 b - - 1 2"){
        move = "a3a2";
      } else if (params.fen == "8/8/8/4p3/4k3/8/4K3/8 b - - 1 1"){
        move = "e4d4";
      } else if (params.fen == "8/8/8/8/3k4/4p3/8/4K3 b - - 1 4"){
        move = "e3e2";
      } else if (params.fen == "8/8/8/5kp1/8/8/8/5K2 b - - 1 1"){
        move = "g5g4";
      } else if (params.fen == "8/8/8/5k2/6p1/8/5K2/8 b - - 1 2"){
        move = 'g4g3';
      } else if (params.fen == "8/8/8/5k2/8/6p1/6K1/8 b - - 1 3"){
        move = 'f5e4';
      } else if (params.fen == "6N1/7K/5k2/8/8/8/8/6r1 b - - 0 1"){
        move = "g1g8";
      }

      const game = new chess.Chess(params.fen);
      const result = game.move(move, { sloppy: true });

      if (result) {
        const response = {
          fen: game.fen(),
          move: move,
          piece: result.piece.toUpperCase(),
          color: result.color,
          to: result.to,
        };
        res.end(JSON.stringify(response));
      } else {
        res.end(JSON.stringify({ error: "Invalid move from engine" }));
      }
      engine.kill();
    }
  });

  engine.stderr.on("data", (data) => {
    console.error(`Engine error: ${data.toString()}`);
  });

  engine.on("error", (err) => {
    console.error("Failed to start engine:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Engine start failure" }));
  });

  // Send commands to engine
  engine.stdin.write(`position fen ${params.fen}\n`);
  engine.stdin.write(`go depth ${level}\n`);
}).listen(process.env.PORT || 8080, () => {
  console.log(`Stockfish server listening on port ${process.env.PORT || 8080}`);
});

function getBestMove(output) {
  const lines = output.split('\n');
  for (const line of lines) {
    if (line.startsWith('bestmove')) {
      const parts = line.split(' ');
      return parts[1];
    }
  }
  return null;
}