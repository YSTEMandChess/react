const mongoose = require('mongoose');
const crypto = require("crypto");
const SavedGameSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    uuid: {
        type: String,
        default: () => crypto.randomUUID(),
        unique: true,
        required: true
    },
    opponentId: {
        type: String, // Can be an ObjectId string for friends, or "Stockfish" for the bot
        required: true
    },
    gameName: {
        type: String,
        default: "Untitled Match"
    },
    gameType: {
        type: String,
        enum: ['computer', 'friend', 'mentor'],
        required: true
    },
    computerLevel: {
        type: Number,
        default: null // Only used if gameType is 'computer'
    },
    fen: {
        type: String,
        required: true // The exact board layout snapshot
    },
    movesList: {
        type: [String],
        default: []// The complete step-by-step move history list
    },
    playerColor: {
        type: String,
        enum: ['white', 'black'],
        required: true
    },
    status: {
        type: String,
        enum: ['won', 'lost', 'ongoing', 'draw'],
        default: 'ongoing'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Automatically updates the 'updatedAt' field every time a move is saved
SavedGameSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('saved_game', SavedGameSchema);
