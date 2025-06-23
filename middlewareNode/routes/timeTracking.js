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
    const { username, eventType, eventName } = req.query;
    const eventId = uuidv4(); //Generate a random meetingId

    // Creating an event with requirewd fields
    let newEvent = null;
    if(eventName) {
      newEvent = await timeTracking.create({
        username: username,
        eventType: eventType,
        eventName: eventName,
        eventId: eventId,
        startTime: new Date(),
        totalTime: 0,
      });
    } else {
      newEvent = await timeTracking.create({
        username: username,
        eventType: eventType,
        eventId: eventId,
        startTime: new Date(),
        totalTime: 0,
      });      
    }

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
    const { username, eventType, eventId, totalTime, eventName } = req.query;
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
    if(eventName) currEvent.eventName = eventName; // update the evenName if it is changed
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

// @route   GET /timeTracking/latest
// @desc    GET the user's latest events with pagination
// @access  Public with jwt Authentication
router.get("/latest",passport.authenticate("jwt"),  async (req, res) => {
  try {
    // default: not skip any events, limit to 5 events per time
    const { username, skip=0, limit=5 } = req.query;

    const latestEvents = await timeTracking
      .find(
        {username: username, eventType: { $ne: "website" }}, // find events that exclude "website"
        { startTime: 1, eventName: 1, eventType:1, _id: 0 }
      )
      .sort({ startTime: -1 }) // sort latest first
      .skip(Number(skip)) // skip the first few events
      .limit(Number(limit)); // limit each fetch by number of events

    return res.status(200).json(latestEvents); // {eventName: "Piece Checkmate", eventType: "website", startTime:...}
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server error");
  }
});

// @route   GET /timeTracking/graph-data
// @desc    GET the user's time spent in the last few months to plot graph
// @access  Public with jwt Authentication
router.get("/graph-data",passport.authenticate("jwt"),  async (req, res) => {
  try {
    const { username, months, eventType } = req.query;

    const now = new Date(); // get current date
    const then = new Date(now.getFullYear(), now.getMonth() - months, 1); // get the date from a few months back

    let filters = {
      username: username,
      eventType: eventType, // filter also by type of event
      startTime: {
        $gte: then,
        $lte: now, 
      },
    };
    // get the events dating from a few months back
    const eventArray = await timeTracking.find(filters);

    // calculate time spent on event in each month
    const monthlyTimeMap = {}; // e.g., {"2025-01" : 20, "2025-02" : 30...} in seconds
    for (let i = 0; i < eventArray.length; i++) {
      const event = eventArray[i];
      const date = new Date(event.startTime);
      // get the year-month of the event, e.g., "2025-01"
      // to prevent duplicate month across different years
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // if this month is not recorded
      if (!monthlyTimeMap[yearMonth]) monthlyTimeMap[yearMonth] = 0;
      // accumulate total time spent
      monthlyTimeMap[yearMonth] += event.totalTime;
    }

    // generate full sorted month result
    const fullResult = []; 
    for (let i = months - 1; i >= 0; i--) {
      // generate data for each past month
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      fullResult.push({
        monthText: d.toLocaleString('en-US', { month: 'short' }), // short text form of month: Jan, Feb, etc.
        timeSpent: Math.round((monthlyTimeMap[yearMonth] || 0) / 60) // convert to minutes
      });
    }

    return res.status(200).json(fullResult); // {{monthText: "Jan", timeSpent: 20 (minutes)}}
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Server error");
  }
});

module.exports = router;
