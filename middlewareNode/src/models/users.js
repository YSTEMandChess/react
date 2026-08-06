const mongoose = require("mongoose");
const { Schema, model } = mongoose;

/**
 * User schema defining the structure of user documents in MongoDB
 * Includes fields for authentication, profile info, lessons, and relationships
 */
const usersSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
    },
    password: {
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
    parentUsername: {
      type: String,
    },
    // if user is a mentor/student, this stores username for their student/mentor
    mentorshipUsername: {
      type: String,
      required: false,
      default: "",
    },
    role: {
      type: String,
      required: true,
    },
    accountCreatedAt: {
      type: String,
      required: false,
    },
    timePlayed: {
      type: Number,
      required: false,
      default: 0,
    },
    lessonsCompleted: {
      type: [
        {
          piece: String,
          lessonNumber: Number,
        },
      ],
      default: () => require("./defaultLessons"),
    },
    // Analytics demographic fields, optional, collected over time via profile updates
    zipcode:    { type: String, default: null, index: true },
    gender:     { type: String, enum: ["M", "F", "Other", null], default: null },
    gradeLevel: { type: String, default: null },
    // Leaderboard filter fields — optional, collected over time via profile updates
    country:    { type: String, default: null, index: true },
    state:      { type: String, default: null, index: true },
    school:     { type: String, default: null, index: true },
    // Profile avatar — Azure blob name (not a full URL) so the storage
    // account/container can change without a data migration. SAS URLs are
    // generated on read, matching the pattern used for meeting recordings.
    avatarKey:  { type: String, default: null },
    // Tracks the user's highest ever Puzzle Streak
    highestStreak: {
      type: Number,
      required: false,
      default: 0,
    },
    // Parent occupation, collected at parent signup
    occupation: { type: String, default: null },
    // Child date of birth, collected at add child
    birthday:   { type: String, default: null },
  },
  { versionKey: false },
);

module.exports = model("users", usersSchema);
