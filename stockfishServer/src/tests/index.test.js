const ioClient = require("socket.io-client");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const socketHandler = require("../managers/socket");

describe("Server and socket", () => {
  let server, ioServer, clientSocket;
  let serverSocketId = null;
  const stockfishManager = socketHandler.__stockfishManager;

  beforeEach((done) => {
    const app = express();
    server = http.createServer(app);

    ioServer = new Server(server, {
      cors: { origin: "*", methods: ["GET", "POST"] },
    });

    ioServer.on("connection", (socket) => {
      socketHandler(socket);
    });

    // Mock the stockfishManager methods
    jest.spyOn(stockfishManager, 'registerSession').mockReturnValue(undefined);
    jest.spyOn(stockfishManager, 'updateFen').mockReturnValue(undefined);
    jest.spyOn(stockfishManager, 'evaluateFen').mockReturnValue(undefined);
    jest.spyOn(stockfishManager, 'deleteSession').mockReturnValue(undefined);

    server.listen(() => {
      const port = server.address().port;
      clientSocket = ioClient.connect(`http://localhost:${port}`, {
        transports: ["websocket"],
        forceNew: true,
      });

      clientSocket.on("connect", done);
    });
  });

  afterEach((done) => {
    jest.restoreAllMocks();
    
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    ioServer.close();
    server.close(done);
  });

  test("start-session emits session-started on success", (done) => {
    clientSocket.emit("start-session", { sessionType: "lesson", fen: "" });

    clientSocket.on("session-started", (data) => {
      expect(data.success).toBe(true);
      serverSocketId = data.id;
      expect(stockfishManager.registerSession).toHaveBeenCalled();
      done();
    });
  }, 10000);

  test("start-session emits session-error on failure", (done) => {
    stockfishManager.registerSession.mockImplementation(() => {
      throw new Error("Session failed");
    });

    clientSocket.emit("start-session", { sessionType: "lesson", fen: "" });

    clientSocket.on("session-error", (data) => {
      expect(data.error).toBe("Session failed");
      done();
    });
  }, 10000);

  test("update-fen calls updateFen", (done) => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

    clientSocket.emit("start-session", { sessionType: "lesson", fen: "" });

    clientSocket.on("session-started", (data) => {
      serverSocketId = data.id;

      clientSocket.emit("update-fen", { fen });

      setTimeout(() => {
        expect(stockfishManager.updateFen).toHaveBeenCalledWith(
          serverSocketId,
          fen
        );
        done();
      }, 100);
    });
  }, 10000);

  test("evaluate-fen calls evaluateFen", (done) => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const move = "e2e4";
    const level = 5;

    clientSocket.emit("start-session", { sessionType: "lesson", fen: "" });

    clientSocket.on("session-started", (data) => {
      serverSocketId = data.id;

      clientSocket.emit("evaluate-fen", { fen, move, level });

      setTimeout(() => {
        expect(stockfishManager.evaluateFen).toHaveBeenCalledWith(
          serverSocketId,
          fen,
          move,
          level
        );
        done();
      }, 100);
    });
  }, 10000);

  test("disconnect triggers deleteSession", (done) => {
    clientSocket.emit("start-session", { sessionType: "lesson", fen: "" });

    clientSocket.on("session-started", (data) => {
      serverSocketId = data.id;

      clientSocket.disconnect();

      setTimeout(() => {
        expect(stockfishManager.deleteSession).toHaveBeenCalledWith(
          serverSocketId
        );
        done();
      }, 100);
    });
  }, 10000);
});
