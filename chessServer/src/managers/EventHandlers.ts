import { URLSearchParams } from "url";
import { GameInstance } from "./GameManager";
import { disconnect } from "cluster";

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
  console.log("A user connected to stockfish:", stockfish.id);

  /**
   * Handles creating a new game or joining an existing one
   * Expected payload: { student, mentor, role }
   */
  //going to destucture to be able to to take new game data type

  socket.on("newgame", async (gameMetaData: GameMetaData) => {
    try {
      //Starting Up Stockfish for Guest or Computer Games
      if (
        gameMetaData.gameType === "computer" ||
        gameMetaData.gameType === "guest"
      ) {
        const stockfishSessionId = await startStockfish(
          stockfish,
          gameMetaData,
        );
        if (!stockfishSessionId) {
          throw new Error("Can't get Stockfish to start session");
        }
      }
      //Saving non Guest Games to the backend
      if (gameMetaData.gameType !== "guest") {
        gameMetaData.uuid = null;
        const res = await fetch(
          `${process.env.MIDDLEWARE_URL}/savedGames/addgame`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(gameMetaData),
          },
        );

        if (!res.ok) {
          throw new Error("Did not save the game to the backend.");
        }
        const data = await res.json();
        const { uuid } = data;
        gameMetaData.uuid = uuid;
        const { fen } = data;
        if (fen) {
          gameMetaData.fen = fen;
        }
      }
      //result return an object {game / newgame}
      let result = gameManager.createOrJoinGame({
        socketId: socket.id,
        stockfishSocketId: stockfish.id,
        gameMetaData,
      });

      gameManager.broadcastBoardState(result.game, io);
    } catch (err: any) {
      socket.emit("Error Creating a New Game", err.message);
    }
  });

  const startStockfish = (stockfish: any, gameMetaData: GameMetaData) => {
    //starts stockfish session with specific game data
    return new Promise<string>((resolve, reject) => {
      stockfish.on("session-started", ({ success, id }) => {
        if (success) {
          resolve(id);
        } else {
          reject(new Error("Failed to start Stockfish session."));
        }
      });

      stockfish.emit("start-session", {
        sessionType: "pvp",
        fen: gameMetaData.fen,
        gameSocket: socket.id,
      });
    });
  };
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

      const game = gameManager.getGameById(socket.id) as GameInstance;
      if (computerMove) {
        const fen = game.gameMetaData.fen;
        const level = game.gameMetaData.computerLevel;
        stockfish.emit("evaluate-fen", {
          gameSocket: socket.id,
          fen: fen,
          level: level,
        });
        return;
      }
      if (from && to) {
        const res = (await gameManager.makeMove(
          socket.id,
          from,
          to,
          promotion,
        )) as { game: GameInstance; activityEvents: [any] };
        const gameMetaData = res.game.gameMetaData as GameMetaData;
        if (!computerMove && credentials) {
          const activityEvents = res.activityEvents;
          if (activityEvents && activityEvents.length > 0) {
            const boardColor =
              res.game.boardState.turn() == "w" ? "white" : "black";

            const studentId =
              gameMetaData.playerColor == boardColor
                ? gameMetaData.opponentId
                : gameMetaData.userId;
            const studentSocket = io.sockets.sockets.get(studentId);
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
                    },
                    body: JSON.stringify({
                      activityName: res.activityEvents[0].name,
                    }),
                  },
                );
                socket.emit("completeActivity");
              } catch (e) {
                console.log("Error: ", e);
              }
            }
          }
        }
        //update game in backend
        if (gameMetaData.gameType !== "guest") {
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
          } catch (error) {
            console.error("Error saving game:", error);
          }
        }
        gameManager.broadcastBoardState(res.game, io);
      }
    } catch (err) {
      socket.emit("error", err.message);
    }
  });

  stockfish.on(
    "evaluation-complete",
    async ({ mode, moveDetails, gameSocket }) => {
      try {
        const socketId = gameSocket || socket.id;

        const game = gameManager.getGameById(socketId) as GameInstance;
        if (!game) {
          throw new Error("Game instance not found for the given socket ID.");
        }

        if (mode !== "move" || !moveDetails) {
          return;
        }

        const { from, to, promotion } = moveDetails;

        const res = (await gameManager.makeMove(
          socketId,
          from,
          to,
          promotion,
        )) as {
          game: GameInstance;
          activityEvents: [any];
        };

        const gameMetaData = res.game.gameMetaData as GameMetaData;
        const activityEvents = res.activityEvents;

        //
        // Complete activity
        //
        if (activityEvents && activityEvents.length > 0) {
          // After makeMove(), turn() is the player whose turn is NEXT.
          const boardColor =
            res.game.boardState.turn() === "w" ? "white" : "black";

          const studentId =
            gameMetaData.playerColor === boardColor
              ? gameMetaData.opponentId
              : gameMetaData.userId;

          const username =
            gameMetaData.playerColor === boardColor
              ? gameMetaData.opponent?.username
              : gameMetaData.user?.username;

          const studentSocket =
            studentId != null
              ? io.sockets.sockets.get(studentId.toString())
              : undefined;

          if (studentSocket && username) {
            try {
              const response = await fetch(
                `${process.env.MIDDLEWARE_URL}/activities/${username}/activity`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    activityName: activityEvents[0].name,
                  }),
                },
              );

              if (response.ok) {
                studentSocket.emit("completeActivity");
              }
            } catch (e) {
              console.error("Error updating activity:", e);
            }
          }
        }

        //
        // Save game
        //
        if (gameMetaData.gameType !== "guest") {
          const { movesList, fen, uuid } = gameMetaData;

          try {
            const response = await fetch(
              `${process.env.MIDDLEWARE_URL}/savedGames/game/${uuid}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  movesList,
                  fen,
                  updatedAt: new Date().toISOString(),
                }),
              },
            );

            if (!response.ok) {
              throw new Error("Failed to save game after engine move.");
            }
          } catch (error) {
            console.error("Error saving game after engine move:", error);
          }
        }

        gameManager.broadcastBoardState(res.game, io);
      } catch (err: any) {
        socket.emit("error", err.message);
      }
    },
  );
  socket.on("completeActivity", () => {
    console.log("activity completed");
  });

  /**
   * Handles undo move request
   */
  socket.on("undo", () => {
    try {
      const result = gameManager.undoMove(socket.id);
      gameManager.broadcastBoardState(result.game, io);
    } catch (err) {
      socket.emit("error", err.message);
    }
  });

  /**
   * Ends the current game
   * Expected payload: { student, mentor }
   */
  socket.on("endgame", async (gameMetaData: GameMetaData) => {
    if (!gameMetaData.uuid) {
      const result = gameManager.endGame(socket.id, gameMetaData);
      io.to(result.studentId).emit("reset", gameMetaData);

      if (result.opponentId !== stockfish.id) {
        io.to(result.opponentId).emit("reset", gameMetaData);
      }

      console.log("game ended successfully");
      return;
    }

    try {
      const newGameSettings = { status: gameMetaData.status };

      const res = await fetch(
        `${process.env.MIDDLEWARE_URL}/savedGames/game/${gameMetaData.uuid}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newGameSettings),
        },
      );

      if (!res.ok) {
        throw new Error("could not end game");
      }

      const result = gameManager.endGame(socket.id, gameMetaData);

      io.to(result.studentId).emit("reset", gameMetaData);

      if (result.opponentId !== stockfish.id) {
        io.to(result.opponentId).emit("reset", gameMetaData);
      }

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
      console.log("game not found for this socket, disconnecting");
      return;
    }

    const result = gameManager.endGame(
      game.uuid,
      game.student?.username,
      game.mentor?.username,
    );

    // reset game
    if (result.studentId) {
      io.to(result.studentId).emit("reset");
    }

    if (result.mentorId) {
      io.to(result.mentorId).emit("reset");
    }

    if (result.opponentId) {
      io.to(result.opponentId).emit("reset");
    }

    console.log("game ended successfully");
  });
};

export default registerSocketHandlers;
