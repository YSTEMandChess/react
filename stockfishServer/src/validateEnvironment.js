const REQUIRED_PRODUCTION_VARS = [
  "CORS_ORIGIN",
];

function validateEnvironment() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const missing = REQUIRED_PRODUCTION_VARS.filter((name) => {
    const value = process.env[name];
    return !value || !value.trim();
  });

  if (missing.length > 0) {
    console.error(
      `[stockfishServer] Missing required production environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }

  console.log("[stockfishServer] Required production environment variables validated");
}

module.exports = validateEnvironment;
