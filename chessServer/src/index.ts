import "dotenv/config";


import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import morgan from "morgan";
import registerSocketHandlers from "./managers/EventHandlers";

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
  })
);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Register socket event handlers upon client connection
io.on("connection", (socket) => {
  registerSocketHandlers(socket, io);
});

// Start the server and listen on the defined port
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export { server, io };
