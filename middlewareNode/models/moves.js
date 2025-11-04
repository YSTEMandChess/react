/**
 * Game Moves Schema
 * 
 * Stores chess moves made during video meeting sessions.
 * Records move history associated with specific games and users.
 * 
 * Used for:
 * - Game replay and analysis
 * - Progress tracking
 * - Historical game review
 */

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const movesSchema = new mongoose.Schema(
  {
    gameId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
    },
    moves: {
      type: Array,
      default: [],
    },
    ipAddress: {
      type: String,
    },
  },
  { versionKey: false },
);

module.exports = gameMoves = model("gameMoves", movesSchema, "gameMoves");
