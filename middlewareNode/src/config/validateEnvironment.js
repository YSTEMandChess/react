const REQUIRED_PRODUCTION_VARS = [
  "MONGO_URI",
  "INDEX_KEY",
  "CORS_ORIGIN",
  "SESSION_SECRET",
];

function validateEnvironment() {
  const isProd = process.env.NODE_ENV === "production";
  const isTest = process.env.NODE_ENV === "test";

  if (isProd) {
    const missing = REQUIRED_PRODUCTION_VARS.filter((name) => {
      const value = process.env[name];
      return !value || !value.trim();
    });

    if (missing.length > 0) {
      console.error(
        `[boot] Missing required production environment variables: ${missing.join(", ")}`
      );
      process.exit(1);
    }
    console.log("[boot] Required production environment variables validated");
  }

  // Diagnostics and warnings across non-test environments
  if (!isTest) {
    const indexKey = (process.env.INDEX_KEY || "").trim();
    if (!indexKey && !isProd) {
      console.warn(
        "[boot] WARNING: INDEX_KEY is empty in environment. An ephemeral secret was generated for this session; JWT tokens will not persist across server restarts."
      );
    }

    const aiKey = (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "").trim();
    if (!aiKey) {
      console.warn(
        "[boot] NOTE: Neither GEMINI_API_KEY nor OPENAI_API_KEY is set. AI Tutor and Stockfish feedback routes will run in offline rule-based fallback mode."
      );
    }
  }
}

module.exports = validateEnvironment;
