/**
 * Waiting Queue Schema
 * 
 * Manages waiting queues for mentor-student pairing.
 * Separate collections for students and mentors waiting to be matched.
 * 
 * Used by the matchmaking system to pair mentors with students
 * for video conference sessions based on availability.
 */

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const waitingSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    requestedGameAt: {
      type: Date,
      required: true,
    },
  },
  { versionKey: false },
);

var waitingStudents = model(
  "waitingStudents",
  waitingSchema,
  "waitingStudents",
);
var waitingMentors = model("waitingMentors", waitingSchema, "waitingMentors");

module.exports = { waitingStudents, waitingMentors };
