const express = require('express');
const users = require('../models/users');
const savedGame = require('../models/savedGame');
const router = express.Router();

// MAJOR TIP 
// USE MONGODB NATIVE ID TO REFER TO STUDENT 
// USE UUID FROM STUDENT ARRAY TO REFER TO GAMES 

// Get student by ID 
const getStudentById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const student = await users.findById(id);
        if (!student) {
            return res.status(404).json({ message: "No student in DB" });
        }
        req.student = student;
        console.log("Got student", student.firstname + " " + student.lastName)
        next();
    } catch (error) {
        next(error);
    }
};

// Controller to extract and return the games 
const getGamesByStudent = async (req, res) => {
    try {
        const student = req.student;
        if (!student) {
            return res.status(500).json({ message: "Student data missing from request" });
        }
        return res.status(200).json(student.savedGames);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Add new game to database
const addNewGame = async (req, res, next) => {
  try {
    // Game already exists
    if (req.body.uuid) {
      const existingGame = await savedGame.findOne({
        uuid: req.body.uuid,
      });

      if (existingGame) {
        req.game = existingGame.uuid;
        req.existingGame = existingGame;
        return next();
      }
    }
console.log("this is the req body", req.body)
    // Create a new game
    const gameSettings = {
      userId: req.body.userId,
      opponentId: req.body.opponentId,
      gameType: req.body.gameType,
      playerColor: req.body.playerColor,
      gameName: req.body.gameName || "Untitled Match",
      computerLevel:
        req.body.gameType === "computer"
          ? req.body.computerLevel || 1
          : null,
      fen:
        req.body.fen ||
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      movesList: req.body.movesList || [],
      status: req.body.status || "ongoing",
    };

    const game = await savedGame.create(gameSettings);
    

    req.game = game.uuid;
    console.log("This is the game uuid", game.uuid)
    req.createdGame = game;

    return next();
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

// Push new game id to student's saved games
const addGameToStudent = async (req, res) => {
  console.log("starting this", req.body)
  try {
    const userId = req.body.userId;
    const opponentId = req.body.opponentId;
    const gameUuid = req.game;

    const student = await users.findById(userId);

    if (!student) {
      return res.status(404).json({
        message: "No student in DB",
      });
    }

    // Only attach game if this is a brand new one
    if (!req.existingGame) {

      if (!student.savedGames.includes(gameUuid)) {

        student.savedGames.push(gameUuid);

        await student.save();

      }

      if (req.body.gameType === "friend") {

        const opponent = await users.findById(opponentId);

        console.log("my opp", opponent._id)

        if (!opponent) {
          return res.status(404).json({
            message: "Opponent not found",
          });
        }

        if (!opponent.savedGames.includes(gameUuid)) {

          opponent.savedGames.push(gameUuid);

          await opponent.save();


        }
      }
    }

    // Use whichever game object exists
    const game = req.existingGame || req.createdGame;
    console.log({
      message: req.existingGame
        ? "Existing game loaded"
        : "New game created",
      uuid: game.uuid,
      existing: Boolean(req.existingGame),

      // Values the frontend needs
      fen: game.fen,
      movesList: game.movesList,
      status: game.status,

      game,
    })
    return res.status(200).json({
      message: req.existingGame
        ? "Existing game loaded"
        : "New game created",
      uuid: game.uuid,
      existing: Boolean(req.existingGame),

      fen: game.fen,
      movesList: game.movesList,
      status: game.status,

      game,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};
// Overwrite game settings dynamically
const overWrite = async (req, res) => {
    try {
        const newSettings = req.body;
        const id = req.params.id;
        const game = await savedGame.findOne({ uuid: id });

        // Safety check added to protect server from crashing on bad inputs
        if (!game) {
            return res.status(404).json({ message: "Game not found" });
        }

        for (const key in newSettings) {
            if (key in game) {
                game[key] = newSettings[key];
            }
        }
        await game.save();
        return res.status(200).json(game);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Get a single game configuration
const getGame = async (req, res) => {
    try {
        const id = req.params.id;
        const game = await savedGame.findOne({ uuid: id });
        if (!game) {
            return res.status(404).json({ message: "Game not found" });
        }
        return res.status(200).json(game);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


const getMultipleGames = async (req, res) => {
    try {
        // Expects an array in the request body: { uuids: ["uuid-1", "uuid-2"] }
        const uuidArray = req.body.uuids;

        if (!Array.isArray(uuidArray) || uuidArray.length === 0) {
            return res.status(400).json({ message: "Please provide an array of uuids" });
        }

        // Finds all games where the 'uuid' field matches any string in your array
        const games = await savedGame.find({ uuid: { $in: uuidArray } });

        return res.status(200).json(games);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Delete a saved game completely
// Delete a single saved game completely
const deleteGame = async (req, res) => {
  try {
    const gameUuid = req.params.id;

    // Make sure the game exists
    const game = await savedGame.findOne({ uuid: gameUuid });

    if (!game) {
      return res.status(404).json({
        message: "Game not found",
      });
    }

    // Remove the UUID from every user's savedGames array
    await users.updateMany(
      {
        savedGames: gameUuid,
      },
      {
        $pull: {
          savedGames: gameUuid,
        },
      }
    );

    // Delete the game document
    await savedGame.deleteOne({
      uuid: gameUuid,
    });

    return res.status(200).json({
      message: "Game deleted successfully.",
      uuid: gameUuid,
    });
  } catch (error) {
    console.error("Error deleting game:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};


const deleteAllUserGames = async (req, res) => {
  try {
    const user = await users.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const gameUuids = user.savedGames;

    if (gameUuids.length === 0) {
      return res.status(200).json({
        message: "User has no saved games.",
      });
    }

    // Delete the game documents
    await savedGame.deleteMany({
      uuid: { $in: gameUuids },
    });

    // Remove those UUIDs from everyone's savedGames array
    await users.updateMany(
      {
        savedGames: { $in: gameUuids },
      },
      {
        $pull: {
          savedGames: {
            $in: gameUuids,
          },
        },
      }
    );

    return res.status(200).json({
      message: "All saved games deleted.",
      deletedGames: gameUuids.length,
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

// Register the route path
router.post("/batch", getMultipleGames);

// Routes mapping configuration
router.get("/student/:id", getStudentById, getGamesByStudent);
router.post("/addgame", addNewGame, addGameToStudent); //takes student id in the body
router.patch("/game/:id", overWrite); //takes an object with new settings (good for updating the game)
router.get("/game/:id", getGame); //Takes nothing but UUID as param
router.delete("/game/:id", deleteGame);
router.delete("/student/:id/games", deleteAllUserGames);

module.exports = router;
