/**
 * Stockfish Server - Socket.IO Version (New)
 * 
 * Refactored version of the Stockfish chess engine server using Socket.IO
 * instead of REST API. Provides real-time chess position evaluation.
 * 
 * This is the newer implementation that uses WebSockets for better
 * real-time communication compared to the REST API version (index.js).
 * 
 * Features:
 * - Socket.IO for real-time bidirectional communication
 * - Stockfish chess engine integration
 * - Session-based engine management
 * - Health check endpoint
 * - CORS enabled for cross-origin requests
 */

require('dotenv').config()

const express = require('express');
const socketIo = require('socket.io');
const { Chess } = require('chess.js');
const cors = require('cors');
const http = require('http');
const initializeSocket = require('./socket');

// Initialize Express application
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS settings
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Apply middleware
app.use(cors());
app.use(express.json());

/**
 * Health check endpoint
 * Used to verify server is running and responsive
 */
app.get("/health", (req, res) => {
    return res.json({ status: "OK" });
});

/**
 * Handle new Socket.IO client connections
 * Initializes Stockfish session for each connected client
 */
io.on("connection", (socket) => {
    console.log(`New client (${socket.id}) connected!`);
    initializeSocket(io, socket);
});

// Start the server on specified port
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Stockfish server running on port ${PORT}`);
});