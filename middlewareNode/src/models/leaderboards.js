const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const LeaderboardSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    score: {
        type: Number,
        required: true,
        default: 0,
    },
    // Useful for resetting leaderboards (e.g., weekly/monthly seasons)
    achievedAt: {
        type: Date,
        default: Date.now,
    }
}, { versionKey: false });

// Create an index on score to make sorting lightning fast
LeaderboardSchema.index({ score: -1 });

module.exports = model("leaderboards", LeaderboardSchema);
