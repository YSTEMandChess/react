const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

/**
 * Establishes connection to MongoDB database
 * Exits process if connection fails
 */
const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useCreateIndex: true,
    });
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error(err.message);
    process.exit(1); // Exit process if connection fails
  }
};

module.exports = connectDB;
