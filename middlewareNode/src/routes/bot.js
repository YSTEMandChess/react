// TODO: Replace stubEngine with real conversationEngine once implemented

const express = require("express");
const passport = require("passport");
const router = express.Router();
const { generateBotResponse } = require("../utils/conversationEngine");

router.post("/respond", passport.authenticate("jwt"), async (req, res) => {
  try {
    const { currentState, userMessage } = req.body;

    if (!currentState || !userMessage) {
      return res.status(400).json({ error: "Missing currentState or userMessage" });
    }

    // Call conversation engine
    const response = generateBotResponse({
      currentState,
      userMessage
    });

    return res.json(response);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;