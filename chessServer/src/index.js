require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io"); // The Server constructor
const { io: ioClient } = require("socket.io-client"); // The Client factory
const cors = require("cors");
const morgan = require("morgan");
const registerSocketHandlers = require("./managers/EventHandlers");

const app = express();
const server = http.createServer(app);

app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// 1. Your existing Socket.IO SERVER (for your frontend client)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// 2. New Socket.IO CLIENT connection (to the Stockfish engine service)
const STOCKFISH_SERVER_URL = process.env.STOCKFISH_SERVER_URL ;
const stockfishSocket = ioClient(STOCKFISH_SERVER_URL, {
  autoConnect: true,
  reconnection: true,
});

stockfishSocket.on("connect", () => {
  console.log(`Connected to Stockfish service at ${STOCKFISH_SERVER_URL}`);
});

stockfishSocket.on("connect_error", (err) => {
  console.error("Stockfish connection error:", err.message);
});

// 3. Pass both local socket and the external stockfish connection to your handlers
io.on("connection", (socket) => {
  // Pass stockfishSocket down so your event handlers can talk to it
  registerSocketHandlers(socket, io, stockfishSocket);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Chess Server listening on port ${PORT}`);
});

// Export stockfishSocket along with the others if needed elsewhere
module.exports = { server, io, stockfishSocket };