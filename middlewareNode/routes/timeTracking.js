const express = require("express");
const passport = require("passport");
const router = express.Router();
const jwt = require("jsonwebtoken");
const timeTracking = require("../models/timeTracking");
const { v4: uuidv4 } = require("uuid");

// @route   POST /timeTracking/start
// @desc    POST a user's event for time tracking
// @access  Public with jwt Authentication
router.post("/start", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { username, eventType } = req.query;
    const eventId = uuidv4(); //Generate a random meetingId

    // Creating an event with requirewd fields
    const newEvent = await timeTracking.create({
      username: username,
      eventType: eventType,
      eventId: eventId,
      startTime: new Date(),
      totalTime: 0,
    });

    return res.status(200).json(newEvent);
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server error");
  }
});

// @route   PUT /timeTracking/update
// @desc    PUT a update for totalTime and endTime to an user's event
// @access  Public with jwt Authentication
router.put("/update", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { username, eventType, eventId, totalTime } = req.query;
    let filters = {
      username: username,
      eventId: eventId,
      eventType: eventType,
    };
    const currEvent = await timeTracking.findOne(filters);

    //Error checking to ensure the event exist
    if (!currEvent) {
      return res.status(400).json("This event does not exist!");
    }
    // Saving to DB

    currEvent.endTime = new Date();
    let time = currEvent.totalTime + parseInt(totalTime);
    currEvent.totalTime = time;
    await currEvent.save();

    return res.status(200).json("Timetracking for event updated");
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server error");
  }
});

// @route   GET /timeTracking/statistics
// @desc    GET all the user's events between two dates and sum the times for each event type
// @access  Public with jwt Authentication
router.get("/statistics", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { username, startDate, endDate } = req.query;

    let filters = {}
    if(startDate && endDate) {
      // if there is start & end date, filter it
      filters = {
        username: username,
        startTime: {
          $gte: new Date(startDate),
          $lt: new Date(endDate),
        },
      };
    } else {
      // if not specified, get across all history events
      filters = {
        username: username
      };
    }

    const eventArray = await timeTracking.find(filters);
    const eventTimes = {
      username: username,
      mentor: 0,
      lesson: 0,
      play: 0,
      puzzle: 0,
      website: 0,
    };

    for (i = 0; i < eventArray.length; i++) {
      // filling array with event total times based on Type
      eventTimes[eventArray[i].eventType] += eventArray[i].totalTime;
    }

    //convert to minutes
    eventTimes.mentor = Math.round(eventTimes.mentor / 60);
    eventTimes.lesson = Math.round(eventTimes.lesson / 60);
    eventTimes.play = Math.round(eventTimes.play / 60);
    eventTimes.puzzle = Math.round(eventTimes.puzzle / 60);
    eventTimes.website = Math.round(eventTimes.website / 60);

    return res.status(200).json(eventTimes);
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server error");
  }
});

// helper function, will be deleted
router.get("/view", async (req, res) => {
  try {
    const { username } = req.query;
    let filters = {
      username: username
    };

    const eventArray = await timeTracking.find(filters);

    return res.status(200).json(eventArray);
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server error");
  }
});

// helper function, will be deleted
router.get("/delete", async (req, res) => {
  try {
    await timeTracking.deleteMany({ username: "xiyuez" });

    return res.status(200).json("yes");
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server error");
  }
});

module.exports = router;
