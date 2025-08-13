const { v4: uuidv4 } = require("uuid");
const meetings = require("../models/meetings");
const { waitingStudents, waitingMentors } = require("../models/waiting");
const movesList = require("../models/moves");
const undoPermission = require("../models/undoPermission");
const users = require("../models/users");

const { startRecording, stopRecording } = require("../utils/recordings");

/**
 * inMeeting(role, username)
 * - returns: array of meeting docs if found (otherwise the exact string)
 */
const inMeeting = async (role, username) => {
  let filters = { CurrentlyOngoing: true };
  if (role === "student") {
    filters.studentUsername = username;
  } else if (role === "mentor") {
    filters.mentorUsername = username;
  } else {
    return "Please be either a student or a mentor.";
  }

  const foundMeeting = await meetings.find(filters);
  if (foundMeeting.length !== 0) {
    await deleteUser(role, username);
    return foundMeeting; // keep array return for compatibility
  }
  return "There are no current meetings with this user.";
};

/**
 * deleteUser(role, username)
 * - parity with routes/meetings.js
 */
const deleteUser = async (role, username) => {
  if (role === "student") {
    const user = await waitingStudents.findOne({ username });
    if (user != null) await user.delete();
  } else if (role === "mentor") {
    const mentor = await waitingMentors.findOne({ username });
    if (mentor != null) await mentor.delete();
  }
  return true;
};

/**
 * endMeetingForUser(userCtx)
 * - Returns:
 *   { ok: true, meetingId, minutesPlayed }  on success
 *   or throws Error("...") with messages compatible with the route usage
 *
 */
const endMeetingForUser = async (userCtx) => {
  const { role, username, firstName, lastName } = userCtx;

  let filters = { CurrentlyOngoing: true };
  if (role === "student") {
    filters.studentUsername = username;
    filters.studentFirstName = firstName;
    filters.studentLastName = lastName;
  } else if (role === "mentor") {
    filters.mentorUsername = username;
    filters.mentorFirstName = firstName;
    filters.mentorLastName = lastName;
  } else {
    throw new Error("You must be a student or mentor to end the meeting!");
  }

  const currMeeting = await meetings.findOne(filters);
  if (!currMeeting) {
    throw new Error("You are currently not in a meeting!");
  }

  // Stop the recording
  let filesList = [];
  try {
    const stopResponse = await stopRecording(
      currMeeting.meetingId,
      currMeeting.resourceId,
      currMeeting.sid,
    );

    // Collect only .mp4 names
    if (
      stopResponse &&
      stopResponse?.fileList &&
      Array.isArray(stopResponse.fileList)
    ) {
      for (const file of stopResponse.fileList) {
        if (file?.fileName?.indexOf(".mp4") !== -1) {
          filesList.push(file.fileName);
        }
      }
    }
  } catch (e) {
    
  }

  // Mark meeting inactive and persist file list + end time
  currMeeting.CurrentlyOngoing = false;
  currMeeting.meetingEndTime = new Date();
  currMeeting.filesList = filesList;
  await currMeeting.save();

  // Compute minutes played (route parity)
  const minutesPlayed = Math.floor(
    (currMeeting.meetingEndTime.getTime() -
      currMeeting.meetingStartTime.getTime()) /
      1000 /
      60,
  );

  // Update student's total minutes (route parity)
  const msg = await updateTimePlayed(
    currMeeting.studentUsername,
    currMeeting.studentFirstName,
    currMeeting.studentLastName,
    minutesPlayed,
  );
  if (msg !== "Saved") {
    // keep compatibility with route error handling
    throw new Error(msg || "Failed to update time played");
  }

  return {
    ok: true,
    meetingId: currMeeting.meetingId,
    minutesPlayed,
  };
};

/**
 * updateTimePlayed(username, firstName, lastName, timePlayed)
 * - returns "Saved" on success, string error on failure
 */
const updateTimePlayed = async (username, firstName, lastName, timePlayed) => {
  const user = await users.findOne({ username, firstName, lastName });
  if (!user) return "Could not find user";

  // Ensure numeric
  const current = typeof user.timePlayed === "number" ? user.timePlayed : 0;
  user.timePlayed = current + Number(timePlayed || 0);
  await user.save();
  return "Saved";
};



const getMoves = async (meetingId) => {
  const doc = await meetings.findOne({ meetingId, CurrentlyOngoing: true });
  return doc;
};

const updateMoves = async (meetingId, oldMovesArr) => {
  const updated = await meetings.findOneAndUpdate(
    { meetingId },
    { moves: oldMovesArr },
    { new: true },
  );
  return updated;
};

const updateUndoPermission = async (meetingId, value) => {
  if (value == "student") {
    const existing = await undoPermission.findOne({ meetingId });
    if (!existing) {
      await undoPermission.create({ meetingId, permission: true });
    } else {
      await undoPermission.findOneAndUpdate(
        { meetingId },
        { permission: true },
      );
    }
  } else {
    await undoPermission.findOneAndUpdate(
      { meetingId },
      { permission: false },
    );
  }
};



const getMovesByGameId = async (gameId) => {
  const doc = await movesList.findOne({ gameId });
  return doc;
};

const updateMoveByGameId = async (gameId, oldMovesArr) => {
  const updated = await movesList.findOneAndUpdate(
    { gameId },
    { moves: oldMovesArr },
    { new: true },
  );
  return updated;
};

const deleteMovesByMeetingId = async (meetingId, deletedData) => {
  const updated = await meetings.findOneAndUpdate(
    { meetingId },
    { moves: deletedData },
    { new: true },
  );
  return updated;
};

const deleteMovesByGameId = async (gameId, deletedData) => {
  const updated = await movesList.findOneAndUpdate(
    { gameId },
    { moves: deletedData },
    { new: true },
  );
  return updated;
};

/**
 * createMeetingPair(studentInfo, mentorInfo)
 * - returns { meetingId, password, resourceId, sid }
 */
const createMeetingPair = async (studentInfo, mentorInfo) => {
  const meetingId = uuidv4();
  const recordingInfo = await startRecording(meetingId);
  if (recordingInfo === "Could not start recording. Server error.") {
    throw new Error(recordingInfo);
  }

  const uniquePassword = uuidv4();
  await meetings.create({
    meetingId,
    password: uniquePassword,
    studentUsername: studentInfo.username,
    studentFirstName: studentInfo.firstName,
    studentLastName: studentInfo.lastName,
    mentorUsername: mentorInfo.username,
    mentorFirstName: mentorInfo.firstName,
    mentorLastName: mentorInfo.lastName,
    CurrentlyOngoing: true,
    resourceId: recordingInfo.resourceId,
    sid: recordingInfo.sid,
    meetingStartTime: new Date(),
  });

  return {
    meetingId,
    password: uniquePassword,
    resourceId: recordingInfo.resourceId,
    sid: recordingInfo.sid,
  };
};

module.exports = {
  // Core functions
  inMeeting,
  deleteUser,
  endMeetingForUser,
  updateTimePlayed,

  // Moves => meetingId
  getMoves,
  updateMoves,
  updateUndoPermission,
  deleteMovesByMeetingId,

  // Store moves => gameId
  getMovesByGameId,
  updateMoveByGameId,
  deleteMovesByGameId,

  createMeetingPair,
};
