const mongoose = require("mongoose");
const config = require("config");
const crypto = require("crypto");
let db = config.get("mongoURI");

/**
 * Seed initial test users into the database
 */
const seedTestUsers = async () => {
  try {
    const usersCollection = mongoose.connection.db.collection("users");
    
    // Check if test users already exist
    const count = await usersCollection.countDocuments({ username: { $in: ["mentor", "student"] } });
    if (count === 0) {
      console.log("Seeding test users into the database...");
      const mentorPassword = crypto.createHash("sha384").update("123123123").digest("hex");
      const mentor = {
        username: "mentor",
        password: mentorPassword,
        firstName: "Test",
        lastName: "Mentor",
        email: "mentor@test.com",
        role: "mentor",
        accountCreatedAt: new Date().toLocaleString(),
        timePlayed: 0
      };

      const studentPassword = crypto.createHash("sha384").update("123123123").digest("hex");
      const student = {
        username: "student",
        password: studentPassword,
        firstName: "Test",
        lastName: "Student",
        email: "student@test.com",
        role: "student",
        accountCreatedAt: new Date().toLocaleString(),
        timePlayed: 0
      };

      await usersCollection.insertOne(mentor);
      await usersCollection.insertOne(student);
      console.log("✅ Test users seeded successfully!");
    }
  } catch (err) {
    console.error("Failed to seed test users:", err.message);
  }
};

/**
 * Establishes connection to MongoDB database
 * Exits process if connection fails
 */
const connectDB = async () => {
  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of hanging
    });
    console.log("MongoDB Connected...");
    await seedTestUsers();
  } catch (err) {
    console.warn(`Connection to configured MongoDB failed: ${err.message}`);
    console.warn("Starting local in-memory MongoDB server as fallback...");
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create({
        binary: {
          version: "4.4.26"
        }
      });
      const localURI = mongoServer.getUri();
      console.log(`Connecting to in-memory MongoDB...`);
      await mongoose.connect(localURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("MongoDB Connected (In-Memory)...");
      await seedTestUsers();
    } catch (fallbackErr) {
      console.error("In-memory MongoDB startup failed:", fallbackErr.message);
      process.exit(1); // Exit process if connection fails
    }
  }
};

module.exports = connectDB;
