const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const { STATES } = require("../config/conversationStates");

const conversationStateSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    currentState: {
      type: String,
      required: true,
      default: STATES.GREETING,
    },
    conversationHistory: [
      {
        speaker: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    developmentPlanId: {
      type: String,
      required: false,
    },
  },
  { versionKey: false }
);

module.exports.ConversationState = model("ConversationState", conversationStateSchema);