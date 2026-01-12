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


function withTimeout(promise, ms, label) {
  let id;
  const timeout = new Promise((_, reject) => {
    id = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(id));
}


// REST API endpoint for analysis requests
app.post("/api/analyze", async (req, res) => {
  const TOTAL_MS = 15000;

  try {
    const { type, ...data } = req.body;

    if (type === "move") {
      const result = await withTimeout(
        analysisService.analyzeMoveWithHistory({
          fen_before: data.fen_before,
          fen_after: data.fen_after,
          move: data.move,
          uciHistory: data.uciHistory,
          depth: data.depth || 15,
          chatHistory: data.chatHistory || [],
          multipv: data.multipv || 15,
        }),
        TOTAL_MS,
        "Move analysis"
      );

      return res.json({
        success: true,
        type: "move",
        explanation: result.explanation,
        cached: result.cached,
        bestMove: result.bestMove || null,
      });
    }

    if (type === "question") {
      const result = await withTimeout(
        analysisService.answerQuestion({
          fen: data.fen,
          question: data.question,
          chatHistory: data.chatHistory || [],
        }),
        TOTAL_MS,
        "Question analysis"
      );

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
    const msg = error?.message || "Internal server error";
    const msgLower = msg.toLowerCase();
    
    // Classify error types
    let errorCode = "INTERNAL_ERROR";
    let retryable = false;
    let statusCode = 500;

    if (msg === "OPENAI_INVALID_RESPONSE") {
      errorCode = "OPENAI_INVALID_RESPONSE";
      retryable = true;
      statusCode = 500;
    } else if (msgLower.includes("openai") && msgLower.includes("timeout")) {
      errorCode = "OPENAI_TIMEOUT";
      retryable = true;
      statusCode = 504;
    } else if (msgLower.includes("rate limit") || msgLower.includes("rate_limit")) {
      errorCode = "OPENAI_RATE_LIMIT";
      retryable = true;
      statusCode = 429;
    } else if (msgLower.includes("openai")) {
      errorCode = "OPENAI_API_ERROR";
      retryable = true;
      statusCode = 500;
    } else if (msgLower.includes("stockfish") && msgLower.includes("timeout")) {
      errorCode = "STOCKFISH_TIMEOUT";
      retryable = true;
      statusCode = 504;
    } else if (msgLower.includes("stockfish") && (msgLower.includes("network") || msgLower.includes("fetch"))) {
      errorCode = "STOCKFISH_NETWORK_ERROR";
      retryable = true;
      statusCode = 502;
    } else if (msgLower.includes("stockfish") && msgLower.includes("parse")) {
      errorCode = "STOCKFISH_PARSE_ERROR";
      retryable = false;
      statusCode = 500;
    } else if (msgLower.includes("validation")) {
      errorCode = "VALIDATION_ERROR";
      retryable = false;
      statusCode = 400;
    } else if (msgLower.includes("network") || msgLower.includes("fetch") || msgLower.includes("econnrefused")) {
      errorCode = "NETWORK_ERROR";
      retryable = true;
      statusCode = 502;
    } else if (msgLower.includes("timed out")) {
      errorCode = "TIMEOUT";
      retryable = true;
      statusCode = 504;
    }

    return res.status(statusCode).json({
      success: false,
      error: msg,
      errorCode,
      retryable,
    });
  }
});



// Start the server and listen on the defined port
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = { server, io };