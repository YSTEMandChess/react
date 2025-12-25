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

io.on("connection", (socket) => {
  console.log(`Client connected ${socket.id}`);
  initializeSocket(socket);
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Stockfish server running on port ${PORT}`);
});
