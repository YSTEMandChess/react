/**
 * Undo Permission Schema
 * 
 * Manages undo permissions for chess games during video meetings.
 * Tracks whether the undo move feature is enabled for specific meetings.
 * 
 * Used to control when players can take back moves during mentor-student sessions.
 */

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const undoPermissionSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: false,
    },
    permission: {
      type: Boolean,
      required: false,
    },
  },
  { versionKey: false },
);

module.exports = model("undoPermission", undoPermissionSchema);
