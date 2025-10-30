const mongoose = require("mongoose");
const { Schema, model } = mongoose;

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