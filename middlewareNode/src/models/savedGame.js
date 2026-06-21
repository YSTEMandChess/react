const mongoose = require('mongoose');

const SavedGameSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
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
        enum: ['computer', 'friend', 'mentor_session'],
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
    pgn: {
        type: String,
        default: "" // The complete step-by-step move history list
    },
    playerColor: {
        type: String,
        enum: ['white', 'black'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'aborted'],
        default: 'active'
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

module.exports = mongoose.model('saved_games', SavedGameSchema);
