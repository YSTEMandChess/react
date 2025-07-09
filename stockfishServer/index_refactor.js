const http = require("http");
const { spawn } = require("child_process");
const chess = require("chess.js");
const querystring = require("querystring");
const url = require("url");

const maxLevel = 30;

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

  // Spawn the stockfish engine process
  const engine = spawn("./bin/stockfish.exe");

  engine.stdout.on("data", (data) => {
    const line = data.toString().trim();
    console.log("engine output:", line)

    if (line.includes("bestmove")) {
      const move = getBestMove(line);
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
