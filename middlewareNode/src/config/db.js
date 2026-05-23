const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

/**
 * Establishes connection to MongoDB database
 * Exits process if connection fails
 */
/**
 * Creates compound indexes on timeTrackings collection for analytics query performance.
 * Background:true so existing data isn't locked during creation.
 * Safe to call on every startup — MongoDB is idempotent for existing indexes.
 */
async function ensureIndexes() {
  try {
    const tt = mongoose.connection.collection("timeTrackings");
    await tt.createIndex({ username: 1, startTime: -1 }, { background: true });
    await tt.createIndex({ startTime: -1 },               { background: true });
    await tt.createIndex({ eventType: 1, startTime: -1 }, { background: true });

    const users = mongoose.connection.collection("users");
    await users.createIndex({ role: 1 },    { background: true });
    await users.createIndex({ zipcode: 1 }, { background: true });

    console.log("Analytics indexes ensured");
  } catch (err) {
    console.error("Index creation warning:", err.message);
  }
}

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected...");
    await ensureIndexes();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
