require('dotenv').config()

const express = require('express');
const socketIo = require('socket.io');
const { Chess } = require('chess.js');
const cors = require('cors');
const http = require('http');
const initializeSocket = require('./socket');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    return res.json({ status: "OK" });
});

io.on("connection", (socket) => {
    console.log(`New client (${socket.id}) connected!`);
    initializeSocket(io, socket);
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Stockfish server running on port ${PORT}`);
});