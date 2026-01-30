const mongoose = require("mongoose");
const {Schema, model} = mongoose;

/**
 * Click Tracking Schema
 * 
 * Tracks user click events for analytics and engagement metrics.
 * Records what users click, where they click, and when.
 * Used for:
 * - Click-through rate analysis
 * - Feature usage tracking
 * - User behavior patterns
 * - A/B testing insights
 */
const clickTrackingSchema = new Schema (
    {
        username: {
            type: String,
            required: true,
            index: true, //faster queries
        },
        page: {
            type: String,
            required: true,
            //examples: "lessons", "home", "profile", etc.
        },
        element: {
            type: String,
            required: true,
            //examples: "start_lesson_button", "nav_menu", etc.
        },
        elementId: {
            type: String,
            required: false,
        },
        action: {
            type: String,
            enum: ["click", "view", "submit", "navigation"],
            default: "click",
            //type of interaction
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
            index: true, //index for date-range queries
        },
        metadata: {
            type: Map,
            of: String,
            default: {},
        },
        sessionId: {
            type: String,
            required: false, 
            //tracking clicks within same session
        }
    },
    {
        versionKey: false,
        collection: "clickTrackings",
        timestamps: true, //adds createdAt and updatedAt automatically
    }
);

clickTrackingSchema.index({username:1, timestamp: -1});

clickTrackingSchema.index({page: 1, timestamp: -1});

module.exports = 
    mongoose.models.clickTracking ||
    model("clickTracking", clickTrackingSchema);