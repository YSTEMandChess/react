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
    socketId,
    stockfishSocketId,
    gameMetaData,
  }: {
    socketId: string;
    stockfishSocketId?: string;
    gameMetaData: GameMetaData;
  }): {
    game: GameInstance;
    newGame: boolean;
  } {
    const gameId = gameMetaData.uuid ?? socketId;

    const existingGame = this.ongoingGames.find((g) => g.uuid === gameId);

    if (existingGame) {
      if (existingGame.gameMetaData.gameType === "friend") {
        existingGame.opponent = {
          ...existingGame.opponent,
          id: socketId,
          username: gameMetaData.opponent?.username ?? null,
          color: gameMetaData.playerColor === "white" ? "black" : "white",
        };
      }
      console.log("saved games", this.ongoingGames);
      return {
        game: existingGame,
        newGame: false,
      };
    }

    const board = new Chess();

    if (gameMetaData.fen) {
      const validation = validateFen(gameMetaData.fen);

      if (!validation.ok) {
        throw new Error(`Invalid FEN: ${validation.error}`);
      }

      board.load(gameMetaData.fen);
    }

    const loadingGame: GameInstance = {
      student: {
        username: gameMetaData.user?.username ?? null,
        id: socketId,
        color: gameMetaData.playerColor ?? "white",
      },

      mentor: {
        username: null,
        id: null,
        color: null,
      },

      opponent: {
        username: gameMetaData.opponent?.username ?? "stockfish",
        id: ["computer", "guest"].includes(gameMetaData.gameType)
          ? (stockfishSocketId ?? null)
          : gameMetaData.opponentId,
        color: gameMetaData.playerColor === "black" ? "white" : "black",
      },

      boardState: board,
      pastStates: [],
      uuid: gameId,
      gameMetaData,
    };

    this.ongoingGames.push(loadingGame);

    return {
      game: loadingGame,
      newGame: true,
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
    const game = this.getGameById(socketId);

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
      moveResult = board.move(move);
    } catch (err) {
      throw err;
    }

    const moveStr = promotion
      ? `${move.from} -> ${move.to} (${promotion})`
      : `${move.from} -> ${move.to}`;

    if (game.gameMetaData?.movesList) {
      game.gameMetaData.movesList.push(moveStr);
      game.gameMetaData.fen = board.fen();
    }
    game.gameMetaData.fen = board.fen();

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
      game,
      activityEvents,
    };
  }
  /**
   * Undoes the last move in the game.
   * @param {*} socketId
   * @returns {Object} Updated board state and undo info
   */
  undoMove(socketId: string) {
    const game = this.getGameById(socketId);

    if (!game) {
      throw new Error("Cannot undo: no active game found for this socket.");
    }

    const gameType = game.gameMetaData?.gameType;

    if (gameType !== "guest" && gameType !== "computer") {
      console.log("This is a friend game, undo is not allowed.");
      return null;
    }

    const board = game.boardState;

    const undoneMove = board.undo();

    if (!undoneMove) {
      throw new Error("No move to undo");
    }

    // Remove last move from metadata if you are tracking it
    if (game.gameMetaData.movesList?.length) {
      game.gameMetaData.movesList.pop();
    }

    // Keep FEN synced
    game.gameMetaData.fen = board.fen();

    return {
      undoneMove,
      game,
    };
  }

  /**
   * Ends a game and removes it from the list.
   * @param {*} studentUsername
   * @param {*} mentorUsername
   */
  endGame(socketId, gameMetaData: GameMetaData) {
    const gameIndex = this.ongoingGames.findIndex((game) => {
      if (gameMetaData && gameMetaData.uuid) {
        return game.uuid === gameMetaData.uuid;
      } else {
        return game.uuid === socketId;
      }
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
  broadcastBoardState(game: GameInstance, io) {
    const fen = game.boardState;

    const studentSocket = io.sockets.sockets.get(game.student.id);
    const mentorSocket = io.sockets.sockets.get(game.mentor.id);
    const opponentSocket = io.sockets.sockets.get(game.opponent.id);

    if (studentSocket) {
      studentSocket.emit("evaluation-complete", {
        gameMetaData: game.gameMetaData,
      });
    }

    if (mentorSocket) {
      mentorSocket.emit("evaluation-complete", {
        gameMetaData: game.gameMetaData,
      });
    }

    if (opponentSocket) {
      opponentSocket.emit("evaluation-complete", {
        gameMetaData: game.gameMetaData,
      });
    }
  }

  /**
   * Emits simple messages to both players.
   * @param {*} socketId
   * @param {*} message
   * @param {*} io
   */
  broadcastSimpleMessage(socketId, message, io) {
    const game = this.getGameById(socketId);

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
    const game = this.getGameById(socketId);

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
    const game = this.getGameById(socketId); // find the corresponding game of the client

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
    const game = this.getGameById(socketId);

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
    const game = this.getGameById(socketId);

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
  getGameById(Id: string) {
    console.log(
      "Trying to get b ID here are the current ongoing games",
      this.ongoingGames,
    );

    for (const game of this.ongoingGames) {
      if (
        game.uuid === Id ||
        game.student?.id === Id ||
        game.mentor?.id === Id ||
        game.opponent?.id === Id
      ) {
        return game;
      }
    }
    return undefined;
  }
}

module.exports = GameManager;
