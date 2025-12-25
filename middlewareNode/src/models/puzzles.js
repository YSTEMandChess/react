const mongoose = require("mongoose");
const { Schema, model } = mongoose;

/**
 * Puzzles Schema
 * 
 * Defines the MongoDB structure for chess puzzles from Lichess API.
 * Puzzles are chess positions where the player must find the best move(s).
 * 
 * Data is sourced from Lichess puzzle database and includes:
 * - Position (FEN notation)
 * - Solution moves
 * - Difficulty rating
 * - Themes (tactical patterns)
 * - Popularity metrics
 */
const puzzleSchema = new mongoose.Schema(
  {
    puzzleId: {
      type: String,
      required: true,
    },
    FEN: {
      type: String,
      required: true,
    },
    moves: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
    },
    ratingDeviation: {
      type: Number,
    },
    popularity: {
      type: Number,
    },
    nbPlays: {
      type: Number,
    },
    themes: {
      type: String,
    },
    gameUrl: {
      type: String,
    },
    openingTags: {
      type: String,
    },
  },
  { versionKey: false },
);

module.exports = puzzles = model("puzzles", puzzleSchema);
