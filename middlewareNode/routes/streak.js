const express = require('express');
const router = express.Router();
const TimeTracking = require('../models/timeTracking'); 

// check if all required events exist for a day
function dayCompleted(events) {
  const required = ['lesson', 'puzzle'];
  return required.every((r) => events.includes(r));
}
 
// GET /streak
router.get('/', async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ error: 'username is required' });
    }

    const userEvents = await TimeTracking.find({ username }).lean();

    console.log(`Fetched ${userEvents.length} events for: ${username}`);

    const daysMap = {};
    userEvents.forEach((e) => {
      if (!e.startTime || !e.eventType) return; // Skip incomplete records

      const date = new Date(e.startTime).toISOString().slice(0, 10);
      console.log("Event:", e.eventType, "| Date:", date);

      if (!daysMap[date]) daysMap[date] = [];
      daysMap[date].push(e.eventType);
    });

    console.log("daysMap:", daysMap);

    const allDates = Object.keys(daysMap).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let running = 0;
    let lastCompletedDate = null;

    allDates.forEach((date) => {
      if (dayCompleted(daysMap[date])) {
        running++;
        longestStreak = Math.max(longestStreak, running);
        lastCompletedDate = date;
      } else {
        running = 0;
      }
    });

    currentStreak = running;

    res.json({ currentStreak, longestStreak, lastCompletedDate });
  } catch (err) {
    console.error('Error in /streak:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /streak/calendar
router.get('/calendar', async (req, res) => {
  try {
    const { username, month } = req.query; 
    if (!username || !month) {
      return res.status(400).json({ error: 'username and month are required' });
    }

    const start = new Date(`${month}-01T00:00:00Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const userEvents = await TimeTracking.find({
      username,
      startTime: { $gte: start, $lt: end },
    }).lean();

    console.log(`Calendar events for ${username} in ${month}: ${userEvents.length}`);

    const daysMap = {};
    userEvents.forEach((e) => {
      if (!e.startTime || !e.eventType) return;

      const date = new Date(e.startTime).toISOString().slice(0, 10);
      if (!daysMap[date]) daysMap[date] = [];
      daysMap[date].push(e.eventType);
    });

    const days = Object.keys(daysMap).map((date) => ({
      date,
      completed: dayCompleted(daysMap[date]),
    }));

    console.log("calendar daysMap:", daysMap);
    res.json({ days });
  } catch (err) {
    console.error('Error in /streak/calendar:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
