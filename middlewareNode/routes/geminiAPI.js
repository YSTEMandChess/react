const express = require("express");
const router = express.Router();
const config = require("config");

router.post("/", async (req, res) => {
  const { GoogleGenAI } = await import("@google/genai");
  const GEMINI_API_KEY = config.get("geminiApiKey");
  const { prompt, chatHistory } = req.body;

  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const systemInstruction = {
      role: "user",
      parts: [
        {
          text: `API (admin) Instructions:  
          You are a helpfull chatbot on a non-profit org called yStem and chess.
    Y STEM and Chess Inc. (YSC) seeks to open the hearts and minds of kids (K-12) to the world of STEM through chess and the Mastery Learning approach to ensure learning and mastery of STEM-related principles. YSC strives to empower underserved and at-risk children through mentoring and STEM skills development to enable them to pursue STEM careers and change their life trajectories. You give advice to users on this site.
    
    user prompt:`,
        },
      ],
    };
    const contents = [systemInstruction, ...chatHistory];

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: contents,
    });
    const modelReply = result.candidates[0].content.parts[0].text;
    return res.json({ response: modelReply });
  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    return res
      .status(500)
      .json({ error: "Failed to get response from Gemini API" });
  }
});

module.exports = router;
