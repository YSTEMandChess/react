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
      default: () => [
        {
          piece: 'Piece Checkmate 1 Basic checkmates',
          lessonNumber: 0
        },
        {
          piece: 'Checkmate Pattern 1 Recognize the patterns',
          lessonNumber: 0
        },
        {
          piece: 'Checkmate Pattern 2 Recognize the patterns',
          lessonNumber: 0
        },
        {
          piece: 'Checkmate Pattern 3 Recognize the patterns',
          lessonNumber: 0
        },
        {
          piece: 'Checkmate Pattern 4 Recognize the patterns',
          lessonNumber: 0
        },
        {
          piece: 'Piece checkmates 2 Challenging checkmates',
          lessonNumber: 0
        },
        {
          piece: 'Knight and Bishop Mate interactive lesson',
          lessonNumber: 0
        },
        { piece: 'The Pin Pin it to win it', lessonNumber: 0 },
        { piece: 'The Skewer Yum - Skewers!', lessonNumber: 0 },
        { piece: 'The Fork Use the fork, Luke', lessonNumber: 0 },
        {
          piece: 'Discovered Attacks Including discovered checks',
          lessonNumber: 0
        },
        { piece: 'Double Check A very powerfull tactic', lessonNumber: 0 },
        {
          piece: 'Overloaded Pieces They have too much work',
          lessonNumber: 0
        },
        { piece: 'Zwischenzug In-between moves', lessonNumber: 0 },
        { piece: 'X-Ray Attacking through an enemy piece', lessonNumber: 0 },
        { piece: 'Zugzwang Being forced to move', lessonNumber: 0 },
        {
          piece: 'Interference Interpose a piece to great effect',
          lessonNumber: 0
        },
        {
          piece: 'Greek Gift Study the greek gift scrifice',
          lessonNumber: 0
        },
        { piece: 'Deflection Distracting a defender', lessonNumber: 0 },
        { piece: 'Attraction Lure a piece to bad square', lessonNumber: 0 },
        {
          piece: 'Underpromotion Promote - but not to a queen!',
          lessonNumber: 0
        },
        {
          piece: 'Desperado A piece is lost, but it can still help',
          lessonNumber: 0
        },
        {
          piece: 'Counter Check Respond to a check with a check',
          lessonNumber: 0
        },
        { piece: 'Undermining Remove the defending piece', lessonNumber: 0 },
        { piece: 'Clearance Get out of the way!', lessonNumber: 0 },
        { piece: 'Key Squares Reach the key square', lessonNumber: 0 },
        { piece: 'Opposition take the opposition', lessonNumber: 0 },
        { piece: '7th-Rank Rook Pawn Versus a Queen', lessonNumber: 0 },
        {
          piece: '7th-Rank Rook Pawn And Passive Rook vs Rook',
          lessonNumber: 0
        },
        { piece: 'Basic Rook Endgames Lucena and Philidor', lessonNumber: 0 }
      ],
    },
  },
  { versionKey: false },
);

module.exports = users = model("users", usersSchema);
