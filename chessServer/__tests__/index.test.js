const { Server } = require("socket.io");
const { io } = require("socket.io-client");
const http = require("http");
require("dotenv").config();

let serverInstance;
let ioServer;
const PORT = process.env.PORT || 3001;
const SOCKET_URL = `http://localhost:${PORT}`;
const clients = [];

const sockets = new Set();
const rawSockets = new Set();

beforeAll((done) => {
  const app = require("express")();
  const server = http.createServer(app);
  const registerSocketHandlers = require("../managers/EventHandlers");

  ioServer = new Server(server, {
    cors: { origin: "*" },
  });

  ioServer.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("disconnect", () => sockets.delete(socket));
    registerSocketHandlers(socket, ioServer);
  });

  server.on("connection", (socket) => {
    rawSockets.add(socket);
    socket.on("close", () => rawSockets.delete(socket));
  });

  serverInstance = server.listen(PORT, () => {
    console.log(`Test server listening on ${PORT}`);
    done();
  });
});

afterAll(async () => {
  const TIMEOUT_MS = 500;

  await Promise.all(
    clients.map((client) => {
      return new Promise((resolve) => {
        try {
          client.removeAllListeners();
          if (client.connected) client.disconnect();
          if (typeof client.close === "function") client.close();
        } catch {}
        setTimeout(resolve, TIMEOUT_MS);
      });
    })
  );

  sockets.forEach((socket) => {
    try {
      socket.disconnect(true);
    } catch {}
  });

  rawSockets.forEach((socket) => {
    try {
      socket.destroy();
    } catch {}
  });

  await new Promise((resolve) => {
    try {
      ioServer?.close?.();
      serverInstance?.close(() => resolve());
    } catch {
      resolve();
    }
  });
});

jest.setTimeout(40000);

function createClient() {
  const client = io(SOCKET_URL, {
    transports: ["websocket"],
    forceNew: true,
  });
  clients.push(client);
  return client;
}

describe("Socket.IO Integration Tests (Real Server)", () => {
  test("connects successfully", (done) => {
    const client = createClient();
    client.on("connect", () => {
      expect(client.connected).toBe(true);
      client.disconnect();
      done();
    });
  });

  test("initializes a new game for student", (done) => {
    const client = createClient();

    client.on("connect", () => {
      client.emit(
        "newgame",
        JSON.stringify({
          student: "Erica",
          mentor: "Samuel",
          role: "student",
        })
      );
    });

    client.on("boardstate", (msg) => {
      const { boardState, color } = JSON.parse(msg);
      expect(boardState).toBeDefined();
      expect(color).toBe("black");
      client.disconnect();
      done();
    });
  });

  test("makes a valid move", (done) => {
    const student = createClient();
    const mentor = createClient();

    let moveMade = false;
    let studentBoardAfterMove = null;
    let mentorBoardAfterMove = null;

    student.on("connect", () => {
      student.emit(
        "newgame",
        JSON.stringify({
          student: "Alice",
          mentor: "Bob",
          role: "student",
        })
      );
    });

    mentor.on("connect", () => {
      mentor.emit(
        "newgame",
        JSON.stringify({
          student: "Alice",
          mentor: "Bob",
          role: "mentor",
        })
      );
    });

    mentor.on("boardstate", (msg) => {
      const payload = JSON.parse(msg);

      if (!moveMade && payload.boardState.includes("rnbqkbnr")) {
        moveMade = true;
        mentor.emit("move", JSON.stringify({ from: "e2", to: "e4" }));
        return;
      }

      if (moveMade) {
        mentorBoardAfterMove = payload.boardState;
        maybeFinishTest();
      }
    });

    student.on("boardstate", (msg) => {
      const payload = JSON.parse(msg);

      if (moveMade) {
        studentBoardAfterMove = payload.boardState;
        maybeFinishTest();
      }
    });

    function maybeFinishTest() {
      if (studentBoardAfterMove && mentorBoardAfterMove) {
        try {
          expect(studentBoardAfterMove).toBe(mentorBoardAfterMove);
          student.disconnect();
          mentor.disconnect();
          done();
        } catch (error) {
          done(error);
        }
      }
    }
  });

  test("undoes a move", (done) => {
    const student = createClient();
    const mentor = createClient();

    let moveStage = 0;
    let initialBoardState = null;
    let postStudentMoveState = null;
    let postUndoState = null;

    student.on("connect", () => {
      student.emit(
        "newgame",
        JSON.stringify({
          student: "Ryan",
          mentor: "John",
          role: "student",
        })
      );
    });

    mentor.on("connect", () => {
      mentor.emit(
        "newgame",
        JSON.stringify({
          student: "Ryan",
          mentor: "John",
          role: "mentor",
        })
      );
    });

    student.on("boardstate", (msg) => {
      const { boardState } = JSON.parse(msg);
      moveStage++;

      if (moveStage === 1) {
        initialBoardState = boardState;
        mentor.emit("move", JSON.stringify({ from: "g2", to: "g4" }));
      }

      if (moveStage === 2) {
        student.emit("move", JSON.stringify({ from: "a7", to: "a6" }));
      }

      if (moveStage === 3) {
        postStudentMoveState = boardState;
        student.emit("undo");
      }

      if (moveStage === 4) {
        postUndoState = boardState;
        try {
          expect(initialBoardState).toBeDefined();
          expect(postStudentMoveState).not.toBe(initialBoardState);
          expect(postUndoState).not.toBe(postStudentMoveState);
          expect(postUndoState).not.toBe(initialBoardState);

          student.disconnect();
          mentor.disconnect();
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  test("ends the game and emits reset", (done) => {
    const client = createClient();

    client.on("connect", () => {
      client.emit(
        "newgame",
        JSON.stringify({
          student: "Joseph",
          mentor: "Bill",
          role: "student",
        })
      );

      setTimeout(() => {
        client.emit(
          "endgame",
          JSON.stringify({
            student: "Joseph",
            mentor: "Bill",
          })
        );
      }, 500);
    });

    client.on("reset", () => {
      expect(true).toBe(true);
      client.disconnect();
      done();
    });
  });

  test("emits error for invalid role", (done) => {
    const client = createClient();

    client.on("connect", () => {
      client.emit(
        "newgame",
        JSON.stringify({
          student: "Jonathan",
          mentor: "Mike",
          role: "hacker",
        })
      );
    });

    client.on("gameerror", (msg) => {
      expect(msg).toMatch(/invalid/i);
      client.disconnect();
      done();
    });
  });
});
