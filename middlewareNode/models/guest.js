const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema({
    ip: {
        type: String,
        required: true,
    },
    lessonsCompleted: {
        type: [
        {
            piece: String,
            lessonNumber: Number,
        },
        ],
        default: () => require('./defaultLessons'),
    },
        updatedAt: {
        type: Date,
        default: Date.now,
    },
        expiresAt: {
        type: Date,
        required: true,
    },
});

// TTL index to automatically delete documents 24 hours after `expiresAt`
guestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Guest", guestSchema);
