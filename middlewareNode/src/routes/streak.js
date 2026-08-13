/**
 * Streak Routes
 *
 * API endpoints for tracking user activity streaks.
 * Calculates current streak, longest streak, and streak continuity
 * based on daily completion of required activities (lessons and puzzles).
 *
 * A day is considered "completed" when user finishes both:
 * - At least one lesson
 * - At least one puzzle
 *
 * GET /streak's currentStreak/longestStreak/lastCompletedDate are now
 * computed via utils/studentStats.getStreakSummary — previously this route
 * maintained its own independent day-bucketing logic, which could silently
 * disagree with studentStats.getUserStreak (the value that actually feeds
 * the Leaderboard score and Badge eligibility). Both now derive from the
 * same shared day-completion rule, so a student's streak means the same
 * thing everywhere it's shown.
 *
 * Both endpoints are authenticated and self-only, matching the guard added
 * to /activities. Previously either route would return any student's streak
 * to an unauthenticated caller who guessed a username. Guarding them now is
 * free: nothing consumed these endpoints yet, so the first consumer (the
 * StreakModal UI) can be built to send its token from the outset rather than
 * being retrofitted later.
 */

const express = require('express');
const router = express.Router();
const TimeTracking = require('../models/timeTracking');
const requireAuth = require('../middleware/requireAuth');
const { getStreakSummary, isDayCompleted } = require('../utils/studentStats');

/**
 * Self-only guard for the streak routes.
 *
 * These endpoints identify their subject with ?username= rather than a path
 * param, so routes/activities.js's requireSelf — which reads req.params —
 * cannot be reused here. The presence check lives inside the guard so the
 * original 400-before-anything-else behaviour is preserved: a caller who
 * omits username still gets "username is required" rather than a confusing
 * Forbidden.
 */
function requireSelfQuery(req, res, next) {
  if (!req.query.username) {
    return res.status(400).json({ error: 'username is required' });
  }
  if (req.user.username !== req.query.username) {
    return res.status(403).json({ error: "Forbidden: cannot access another user's streak" });
  }
  next();
}

/**
 * GET /streak
 *
 * Calculates and returns streak statistics for a user.
 *
 * Query Parameters:
 * - username: Required - Username to calculate streak for
 *
 * Returns:
 * - currentStreak: Consecutive days up to today
 * - longestStreak: Best streak ever achieved
 * - lastCompletedDate: Most recent day with completed activities
 */
router.get('/', requireAuth, requireSelfQuery, async (req, res) => {
  try {
    const username = req.query.username;

    const { currentStreak, longestStreak, lastCompletedDate } = await getStreakSummary(username);
    res.json({ currentStreak, longestStreak, lastCompletedDate });
  } catch (err) {
    console.error('Error in /streak:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /streak/calendar
router.get('/calendar', requireAuth, requireSelfQuery, async (req, res) => {
  try {
    const { username, month } = req.query;
    if (!month) {
      return res.status(400).json({ error: 'username and month are required' });
    }

    const start = new Date(`${month}-01T00:00:00Z`);
    const end = new Date(start);
    // setMonth/getMonth operate in the server's local timezone even on a
    // UTC-constructed Date — using the UTC variants here keeps the month
    // window correct regardless of server deployment timezone.
    end.setUTCMonth(end.getUTCMonth() + 1);

    const userEvents = await TimeTracking.find({
      username,
      startTime: { $gte: start, $lt: end },
    }).lean();

    const daysMap = {};
    userEvents.forEach((e) => {
      if (!e.startTime || !e.eventType) return;

      const date = new Date(e.startTime).toISOString().slice(0, 10);
      if (!daysMap[date]) daysMap[date] = new Set();
      daysMap[date].add(e.eventType);
    });

    const days = Object.keys(daysMap).map((date) => ({
      date,
      completed: isDayCompleted(daysMap[date]),
    }));

    res.json({ days });
  } catch (err) {
    console.error('Error in /streak/calendar:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
