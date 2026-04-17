require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const initializeSocket = require("./managers/socket");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Simple POST /api/analyze endpoint (mock) to support frontend testing.
app.post('/api/analyze', (req, res) => {
  try {
    const { type } = req.body || {};
    if (type !== 'move') {
      return res.json({ success: false, error: 'Only move analysis is supported in mock server' });
    }

    const fenBefore = req.body.fen_before || '';
    const fenAfter = req.body.fen_after || '';
    const move = req.body.move || '';

    if (!fenBefore || !fenAfter || !move) {
      return res.json({ success: false, error: 'Missing fen_before, fen_after or move in request' });
    }

    // Compute simple material delta using chess.js
    const { Chess } = require('chess.js');
    function materialSum(fen, color) {
      try {
        const ch = new Chess(fen);
        const board = ch.board();
        const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
        let sum = 0;
        for (let r = 0; r < 8; r++) {
          for (let f = 0; f < 8; f++) {
            const sq = board[r][f];
            if (!sq) continue;
            const v = values[sq.type] || 0;
            sum += sq.color === color ? v : -v;
          }
        }
        return sum;
      } catch (e) {
        return 0;
      }
    }

    const sideMoved = (fenBefore.split(' ')[1] === 'w') ? 'w' : 'b';
    const before = materialSum(fenBefore, sideMoved);
    const after = materialSum(fenAfter, sideMoved);
    const delta = after - before;

    let moveIndicator = 'Inaccuracy';
    if (delta >= 3) moveIndicator = 'Best';
    else if (delta >= 1) moveIndicator = 'Good';
    else if (delta <= -3) moveIndicator = 'Blunder';
    else if (delta <= -1) moveIndicator = 'Mistake';

    const analysisText = delta > 0
      ? `Net material gain of ${delta}. Favorable capture. Move: ${move}`
      : delta < 0
        ? `Net material loss of ${Math.abs(delta)}. This move lost material and may be a ${moveIndicator}. Move: ${move}`
        : `No material change. Move appears neutral. Move: ${move}`;

    const nextStepHint = (moveIndicator === 'Blunder' || moveIndicator === 'Mistake')
      ? 'Review the capture sequence and look for hanging pieces.'
      : 'Continue development and watch for opponent threats.';

    const explanation = {
      moveIndicator,
      Analysis: analysisText,
      nextStepHint,
    };

    return res.json({ success: true, explanation: JSON.stringify(explanation), bestMove: null });
  } catch (err) {
    console.error('Error in /api/analyze', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

io.on("connection", (socket) => {
  console.log(`Client connected ${socket.id}`);
  initializeSocket(socket);
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Stockfish server running on port ${PORT}`);
});
