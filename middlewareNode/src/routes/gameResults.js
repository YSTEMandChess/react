/**
 * Game Results Routes  —  /gameResults
 *
 * Records the outcome of a finished student-vs-student chess game, and reports
 * a student's competitive record.
 *
 * Design decisions (agreed with Karthik, see
 * documentation/student-vs-student-design.md §7):
 *   - A result is a RECORD, not a balance mutation. Wins/draws/losses and the
 *     derived chess score are computed on read from these records — the same
 *     computed-on-read approach the leaderboard already uses for time, streak,
 *     activities and badges. No mutable counter to drift or backfill.
 *   - The chess score is a SEPARATE stat, deliberately not folded into the
 *     existing engagement score. Engagement (time/streak/activities/badges) and
 *     competitive skill are different signals; blending them would make one
 *     number mean two things. See utils/studentStats.getChessRecord.
 *   - `gameId` is the idempotency key. A reconnect, a retry, or both clients
 *     reporting the same game is a no-op, not a double count.
 *
 * Endpoints:
 *   POST /gameResults              -> record one finished game (idempotent)
 *   GET  /gameResults/:username    -> that student's W/D/L + chess score
 *
 * Mounted behind requireAuth (any logged-in role). POST additionally requires
 * that the caller was one of the two players — a student cannot report a game
 * they did not play.
 */

const express = require("express");
const router = express.Router();
const GameResults = require("../models/gameResults");
const { getChessRecord } = require("../utils/studentStats");

const VALID_RESULTS = ["win", "draw"];
const VALID_REASONS = ["checkmate", "resign", "disconnect", "draw"];

/** Serializes a stored record into the response shape. */
function serialize(doc) {
  return {
    gameId: doc.gameId,
    players: doc.players,
    result: doc.result,
    winnerUsername: doc.winnerUsername,
    loserUsername: doc.loserUsername,
    reason: doc.reason,
    playedAt: doc.playedAt,
  };
}

/**
 * Validates a POST body and returns { error } or { record } ready to insert.
 * Kept separate from the handler so the rules are testable and readable:
 * a decisive game needs a distinct winner and loser; a draw names neither.
 */
function buildRecord(body) {
  const { gameId, result, reason, winnerUsername, loserUsername, playedAt } = body || {};

  if (!gameId || typeof gameId !== "string") {
    return { error: "gameId is required" };
  }
  if (!VALID_RESULTS.includes(result)) {
    return { error: `result must be one of: ${VALID_RESULTS.join(", ")}` };
  }
  if (!VALID_REASONS.includes(reason)) {
    return { error: `reason must be one of: ${VALID_REASONS.join(", ")}` };
  }

  let players;
  if (result === "win") {
    if (!winnerUsername || !loserUsername) {
      return { error: "a win requires both winnerUsername and loserUsername" };
    }
    if (winnerUsername === loserUsername) {
      return { error: "winnerUsername and loserUsername must differ" };
    }
    if (reason === "draw") {
      return { error: 'reason "draw" is not valid for a win' };
    }
    players = [winnerUsername, loserUsername];
  } else {
    // A draw names no winner, so both players must be supplied explicitly.
    const supplied = Array.isArray(body.players) ? body.players : [];
    if (supplied.length !== 2 || supplied[0] === supplied[1] || supplied.some((p) => !p)) {
      return { error: "a draw requires players: [usernameA, usernameB]" };
    }
    if (reason !== "draw") {
      return { error: 'a draw must use reason "draw"' };
    }
    players = supplied;
  }

  return {
    record: {
      gameId,
      players,
      result,
      reason,
      winnerUsername: result === "win" ? winnerUsername : null,
      loserUsername: result === "win" ? loserUsername : null,
      playedAt: playedAt ? new Date(playedAt) : new Date(),
    },
  };
}

/**
 * POST /gameResults
 * Body (win):  { gameId, result: "win", reason, winnerUsername, loserUsername, playedAt? }
 * Body (draw): { gameId, result: "draw", reason: "draw", players: [a, b], playedAt? }
 *
 * Idempotent on gameId: re-reporting a recorded game returns 200 with
 * duplicate: true and changes nothing.
 */
router.post("/", async (req, res) => {
  try {
    const { error, record } = buildRecord(req.body);
    if (error) return res.status(400).json({ success: false, error });

    // Only a participant may report the game.
    const caller = req.user && req.user.username;
    if (!caller || !record.players.includes(caller)) {
      return res
        .status(403)
        .json({ success: false, error: "Only a player in this game may report its result" });
    }

    const existing = await GameResults.findOne({ gameId: record.gameId });
    if (existing) {
      return res.json({ success: true, duplicate: true, gameResult: serialize(existing) });
    }

    const created = await GameResults.create(record);
    return res.status(201).json({ success: true, duplicate: false, gameResult: serialize(created) });
  } catch (err) {
    // Unique-index race: the other client reported the same game first. That's
    // the idempotency guarantee doing its job, not an error.
    if (err && err.code === 11000) {
      const existing = await GameResults.findOne({ gameId: req.body.gameId });
      if (existing) {
        return res.json({ success: true, duplicate: true, gameResult: serialize(existing) });
      }
    }
    console.error("gameResults POST /:", err.message);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * GET /gameResults/:username
 * That student's competitive record and derived chess score.
 */
router.get("/:username", async (req, res) => {
  try {
    const record = await getChessRecord(req.params.username);
    return res.json({ success: true, data: record });
  } catch (err) {
    console.error("gameResults GET /:username:", err.message);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
