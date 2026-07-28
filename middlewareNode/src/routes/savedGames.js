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
        const gameSettings = {
            userId: req.body.studentId,
            opponentId: req.body.opponentId,
            gameType: req.body.gameType,
            playerColor: req.body.playerColor,
            gameName: req.body.gameName || "Untitled Match",
            computerLevel: req.body.gameType === 'computer' ? (req.body.computerLevel || 1) : null,
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            movesList: [],
            status: "ongoing"
        };
        const newGame = new savedGame(gameSettings);
        const game = await newGame.save();
        req.game = game.uuid;
        next();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


// Push new game id to student game array 
//Task : make this function also callable on its own to add a game to another student for friend x friend gameplay 
const addGameToStudent = async (req, res) => {
    try {
        const id = req.body.studentId;
        const id2= req.body.opponentId
        const game = req.game;
        const student = await users.findById(id);
        if (!student) {
            return res.status(404).json({ message: "No student in DB" });
        }
        const alreadySaved = student.savedGames.some((item) => item === game);
        if (alreadySaved) {
            return res.status(500).json({ message: "Game has been saved under this ID already" });
        }
        
        student.savedGames.push(game);
        await student.save();

        if (id2){
        const opponent = await users.findById(id);
        if (!opponent) {
            return res.status(404).json({ message: "No student in DB" });
        }
        const alreadySaved = opponent.savedGames.some((item) => item === game);
        if (alreadySaved) {
            return res.status(500).json({ message: "Game has been saved under this ID already" });
        }
        
        opponent.savedGames.push(game)
        await opponent.save()
        }
        return res.status(200).json({ message: "Game has been successfully paired with student", uuid: game });
    } catch (error) {
        return res.status(500).json({ error: error.message });
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

// Register the route path
router.post("/batch", getMultipleGames);


// Routes mapping configuration
router.get("/student/:id", getStudentById, getGamesByStudent);
router.post("/addgame", addNewGame, addGameToStudent); //takes student id in the body
router.patch("/game/:id", overWrite); //takes an object with new settings (good for updating the game)
router.get("/game/:id", getGame); //Takes nothing but UUID as param

module.exports = router;
