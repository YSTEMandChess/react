/**
 * Activities Schema
 * 
 * Defines the MongoDB structure for user daily activities.
 * Each user gets a set of activities that reset daily at midnight.
 * 
 * Features:
 * - Tracks user's daily activity challenges
 * - Each activity has a name, type, and completion status
 * - Maintains history of dates when all activities were completed
 * - Used for streak calculation and badge awards
 */

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const ActivitiesSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    activities: {
        type: [{
            name: {
                type: String,      // Activity identifier (e.g., 'Complete_5_Puzzles')
                required: true
            },
            type: {
                type: String,      // Activity category (e.g., 'puzzle', 'lesson')
                required: true,
            },
            completed: {
                type: Boolean,     // Whether user has completed this activity today
                required: true,
            }
        }],
        required: true,
    },
    completedDates: {
        type: [Date],              // Array of dates when user completed all activities
        required: true
    }
})

module.exports = Activities = model("activities", ActivitiesSchema);