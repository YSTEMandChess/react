const crypto = require("crypto");

// For local development environments without an explicit INDEX_KEY / JWT_SECRET in .env,
// generate a random ephemeral key at boot so server startup and dev login succeed safely
// without committing a forgeable signing secret literal to version control.
const ephemeralSecret = crypto.randomBytes(32).toString("hex");

module.exports = {
  mongoURI: process.env.MONGO_URI || "mongodb://localhost:27017/ystem_dev",
  jwtSecret: process.env.JWT_SECRET || ephemeralSecret,
  indexKey: process.env.INDEX_KEY || ephemeralSecret,

  corsOptions: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },

  email: {
    user: process.env.EMAIL_USER || "dev@example.com",
    pass: process.env.EMAIL_PASS || "devpassword",
  },

  user: process.env.EMAIL_USER || "dev@example.com",
  senderEmail: process.env.SENDER_EMAIL || "dev@example.com",

  clientId: process.env.GOOGLE_CLIENT_ID || "dev-client-id",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dev-client-secret",
  redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:8000/auth/callback",
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN || "dev-refresh-token",

  basepath: process.env.BASEPATH || "http://localhost:3000",

  azureStorageAccount: process.env.AZURE_STORAGE_ACCOUNT || "",
  azureStorageKey: process.env.AZURE_STORAGE_KEY || "",
  azureContainer: process.env.AZURE_STORAGE_CONTAINER || "",
  azureStorageRegion: process.env.AZURE_STORAGE_REGION || "1",

  appID: process.env.AGORA_APP_ID || "",
  uid: process.env.AGORA_UID || "0",
  customerId: process.env.AGORA_CUSTOMER_ID || "",
  customerCertificate: process.env.AGORA_CUSTOMER_CERT || "",

  server: {
    port: parseInt(process.env.PORT, 10) || 8000,
  },
};
