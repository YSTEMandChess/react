const mongoose = require("mongoose");
const { Schema, model } = mongoose;

/**
 * Time Tracking Schema
 * 
 * Tracks user activity duration for analytics and engagement metrics.
 * Records how long users spend on different activities:
 * - mentor: Time spent in mentor sessions
 * - lesson: Time in chess lessons
 * - play: Time playing chess
 * - puzzle: Time solving puzzles
 * - website: General browsing time
 */
const timeTrackingSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      enum: ["mentor", "lesson", "play", "puzzle", "website"],
      required: true,
    },
    eventName: {
      type: String,
      default: "Untitled event",
      required: false,
    },
    eventId: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    totalTime: {
      type: Number, // Seconds
    },
  },
  { versionKey: false ,
    collection: "timeTrackings"
  }
);

module.exports =
  mongoose.models.timeTracking ||
  model("timeTracking", timeTrackingSchema);