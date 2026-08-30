const crypto = require("crypto");

// Random per-process fallback so jwt.sign() (used for login) doesn't throw
// "secretOrPrivateKey must have a value" in dev/test when INDEX_KEY isn't
// set — without checking a fixed signing key into git history. custom-
// environment-variables.json already maps INDEX_KEY onto this key, so any
// real deployment overrides it; validateEnvironment.js still requires
// INDEX_KEY in production. Tokens signed with this fallback stop verifying
// once the process restarts, since a new random key is generated each time.
const ephemeralIndexKey = crypto.randomBytes(32).toString("hex");
if (!process.env.INDEX_KEY) {
  console.warn(
    "[config] INDEX_KEY not set — using a random key generated for this " +
      "process only. Tokens issued now won't verify after a restart; set " +
      "INDEX_KEY in your environment for a stable dev/test key."
  );
}

module.exports = {
  mongoURI: "",
  jwtSecret: "",
  indexKey: ephemeralIndexKey,

  corsOptions: {
    origin: "http://localhost:3000",
  },

  email: {
    user: "",
    pass: "",
  },

  user: "",
  senderEmail: "",

  clientId: "",
  clientSecret: "",
  redirectUri: "",
  refreshToken: "",

  basepath: "http://localhost:3000",

  azureStorageAccount: "",
  azureStorageKey: "",
  azureContainer: "",
  azureStorageRegion: "",

  appID: "",
  uid: "",
  customerId: "",
  customerCertificate: "",

  server: {
    port: 8000,
  },
};
