const mongoose = require("mongoose");
const { Schema, model } = mongoose;

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
      default: () => [
        { piece: "rook", lessonNumber: 0 },
        { piece: "bishop", lessonNumber: 0 },
        { piece: "queen", lessonNumber: 0 },
        { piece: "king", lessonNumber: 0 },
        { piece: "pawn", lessonNumber: 0 },
        { piece: "horse", lessonNumber: 0 },
      ],
    },
  },
  { versionKey: false },
);

module.exports = users = model("users", usersSchema);
