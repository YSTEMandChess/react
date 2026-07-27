import "dotenv/config";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import morgan from "morgan";
import registerSocketHandlers from "./managers/EventHandlers";
import { io as ioClient } from "socket.io-client";

const app = express();
const server = http.createServer(app);

// Add logging functionality to the server
app.use(morgan("dev"));

// Apply CORS middleware to handle cross-origin requests
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// 2. New Socket.IO CLIENT connection (to the Stockfish engine service)
const STOCKFISH_SERVER_URL =
  process.env.STOCKFISH_SERVER_URL || "http://localhost:5000";
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
  console.log(" conncteuneond");
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Chess Server listening on port ${PORT}`);
});

export { server, io };
