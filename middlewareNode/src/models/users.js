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
  },
  { versionKey: false },
);

module.exports = model("users", usersSchema);
