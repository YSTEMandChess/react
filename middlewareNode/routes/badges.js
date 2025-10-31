const express = require("express");
const { BADGE_CATALOG } = require("../badges/catalog");
const { getEarned, awardIfEligible } = require("../Badges/service");

const router = express.Router();

router.get("/catalog", (req, res) => {
  res.json({ badges: BADGE_CATALOG });
});

router.get("/:userId", async (req, res) => {
  const earned = await getEarned(req.params.userId);
  res.json({ earned });
});

router.post("/:userId/check-and-award", async (req, res) => {
  const predicates = req.body || {};
  const awarded = await awardIfEligible(req.params.userId, predicates);
  res.json({ awarded });
});

module.exports = router;
