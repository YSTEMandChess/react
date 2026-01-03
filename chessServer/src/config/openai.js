// chessServer/src/config/openai.js
// Responsibility: OpenAI client configuration
// - Loads OPENAI_API_KEY from environment
// - Exports configured OpenAI client
// - Supports mock mode for development

const OpenAI = require("openai");

const mode = (process.env.LLM_MODE || "openai").toLowerCase(); // "openai" | "mock"

function hasOpenAIKey() {
  const key = process.env.OPENAI_API_KEY;
  return !!(key && key.trim());
}

// Lazy initialization - client is created when first needed
let _client = null;

/**
 * Get or create the OpenAI client instance
 * @returns {OpenAI|null} - OpenAI client or null if not configured
 */
function getClient() {
  // If already initialized, return it
  if (_client !== null) {
    return _client;
  }
  
  // Initialize based on mode
  if (mode === "openai" && hasOpenAIKey()) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: Number(process.env.OPENAI_TIMEOUT_MS || 7000),
      maxRetries: Number(process.env.OPENAI_MAX_RETRIES || 0),
    });
    console.log("[OpenAI] Client initialized successfully");
    return _client;
  }
  
  // Mock mode or no key - fall back to mock
  if (mode === "mock" || !hasOpenAIKey()) {
    const reason = mode === "mock" ? "MOCK mode enabled" : "No API key found";
    console.log(`[OpenAI] Running in MOCK mode - ${reason}. LLM calls will return sample responses.`);
    
    _client = {
      chat: {
        completions: {
          create: async (params) => {
            // Determine if this is a move analysis or question based on the last message
            const lastMessage = params.messages[params.messages.length - 1]?.content || "";
            const isMoveAnalysis = lastMessage.includes("moveIndicator") || lastMessage.includes("FEN before");
            
            let sampleResponse;
            if (isMoveAnalysis) {
              // Sample JSON response for move analysis
              sampleResponse = JSON.stringify({
                moveIndicator: "Good",
                Analysis: "This is a solid developing move that maintains good piece coordination. The move helps control the center and prepares for future tactical opportunities. While not the absolute best move, it follows sound chess principles and keeps your position flexible.",
                nextStepHint: "Consider developing your remaining pieces and controlling key central squares."
              });
            } else {
              // Sample response for questions
              sampleResponse = "This is a sample response from the mock AI tutor. In production, this would be a detailed answer to your chess question based on the current position and game context.";
            }
            
            console.log("[OpenAI] MOCK Response:", sampleResponse);
            
            return {
              choices: [{
                message: {
                  content: sampleResponse
                }
              }]
            };
          }
        }
      }
    };
    return _client;
  }
  
  // This should not be reached, but keep for safety
  console.warn("[OpenAI] Unexpected state: API key exists but client not initialized.");
  _client = null;
  return null;
}

/**
 * Check if OpenAI is properly configured
 * @returns {boolean} - True if client can be used
 */
function isConfigured() {
  return getClient() !== null;
}

/**
 * Check if we're actually using mock mode (either explicitly or due to missing key)
 * @returns {boolean} - True if using mock responses
 */
function isMockMode() {
  return mode === "mock" || !hasOpenAIKey();
}

module.exports = {
  getClient,
  isConfigured,
  isMockMode,
  llmMode: mode,
  // For backward compatibility, export a getter that returns the client
  get openai() {
    return getClient();
  }
};