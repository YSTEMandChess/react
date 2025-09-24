require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// Import the socket handlers that use StockfishManager
const initializeSocket = require("./socket");

const app = express();
const server = http.createServer(app);

// Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: { error: "Too many requests!" },
  })
);

app.get("/health", (req, res) => res.json({ status: "OK" }));

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`New client (${socket.id}) connected!`);
  initializeSocket(io, socket); // StockfishManager handles all session events
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Stockfish server running on port ${PORT}`));
