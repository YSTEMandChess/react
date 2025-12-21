// chessServer/src/config/openai.js
// Responsibility: OpenAI client configuration
// - Loads OPENAI_API_KEY from environment
// - Exports configured OpenAI client

//in .env set LLM_MODE=mock
//or
//in docker     environment:
//                  - LLM_MODE=mock

import OpenAI from "openai";

const mode = (process.env.LLM_MODE || "openai").toLowerCase(); // "openai" | "mock"

function hasOpenAIKey()
{
  const key = process.env.OPENAI_API_KEY;
  return !!(key && key.trim());
}

// Export either a real client or null.
// (Do NOT throw at import time, so dev can run without a key.)
export const openai =
  mode === "openai" && hasOpenAIKey()
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

export const llmMode = mode;

