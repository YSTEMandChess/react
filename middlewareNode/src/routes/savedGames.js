const express = require('express');
const users = require('../models/users');
const savedGame = require('../models/savedGame'); // Using this variable name
const router = express.Router();

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

router.get("/student/:id", getStudentById, getGamesByStudent);

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
            status: "active"
        };
        const newGame = new savedGame(gameSettings); // Fixed variable name
        const game = await newGame.save(); // Added await
        req.game = game.uuid;
        next();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Push new game id to student game array 
const addGameToStudent = async (req, res) => { // Added async
    try {
        const id = req.body.studentId;
        const game = req.game;
        const student = await users.findById(id);
        if (!student) {
            return res.status(404).json({ message: "No student in DB" });
        }

        // Fixed: removed curly braces for implicit return
        const alreadySaved = student.savedGames.some((item) => item === game);
        if (alreadySaved) {
            return res.status(500).json({ message: "Game has been saved under this ID already" });
        }

        student.savedGames.push(game);
        await student.save(); // Added await
        return res.status(200).json({ message: "Game has been successfully paired with student" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Make sure to register the POST route path so it can be called
router.post("/game", addNewGame, addGameToStudent);

module.exports = router;
