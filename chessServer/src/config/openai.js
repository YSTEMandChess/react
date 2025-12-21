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
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("[OpenAI] Client initialized successfully");
    return _client;
  }
  
  // Mock mode or no key
  if (mode === "mock") {
    console.log("[OpenAI] Running in MOCK mode - LLM calls will return mock responses");
    _client = {
      chat: {
        completions: {
          create: async (params) => {
            // Mock response
            return {
              choices: [{
                message: {
                  content: `[MOCK] Explanation for move: ${JSON.stringify(params.messages[1]?.content?.substring(0, 50))}...`
                }
              }]
            };
          }
        }
      }
    };
    return _client;
  }
  
  // No key and not in mock mode
  console.warn("[OpenAI] No API key found and not in mock mode. LLM calls will fail.");
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

module.exports = {
  getClient,
  isConfigured,
  llmMode: mode,
  // For backward compatibility, export a getter that returns the client
  get openai() {
    return getClient();
  }
};