/**
 * Badges Routes
 * 
 * API endpoints for badge/achievement system.
 * Handles badge catalog retrieval, user badge status, and awarding badges.
 * 
 * Endpoints:
 * - GET /badges/catalog - Get all available badges
 * - GET /badges/:userId - Get badges earned by a user
 * - POST /badges/:userId/check-and-award - Check eligibility and award badges
 */

const express = require("express");
const { BADGE_CATALOG } = require("../badges/catalog");
const { getEarned, awardIfEligible } = require("../Badges/service");

const router = express.Router();

/**
 * GET /badges/catalog
 * Returns the complete catalog of all available badges
 */
router.get("/catalog", (req, res) => {
  res.json({ badges: BADGE_CATALOG });
});

/**
 * GET /badges/:userId
 * Retrieves all badges earned by a specific user
 */
router.get("/:userId", async (req, res) => {
  const earned = await getEarned(req.params.userId);
  res.json({ earned });
});

/**
 * POST /badges/:userId/check-and-award
 * Checks user's stats against badge criteria and awards eligible badges
 * Body should contain predicates object with user stats
 */
router.post("/:userId/check-and-award", async (req, res) => {
  const predicates = req.body || {};
  const awarded = await awardIfEligible(req.params.userId, predicates);
  res.json({ awarded });
});

module.exports = router;
