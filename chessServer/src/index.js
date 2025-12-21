require('dotenv').config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const registerSocketHandlers = require("./managers/EventHandlers");
const analysisService = require("./services/AnalysisService");

const app = express();
const server = http.createServer(app);

// Add logging functionaility to the server
app.use(morgan("dev")) // dev -> preset format

// Parse JSON bodies
app.use(express.json());

// Apply CORS middleware to handle cross-origin requests
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}));

// Initialize Socket.IO with CORS configuration
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Register socket event handlers upon client connection
io.on("connection", (socket) => {
  registerSocketHandlers(socket, io);
});



// REST API endpoint for analysis requests
app.post("/api/analyze", async (req, res) => {
  try {
    const { type, ...data } = req.body;

    if (type === "move") {
      const result = await analysisService.analyzeMoveWithHistory({
        fen_before: data.fen_before,
        fen_after: data.fen_after,
        move: data.move,
        uciHistory: data.uciHistory,
        depth: data.depth || 12,
        chatHistory: data.chatHistory || [],
      });

      return res.json({
        success: true,
        type: "move",
        explanation: result.explanation,
        cached: result.cached,
      });
    }

    if (type === "question") {
      const result = await analysisService.answerQuestion({
        fen: data.fen,
        question: data.question,
        chatHistory: data.chatHistory || [],
      });

      return res.json({
        success: true,
        type: "question",
        answer: result.answer,
        cached: result.cached,
      });
    }

    return res.status(400).json({
      success: false,
      error: `Unknown request type: ${type}. Expected 'move' or 'question'`,
    });
  } catch (error) {
    console.error("[API] Analysis error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});



// Start the server and listen on the defined port
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = { server, io };