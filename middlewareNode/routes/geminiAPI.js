const express = require("express");
const router = express.Router();
const config = require("config");

router.post("/", async (req, res) => {
  const { GoogleGenAI } = await import("@google/genai");
  const GEMINI_API_KEY = config.get("geminiApiKey");
  const { prompt } = req.query;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  if (prompt.length > 200) {
    return res.status(400).json({ error: "Prompt is too long" });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: `
      API (admin) Instructions:
      You are a helpfull chatbot on a non-profit org called yStem and chess.
      Y STEM and Chess Inc. (YSC) seeks to open the hearts and minds of kids (K-12) to the world of STEM through chess and the Mastery Learning approach to ensure learning and mastery of STEM-related principles. YSC strives to empower underserved and at-risk children through mentoring and STEM skills development to enable them to pursue STEM careers and change their life trajectories. You give advice to users on this site.
      
      user prompt:
      ${prompt}`,
    });

    console.log(response.text);
    return res.json({ response: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    return res
      .status(500)
      .json({ error: "Failed to get response from Gemini API" });
  }
});

module.exports = router;
