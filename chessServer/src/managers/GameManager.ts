import { GameMetaData } from "./EventHandlers";

const { Chess } = require("chess.js");
import { validateFen } from "chess.js";

/**
 * GameManager class handles chess game sessions, state, and logic.
 */
type Player = {
  username: string;
  id: string | null;
  color: "white" | "black";
};

export type GameInstance = {
  student?: Player;
  uuid?: string;
  mentor?: Player;
  game?: any;
  color?: any;
  opponent?: Player;
  role?: string;
  gameMetaData?: GameMetaData;
  newGame?: boolean;
  boardState?: any;
  puzzle?: any;
  pastStates?: any;
};

interface GameManager {
  ongoingGames: GameInstance[];
}

class GameManager {
  constructor() {
    this.ongoingGames = [];
  }

  /**
   *
   * @param {Object} param0 - Contains student, mentor, role, socketId
   * @returns {Object} Game object, assigned color, and new game status
   */
  createOrJoinGame({
    student,
    mentor,
    role,
    socketId,
    stockfishSocketId,
    gameMetaData,
  }: {
    student: string;
    mentor: string;
    role: string;
    socketId: string;
    stockfishSocketId?: string;
    gameMetaData: GameMetaData;
  }): {
    game: GameInstance;
    color: "white" | "black";
    newGame: boolean;
  } {
    const {
      user,
      opponent,
      gameType,
      fen,
      movesList,
      playerColor,
      createdAt,
      uuid,
    } = gameMetaData;

    let game = this.ongoingGames.find(
      (g) => g.uuid == uuid || g.uuid == socketId,
    );

    if (game) {
      if (role === "student" && game.student) {
        if (!game.student.id) {
          game.student.id = socketId;
          return {
            game,
            color: game.student.color,
            newGame: false,
          };
        } else {
          game.opponent.id = socketId;
          return {
            game,
            color: game.student.color,
            newGame: false,
          };
        }
      }
      if (role === "mentor" && game.mentor) {
        game.mentor.id = socketId;

        return {
          game,
          color: game.mentor.color,
          newGame: false,
        };
      }
    }
    const board = new Chess();
    if (fen) {
      const validation = validateFen(fen);
      if (validation.ok) {
        board.load(fen);
      } else {
        console.error("Invalid FEN:", validation.error);
      }
    }

    const studentColor: "white" | "black" =
      role === "student" ? "black" : "white";

    const mentorColor: "white" | "black" =
      role === "student" ? "white" : "black";

    if (!createdAt) {
      const newGame: GameInstance = {
        student: {
          username: student,
          id: role === "student" ? socketId : null,
          color: studentColor,
        },

        mentor: {
          username: mentor,
          id: role === "mentor" ? socketId : null,
          color: mentorColor,
        },

        boardState: board,
        pastStates: [],
        uuid: uuid || socketId,
        gameMetaData,
      };

      this.ongoingGames.push(newGame);

      return {
        game: newGame,
        color: role === "student" ? studentColor : mentorColor,
        newGame: true,
      };
    }

    const loadingGame: GameInstance = {
      student: {
        username: user?.username ?? student,
        id: socketId,
        color: playerColor ?? "white",
      },

      mentor: {
        username: mentor,
        id: role === "mentor" ? socketId : null,
        color: mentorColor,
      },

      opponent: {
        username: opponent?.username ?? "stockfish",
        id: gameType === "computer" ? (stockfishSocketId ?? null) : null,
        color: playerColor === "black" ? "white" : "black",
      },

      boardState: board,
      pastStates: [],
      uuid: uuid || socketId,
      gameMetaData,
    };
    console.log(this.ongoingGames);
    this.ongoingGames.push(loadingGame);

    return {
      game: loadingGame,
      color:
        role === "student"
          ? loadingGame.student.color
          : loadingGame.mentor.color,
      newGame: false,
    };
  }

  /**
   *
   * @param {Object} param0 - Contains student, mentor, role, socketId
   * @returns {Object} Game object, assigned color, and new game status
   */
  createOrJoinPuzzle({ student, mentor, role, socketId, credentials }, io) {
    let game = this.ongoingGames.find(
      (g) => g.student.username === student || g.mentor.username === mentor,
    );
    const socket = io.sockets.sockets.get(socketId); // the socket id that initiated connection

    // must be a student or mentor to connect to server
    if (role != "student" && role != "mentor") {
      throw new Error("Invalid role!");
    }

    // Player already in a puzzle, so serve as a guest
    if (game) {
      console.log("already in a game");
      if (role == "student") {
        game.student.id = socketId; // record guest socket id
        socket.emit("guest"); // notify client that they join as guest
        const socket2 = io.sockets.sockets.get(game.mentor.id);
        socket2.emit("guest");
        socket.emit(
          "boardstate",
          JSON.stringify({
            boardState: game.boardState.fen(), // pass existing game state to guest client
            color: game.student.color,
          }),
        );
        socket.emit("message", JSON.stringify({ message: game.puzzle }));
        console.log("emtting hints!!", game.puzzle);
        return { game, color: game.student.color, newGame: false };
      } else if (role == "mentor") {
        game.mentor.id = socketId; // record guest socket id
        socket.emit("guest"); // notify client that they join as guest
        const socket2 = io.sockets.sockets.get(game.student.id);
        socket2.emit("guest");
        socket.emit(
          "boardstate",
          JSON.stringify({
            boardState: game.boardState.fen(), // pass existing game state to guest client
            color: game.student.color,
          }),
        );
        socket.emit("message", JSON.stringify({ message: game.puzzle }));
        console.log("emtting hints!!", game.puzzle);
        return { game, color: game.mentor.color, newGame: false };
      } else {
        throw new Error("Invalid role!");
      }
    }

    // Game has not been created yet, so player will serve as host
    socket.emit("host");
    console.log("creating new game in game manager");

    // Create a new game instance
    const board = new Chess(); // default to a simple chess game
    const studentColor = "white"; // default to white
    const mentorColor = "white"; // in a puzzle, student and mentor are on the same side

    const newGame = {
      student: {
        username: student,
        id: role === "student" ? socketId : null,
        color: studentColor as "black" | "white",
        credentials: credentials,
      },
      mentor: {
        username: mentor,
        id: role === "mentor" ? socketId : null,
        color: mentorColor as "black" | "white",
      },
      boardState: board,
      pastStates: [],
      puzzle: "No hints available",
    };
    console.log("created puzzle:", newGame.puzzle);

    // record the new game created
    this.ongoingGames.push(newGame);

    return {
      game: newGame,
      color: role === "student" ? studentColor : mentorColor,
      newGame: true,
    };
  }

  /**
   * Handles a player making a move.
   * @param {*} socketId
   * @param {*} moveFrom
   * @param {*} moveTo
   * @returns {Object} Updated board state, move details, and socket IDs
   */
  makeMove(socketId, moveFrom, moveTo, promotion) {
    console.log("calling move");
    const game = this.getGameBySocketId(socketId);

    if (!game) {
      throw new Error("Game not found for this socket!");
    }

    const board = game.boardState;

    const move = {
      from: moveFrom,
      to: moveTo,
      ...(promotion ? { promotion } : {}),
    };

    let moveResult;

    try {
      console.log("calling moooooooveeee", move);
      moveResult = board.move(move);
    } catch (err) {
      throw "ayo";
    }

    const moveStr = promotion
      ? `${move.from} -> ${move.to} (${promotion})`
      : `${move.from} -> ${move.to}`;

    if (game.gameMetaData?.movesList) {
      game.gameMetaData.movesList.push(moveStr);
      game.gameMetaData.fen = board.fen();
    }

    game.pastStates.push(board.fen());

    const flags = moveResult.flags || "";

    const activityEvents = [];

    const captureMap = {
      q: "captureQueen",
      r: "captureRook",
      n: "captureKnight",
      b: "captureBishop",
      p: "capturePawn",
    };

    if (flags.includes("c") || flags.includes("e")) {
      const capLetter = moveResult.captured;

      const name = capLetter
        ? captureMap[capLetter as keyof typeof captureMap]
        : null;

      if (name) {
        activityEvents.push({
          name,
          meta: {
            from: moveResult.from,
            to: moveResult.to,
            san: moveResult.san,
          },
          at: Date.now(),
        });
      }
    }

    if (flags.includes("k") || flags.includes("q")) {
      activityEvents.push({
        name: "performCastle",
        meta: {
          san: moveResult.san,
        },
        at: Date.now(),
      });
    }

    return {
      result: {
        boardState: board.fen(),
        move: moveResult,
        studentId: game.student?.id ?? null,
        mentorId: game.mentor?.id ?? null,
        opponentId: game.opponent?.id ?? null,
        studentUsername: game.student?.username ?? null,
        gameMetaData: game.gameMetaData,
      },
      activityEvents,
    };
  }
  /**
   * Undoes the last move in the game.
   * @param {*} socketId
   * @returns {Object} Updated board state and undo info
   */
  undoMove(socketId) {
    const game = this.getGameBySocketId(socketId);

    if (!game) {
      throw new Error("Cannot undo: no active game found for this socket.");
    }

    const board = game.boardState;

    // Attempt to undo
    const undoneMove = board.undo();

    if (!undoneMove) {
      throw new Error("No move to undo");
    }

    return {
      boardState: board.fen(),
      undoneMove,
      studentId: game.student.id,
      mentorId: game.mentor.id,
    };
  }

  /**
   * Ends a game and removes it from the list.
   * @param {*} studentUsername
   * @param {*} mentorUsername
   */
  endGame(uuid, studentUsername, mentorUsername) {
    const gameIndex = this.ongoingGames.findIndex((game) => {
      // UUID is the real identifier
      if (uuid && game.uuid === uuid) {
        return true;
      }

      // fallback if uuid is missing
      return (
        game.student?.username === studentUsername &&
        game.mentor?.username === mentorUsername
      );
    });

    if (gameIndex === -1) {
      throw new Error("Game not found");
    }

    const [removedGame] = this.ongoingGames.splice(gameIndex, 1);

    return {
      success: true,
      studentId: removedGame.student?.id ?? null,
      mentorId: removedGame.mentor?.id ?? null,
      opponentId: removedGame.opponent?.id ?? null,
    };
  }

  /**
   * Emits current board state to both student and mentor.
   * @param {*} game
   * @param {*} io
   */
  broadcastBoardState(gameInfo, io) {
    const fen = gameInfo.boardState;

    const studentSocket = io.sockets.sockets.get(gameInfo.studentId);
    const mentorSocket = io.sockets.sockets.get(gameInfo.mentorId);
    const opponentSocket = io.sockets.sockets.get(gameInfo.opponentId);

    if (studentSocket) {
      studentSocket.emit("evaluation-complete", {
        gameMetaData: gameInfo.gameMetaData,
      });
    }

    if (mentorSocket) {
      mentorSocket.emit("boardstate", JSON.stringify({ boardState: fen }));
    }

    if (opponentSocket) {
      opponentSocket.emit("boardstate", JSON.stringify({ boardState: fen }));
    }
  }

  /**
   * Emits simple messages to both players.
   * @param {*} socketId
   * @param {*} message
   * @param {*} io
   */
  broadcastSimpleMessage(socketId, message, io) {
    const game = this.getGameBySocketId(socketId);

    if (!game) {
      throw new Error("Game not found");
    }

    const payload = JSON.stringify({ message });

    io.to(game.student.id).emit("message", payload);
    io.to(game.mentor.id).emit("message", payload);
  }

  /**
   * Sets board state from provided FEN string.
   * @param {*} socketId
   * @param {*} fen
   */
  setBoardState(socketId, fen) {
    const game = this.getGameBySocketId(socketId);

    if (!game) {
      console.log("ongoign games", this.ongoingGames);

      throw new Error("Game not found for this socket!");
    }

    game.boardState.load(fen);

    return {
      game,
      boardState: game.boardState.fen(),
      studentId: game.student.id,
      mentorId: game.mentor.id,
    };
  }

  /**
   * Sets board state as in setBoardState, but allows modifying colors (specifically for puzzles)
   * @param {*} socketId
   * @param {*} fen
   * @param {*} color
   */
  setBoardColor(socketId, fen, color, hints, io) {
    const game = this.getGameBySocketId(socketId); // find the corresponding game of the client

    if (!game) {
      console.log("ongoign games", this.ongoingGames);

      // if game does not exist
      throw new Error("Game not found for this socket!");
    }

    // modify board state by fen parameter
    game.boardState.load(fen);
    game.puzzle = hints;
    // modify player color (mentor & player on same side for puzzles)
    game.student.color = color;
    game.mentor.color = color;

    const studentSocket = io.sockets.sockets.get(game.student.id);
    const mentorSocket = io.sockets.sockets.get(game.mentor.id);

    // broadcast state changes to all players, including changes in color
    if (studentSocket) {
      studentSocket.emit(
        "boardstate",
        JSON.stringify({ boardState: fen, color: color }),
      );
    }
    if (mentorSocket) {
      mentorSocket.emit(
        "boardstate",
        JSON.stringify({ boardState: fen, color: color }),
      );
    }

    return {
      game,
      boardState: game.boardState.fen(),
      studentId: game.student.id,
      mentorId: game.mentor.id,
    };
  }

  /**
   * Emits last move highlight to both players.
   * @param {*} socketId
   * @param {*} fromMove
   * @param {*} toMove
   * @param {*} io
   */
  broadcastLastMove(socketId, fromMove, toMove, io) {
    const game = this.getGameBySocketId(socketId);

    if (!game) {
      throw new Error("Game not found");
    }

    const payload = JSON.stringify({ fromMove, toMove });

    io.to(game.student.id).emit("lastmove", payload);
    io.to(game.mentor.id).emit("lastmove", payload);
  }

  /**
   * Relays an event to the opponent player.
   * @param {*} socketId
   * @param {*} eventName
   * @param {*} data
   * @param {*} io
   */
  relayToOpponent(socketId, eventName, data, io) {
    const game = this.getGameBySocketId(socketId);

    if (!game) {
      throw new Error("Game not found");
    }

    const senderId = socketId;
    const receiverId =
      game.student.id === senderId ? game.mentor.id : game.student.id;

    io.to(receiverId).emit(eventName, JSON.stringify(data));
  }

  /**
   * Finds the game using socket ID.
   * @param {*} socketId
   * @returns
   */
  getGameBySocketId(socketId: string) {
    console.log("LOOKING FOR SOCKET:", socketId);

    for (const game of this.ongoingGames) {
      console.log({
        uuid: game.uuid,
        student: game.student?.id,
        mentor: game.mentor?.id,
        opponent: game.opponent?.id,
      });

      if (
        game.uuid === socketId ||
        game.student?.id === socketId ||
        game.mentor?.id === socketId ||
        game.opponent?.id === socketId
      ) {
        console.log("FOUND GAME:", game.uuid);
        return game;
      }
    }

    console.log("NO MATCH FOUND");
    return undefined;
  }
  getGameByUUID(uuid) {
    return this.ongoingGames.find((game) => game.uuid == uuid);
  }
}

module.exports = GameManager;
