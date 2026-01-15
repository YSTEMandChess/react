/**
 * Puzzles Routes
 * 
 * API endpoints for retrieving chess puzzles from the database.
 * Puzzles are sourced from Lichess and stored in MongoDB.
 * 
 * Features:
 * - Get all puzzles
 * - Get random selection of puzzles
 * - Filter puzzles by difficulty and themes
 */

const express = require("express");
const router = express.Router();
const puzzles = require("../models/puzzles");

/**
 * GET /puzzles/list
 * 
 * Retrieves all chess puzzles from the database.
 * Returns array of puzzle objects without MongoDB _id field.
 * 
 * @returns {Array} Array of all puzzles
 */
router.get("/list", async (req, res) => {
  try {
    const puzzlesArray = await puzzles.find({}, { _id: 0 });
    res.status(200).json(puzzlesArray);
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server error");
  }
});

/**
 * GET /puzzles/random
 * 
 * Retrieves a random selection of chess puzzles.
 * Useful for providing variety in puzzle practice sessions.
 * 
 * Query Parameters:
 * - limit: Number of random puzzles to return (default: 20)
 * 
 * @returns {Array} Array of randomly selected puzzles
 */
router.get("/random", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const puzzlesArray = await puzzles.aggregate([{ $sample: { size: limit } }]);
    res.status(200).json(puzzlesArray);
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server error");
  }
});

module.exports = router;