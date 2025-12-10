// Main server configuration for the Node.js middleware API
const express = require("express");
const session = require("express-session");
const connectDB = require("./config/db");
const passport = require("passport");
require("./config/passport.js");
const app = express();
const cors = require("cors");
const config = require("config");
const streakRoutes = require('./routes/streak');

// Enable scheduler
require("./scheduler/activitiesScheduler.js");

// Enable CORS for cross-origin requests
app.use(cors(config.get("corsOptions")));

// Connect to MongoDB database
connectDB();

// Initialize JSON middleware for parsing request bodies
app.use(express.json({ extended: false }));

// Configure session middleware
app.use(
  session({
    secret: 'your_secret_key_here', // Use a long and random string for better security
    resave: false,
    saveUninitialized: false
  })
);

// Initialize Passport authentication middleware
app.use(passport.initialize());
app.use(passport.session());

// Define API routes
app.get("/", (req, res) => res.send("API Running"));
app.use("/user", require("./routes/users"));
app.use("/category", require("./routes/categorys"));
app.use("/meetings", require("./routes/meetings"));
app.use("/auth", require("./routes/auth"));
app.use("/timeTracking", require("./routes/timeTracking"));
app.use("/puzzles", require("./routes/puzzles"));
app.use("/lessons", require("./routes/lessons"));
app.use("/activities", require("./routes/activities"));
app.use('/streak', streakRoutes);
app.use("/badges", require("./routes/badges"));


// Start server on specified port
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
