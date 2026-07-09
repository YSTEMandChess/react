import { URLSearchParams } from "url";

const GameManager = require("./GameManager");

const gameManager = new GameManager();

export type GameMetaData = {
  userId?: number;
  user?: User;
  opponent?: User;
  uuid?: string;
  opponentId?: string;
  gameName: string;
  gameType: "computer" | "friend" | "mentor" | "guest";
  computerLevel: number | null;
  fen: string;
  movesList: string[];
  playerColor: "white" | "black";
  status: "won" | "lost" | "ongoing" | "draw";
  createdAt: string;
  updatedAt: string;
};
export type User = {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  id: number;
};

/**
 * Registers all socket event handlers for a given connection.
 * @param {Socket} socket - The connected socket instance
 * @param {Server} io - The Socket.IO server instance
 */
const registerSocketHandlers = (socket, io, stockfish) => {
  console.log("A user connected to socket:", socket.id);

  /**
   * Handles creating a new game or joining an existing one
   * Expected payload: { student, mentor, role }
   */
  //going to destucture to be able to to take new game data type

  socket.on("newgame", async (msg) => {
    try {
      //Code for starting Games that will be saved
      const {
        student,
        mentor,
        role,
        userId,
        user,
        opponent,
        opponentId,
        gameName,
        gameType,
        computerLevel,
        fen,
        movesList,
        playerColor,
        status,
        createdAt,
        updatedAt,
      } = JSON.parse(msg);
      const gameMetaData = {
        userId,
        user,
        opponent,
        opponentId,
        gameName,
        gameType,
        computerLevel,
        fen,
        movesList,
        playerColor,
        status,
        createdAt,
        updatedAt,
      } as GameMetaData;

      const result = gameManager.createOrJoinGame({
        socketId: socket.id,
        gameMetaData: gameMetaData,
        student: student,
        mentor: mentor,
        role: role,
      });

      if (gameMetaData.gameType != "guest") {
        console.log("saving new Game to backend");
        const res = await fetch(
          `${process.env.MIDDLEWARE_URL}/savedGames/addgame`,
          {
            method: "POST",
            body: JSON.stringify(gameMetaData),
          },
        );
        if (!res.ok) {
          throw new Error("Did not Save the Game to the backend.");
        }
      }

      socket.emit(
        "boardstate",
        JSON.stringify({
          boardState: result.game.boardState.fen(),
          color: result.color,
        }),
      );
    } catch (err) {
      socket.emit("gameerror", err.message);
    }
  });

  /**
   * Handles creating a new puzzle or joining an existing one
   * Expected payload: { student, mentor, role }
   */
  socket.on("newPuzzle", (msg) => {
    try {
      const parsed = JSON.parse(msg);
      console.log("data", parsed, msg);
      // create the new puzzle
      gameManager.createOrJoinPuzzle(
        {
          student: parsed.student,
          mentor: parsed.mentor,
          role: parsed.role,
          socketId: socket.id,
          credentials: parsed.credentials,
        },
        io,
      );
    } catch (err) {
      socket.emit("gameerror", err.message);
      console.log(err.message);
    }
  });

  /**
   * Handles player move request
   * Expected payload: { from, to }
   */
  socket.on("move", async (msg) => {
    try {
      const { from, to, promotion, computerMove, username, credentials } =
        JSON.parse(msg);

      const res = await gameManager.makeMove(socket.id, from, to, promotion);
      const state = res.result;
      const gameMetaData = state.gameMetaData as GameMetaData;
      gameManager.broadcastBoardState(res.result, io);
      console.log("Move: ", res);
      if (!computerMove && credentials) {
        const activityEvents = res.activityEvents;
        if (activityEvents && activityEvents.length > 0) {
          const studentId = state.studentId;
          const payload = {
            activities: activityEvents,
            lastMove: { from, to, san: state.move?.san },
          };
          console.log("Payload", payload);
          const studentSocket = io.sockets.sockets.get(studentId);
          //console.log('student socket', studentSocket);
          if (studentSocket) {
            try {
              console.log(
                "route:",
                `${process.env.MIDDLEWARE_URL}/activities/${username}/activity`,
              );
              const response = await fetch(
                `${process.env.MIDDLEWARE_URL}/activities/${username}/activity`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authentication: `Bearer ${credentials}`,
                  },
                  body: JSON.stringify({
                    activityName: payload.activities[0].name,
                  }),
                },
              );
              console.log("response", response);
              socket.emit("completeActivity");
            } catch (e) {
              console.log("Error: ", e);
            }
          }
        }
      }
      //update game in backend
      if (gameMetaData.gameType !== "guest") {
        console.log("Saving game to the backend...");

        const { movesList, fen, uuid } = gameMetaData;
        const updatedAt = new Date().toISOString();

        const newGameSettings = {
          movesList,
          fen,
          updatedAt,
        };

        try {
          const res = await fetch(
            `${process.env.MIDDLEWARE_URL}/savedGames/game/${uuid}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(newGameSettings),
            },
          );

          if (!res.ok) {
            throw new Error("Failed to save game.");
          }

          const data = await res.json();

          console.log("Saved to backend!", data);
        } catch (error) {
          console.error("Error saving game:", error);
        }
      }
    } catch (err) {
      socket.emit("error", err.message);
      console.log("error thrown", err);
    }
  });
  socket.on("completeActivity", () => {
    console.log("activity completed");
  });

  /**
   * Handles undo move request
   */
  socket.on("undo", () => {
    try {
      const result = gameManager.undoMove(socket.id);
      gameManager.broadcastBoardState(result, io);
    } catch (err) {
      socket.emit("error", err.message);
    }
  });

  /**
   * Ends the current game
   * Expected payload: { student, mentor }
   */
  socket.on("endgame", (msg) => {
    try {
      const { student, mentor } = JSON.parse(msg);
      const result = gameManager.endGame(student, mentor);
      io.to(result.studentId).emit("reset");
      io.to(result.mentorId).emit("reset");
      console.log("game ended successfully");
    } catch (err) {
      console.log("error", err.message);
      socket.emit("error", err.message);
    }
  });

  /**
   * Allows board state override
   * Expected payload: { state: fenString }
   */
  socket.on("setstate", (msg) => {
    try {
      const { state } = JSON.parse(msg);
      const result = gameManager.setBoardState(socket.id, state);
      gameManager.broadcastBoardState(result, io);
    } catch (err) {
      socket.emit("error", err.message);
    }
  });

  /**
   * Allows board state & color override (specifically for puzzles)
   * Expected payload: { state: fenString, color, hints }
   */
  socket.on("setstateColor", (msg) => {
    try {
      const { state, color, hints } = JSON.parse(msg);
      gameManager.setBoardColor(socket.id, state, color, hints, io); // modify the game in the server game manager
    } catch (err) {
      socket.emit("error", err.message);
    }
  });

  /**
   * Broadcasts the last move made (for highlighting)
   * Expected payload: { from, to }
   */
  socket.on("lastmove", (msg) => {
    try {
      const { from, to } = JSON.parse(msg);
      gameManager.broadcastLastMove(socket.id, from, to, io);
    } catch (err) {
      socket.emit("error", err.message);
    }
  });

  /**
   * Broadcasts any simple string messages
   * Expected payload: { message }
   */
  socket.on("message", (msg) => {
    try {
      const { message } = JSON.parse(msg);
      gameManager.broadcastSimpleMessage(socket.id, message, io);
    } catch (err) {
      socket.emit("error", err.message);
    }
  });

  const relayEvents = [
    "addgrey",
    "removegrey",
    "mousexy",
    "piecedrag",
    "piecedrop",
    "highlight",
  ];

  // Generic relay handler
  relayEvents.forEach((eventName) => {
    socket.on(eventName, (msg) => {
      try {
        const data = JSON.parse(msg);
        gameManager.relayToOpponent(socket.id, eventName, data, io);
      } catch (err) {
        socket.emit("error", err.message);
      }
    });
  });

  socket.on("disconnect", () => {
    const game = gameManager.getGameBySocketId(socket.id);
    if (!game) {
      console.log("game not found for this socket");
      return;
    }

    const result = gameManager.endGame(
      game.student.username,
      game.mentor.username,
    );

    // reset game
    io.to(result.studentId).emit("reset");
    io.to(result.mentorId).emit("reset");
    console.log("game ended successfully");
  });
};

export default registerSocketHandlers;
