const express = require("express");
const passport = require("passport");
const AWS = require("aws-sdk");
const config = require("config");
const requestIp = require("request-ip");
const { v4: uuidv4 } = require("uuid");
const { check, validationResult } = require("express-validator");

const router = express.Router();

const users = require("../models/users");
const meetings = require("../models/meetings");
const { waitingStudents, waitingMentors } = require("../models/waiting");
const movesList = require("../models/moves");

const meetingCtrl = require("../controllers/meeting");

let isBusy = false;

router.get(
  "/singleRecording",
  [check("filename", "The filename is required").not().isEmpty()],
  passport.authenticate("jwt"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const s3 = new AWS.S3({
        apiVersion: "latest",
        region: "us-east-2",
        accessKeyId: config.get("awsAccessKey"),
        secretAccessKey: config.get("awsSecretKey"),
      });
      const params = {
        Bucket: "ystemandchess-meeting-recordings",
        Key: req.query.filename,
        Expires: 604800,
      };
      const url = s3.getSignedUrl("getObject", params);
      return res.status(200).json(url);
    } catch (error) {
      console.error(error.message);
      return res.status(500).json("Server error");
    }
  },
);

router.get("/recordings", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { role, username, firstName, lastName } = req.user;
    let filters = { CurrentlyOngoing: false };
    if (role === "student") {
      filters.studentUsername = username;
      filters.studentFirstName = firstName;
      filters.studentLastName = lastName;
    } else if (role === "mentor") {
      filters.mentorUsername = username;
      filters.mentorFirstName = firstName;
      filters.mentorLastName = lastName;
    } else {
      return res.status(404).json("Must be a student or mentor to get your own recordings");
    }
    const recs = await meetings.find(filters);
    if (!recs) return res.status(400).json("User did not have any recordings available");
    return res.send(recs);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("Server error");
  }
});

router.get("/usersRecordings", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { role, username } = req.user;
    const filters = role === "student"
      ? { studentUsername: username }
      : role === "mentor"
      ? { mentorUsername: username }
      : null;
    if (!filters) {
      return res.status(404).json("Must be a student or mentor to get your own recordings");
    }
    const recs = await meetings.find(filters);
    if (!recs) return res.status(400).json("User did not have any recordings available");
    return res.send(recs.reverse());
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("Server error");
  }
});

router.get(
  "/parents/recordings",
  [check("childUsername", "The child's username is required").not().isEmpty()],
  passport.authenticate("jwt"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { role, username } = req.user;
    const { childUsername } = req.query;
    try {
      if (role !== "parent") {
        return res.status(404).json("You are not the parent of the requested child.");
      }
      const child = await users.findOne({ parentUsername: username, username: childUsername });
      if (!child) {
        return res.status(400).json("You are not the parent to the requested child.");
      }
      const recs = await meetings
        .find({ studentUsername: childUsername, filesList: { $ne: null } })
        .select(["filesList", "meetingStartTime", "-_id"]);
      if (!recs || recs.length === 0) {
        return res.status(400).json("Could not find any recordings for the requested child.");
      }
      return res.send(recs);
    } catch (error) {
      console.error(error.message);
      return res.status(500).json("Server error");
    }
  },
);

router.get("/inMeeting", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { role, username } = req.user;
    const message = await meetingCtrl.inMeeting(role, username);
    return res.status(200).json(message);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("Server error");
  }
});

router.post("/queue", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { role, username, firstName, lastName } = req.user;
    const message = await meetingCtrl.inMeeting(role, username);
    if (message !== "There are no current meetings with this user.") {
      return res.status(400).json(message);
    }
    if (role === "mentor") {
      await waitingMentors.create({
        username,
        firstName,
        lastName,
        requestedGameAt: new Date(),
      });
    } else if (role === "student") {
      await waitingStudents.create({
        username,
        firstName,
        lastName,
        requestedGameAt: new Date(),
      });
    } else {
      return res.status(400).json("You must be a mentor or student to find a game");
    }
    return res.status(200).json("Person Added Successfully.");
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("Server error");
  }
});

router.post("/pairUp", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { role, username, firstName, lastName } = req.user;
    let waitingQueue;
    if (role === "student") {
      waitingQueue = await waitingMentors.findOne({}, {}, { sort: { created_at: 1 } });
    } else if (role === "mentor") {
      waitingQueue = await waitingStudents.findOne({}, {}, { sort: { created_at: 1 } });
    } else {
      return res.status(404).json("Must be a student or mentor to pair up for a game.");
    }
    if (!waitingQueue) {
      return res
        .status(200)
        .json("No one is available for matchmaking. Please wait for the next available person");
    }
    const meInMeeting = await meetingCtrl.inMeeting(role, username);
    const otherInMeeting = await meetingCtrl.inMeeting(
      role === "student" ? "mentor" : "student",
      waitingQueue.username,
    );
    if (
      meInMeeting === "There are no current meetings with this user." &&
      otherInMeeting === "There are no current meetings with this user." &&
      !isBusy
    ) {
      isBusy = true;
      const studentInfo =
        role === "student"
          ? { username, firstName, lastName }
          : {
              username: waitingQueue.username,
              firstName: waitingQueue.firstName,
              lastName: waitingQueue.lastName,
            };
      const mentorInfo =
        role === "mentor"
          ? { username, firstName, lastName }
          : {
              username: waitingQueue.username,
              firstName: waitingQueue.firstName,
              lastName: waitingQueue.lastName,
            };
      await meetingCtrl.createMeetingPair(studentInfo, mentorInfo);
      await meetingCtrl.deleteUser("student", studentInfo.username);
      await meetingCtrl.deleteUser("mentor", mentorInfo.username);
      isBusy = false;
    }
    return res.status(200).json("Ok");
  } catch (error) {
    isBusy = false;
    console.error(error.message);
    return res.status(500).json("Server error");
  }
});

router.put("/endMeeting", passport.authenticate("jwt"), async (req, res) => {
  try {
    await meetingCtrl.endMeetingForUser(req.user);
    return res.sendStatus(200);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json(error.message || "Server error");
  }
});

router.delete("/dequeue", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { role, username } = req.user;
    const deleted = await meetingCtrl.deleteUser(role, username);
    if (!deleted) return res.status(400).json("User was not queued for any meetings");
    return res.status(200).json("Removed user");
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("Server error");
  }
});

router.post("/boardState", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { meetingId, fen, pos, image, role } = req.query;
    if (!pos) return res.status(200).send();
    const meeting = await meetingCtrl.getMoves(meetingId);
    let moveArray = meeting?.moves || [];
    let oldMovesArr = [];
    let idx = moveArray.length;
    if (idx > 0) {
      oldMovesArr = moveArray[idx - 1];
      idx = idx - 1;
    }
    if (oldMovesArr.length === 0 || oldMovesArr[oldMovesArr.length - 1]?.fen !== fen) {
      fen && oldMovesArr.push({ fen, pos, image });
      moveArray[idx] = oldMovesArr;
      const updated = await meetingCtrl.updateMoves(meetingId, moveArray);
      await meetingCtrl.updateUndoPermission(meetingId, role);
      return res.status(200).send(updated);
    } else {
      return res.status(202).send(oldMovesArr);
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("Server error");
  }
});

router.get("/getBoardState", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { meetingId } = req.query;
    const doc = await meetingCtrl.getMoves(meetingId);
    return res.status(200).send(doc);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("Server error");
  }
});

router.post("/newBoardState", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { meetingId } = req.query;
    const meeting = await meetingCtrl.getMoves(meetingId);
    const moveArray = meeting?.moves || [];
    const idx = moveArray.length;
    moveArray[idx] = [];
    const updated = await meetingCtrl.updateMoves(meetingId, moveArray);
    return res.status(200).send(updated);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("Server error");
  }
});

router.post("/storeMoves", async (req, res) => {
  try {
    const { gameId, fen, pos, image, userId } = req.query;
    if (gameId) {
      const doc = await meetingCtrl.getMovesByGameId(gameId);
      let moveArray = doc?.moves || [];
      let oldMovesArr = [];
      let idx = moveArray.length;
      if (idx > 0) {
        oldMovesArr = moveArray[idx - 1];
        idx = idx - 1;
      }
      if (oldMovesArr.length === 0 || oldMovesArr[oldMovesArr.length - 1]?.fen !== fen) {
        fen && oldMovesArr.push({ fen, pos, image });
        moveArray[idx] = oldMovesArr;
        const updated = await meetingCtrl.updateMoveByGameId(gameId, moveArray);
        return res.status(200).send(updated);
      } else {
        return res.status(202).send(oldMovesArr);
      }
    } else {
      const newGameId = uuidv4();
      const ipAddress = requestIp.getClientIp(req);
      const response = await movesList.create({
        gameId: newGameId,
        userId: userId || null,
        moves: [],
        ipAddress,
      });
      return res.status(200).send(response);
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("Server error");
  }
});

router.post("/newGameStoreMoves", async (req, res) => {
  try {
    const { gameId } = req.query;
    const doc = await meetingCtrl.getMovesByGameId(gameId);
    const moveArray = doc?.moves || [];
    moveArray[moveArray.length] = [];
    const updated = await meetingCtrl.updateMoveByGameId(gameId, moveArray);
    return res.status(200).send(updated);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("Server error");
  }
});

router.get("/getStoreMoves", async (req, res) => {
  try {
    const { gameId, meetingId } = req.query;
    if (meetingId) {
      const doc = await meetingCtrl.getMoves(meetingId);
      return res.status(200).send(doc);
    } else {
      const doc = await meetingCtrl.getMovesByGameId(gameId);
      return res.status(200).send(doc);
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("Server error");
  }
});

router.post("/checkUndoPermission", async (req, res) => {
  try {
    const { meetingId } = req.query;
    const checkPermission = await require("../models/undoPermission").findOne({
      meetingId,
    });
    return res.status(200).send(checkPermission);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("server error");
  }
});

router.post("/undoMeetingMoves", async (req, res) => {
  try {
    const { meetingId } = req.query;
    const doc = await meetingCtrl.getMoves(meetingId);
    const movesData = doc?.moves || [];
    const last = movesData[movesData.length - 1] || [];
    last.splice(-2, 2);
    const updated = await meetingCtrl.deleteMovesByMeetingId(meetingId, movesData);
    return res.status(200).send(updated);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("server error");
  }
});

router.post("/undoMoves", async (req, res) => {
  try {
    const { gameId } = req.query;
    const doc = await meetingCtrl.getMovesByGameId(gameId);
    const movesData = doc?.moves || [];
    const last = movesData[movesData.length - 1] || [];
    last.splice(-2, 2);
    const updated = await meetingCtrl.deleteMovesByGameId(gameId, movesData);
    return res.status(200).send(updated);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json("server error");
  }
});

module.exports = router;
