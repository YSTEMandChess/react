require('dotenv').config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const registerSocketHandlers = require("./managers/EventHandlers");

const app = express();
const server = http.createServer(app);

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

// Start the server and listen on the defined port
server.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});