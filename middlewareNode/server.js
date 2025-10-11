const express = require("express");
const session = require("express-session"); // Import express-session
const connectDB = require("./config/db");
const passport = require("passport");
require("./config/passport.js");
const app = express();
const cors = require("cors");
const config = require("config");

// Enable Cors
app.use(cors(config.get("corsOptions")));

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// Configure express-session
app.use(
  session({
    secret: 'your_secret_key_here', // Use a long and random string for better security
    resave: false,
    saveUninitialized: false
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Define Routes
app.get("/", (req, res) => res.send("API Running"));
app.use("/user", require("./routes/users"));
app.use("/category", require("./routes/categorys"));
app.use("/meetings", require("./routes/meetings"));
app.use("/auth", require("./routes/auth"));
app.use("/timeTracking", require("./routes/timeTracking"));
app.use("/puzzles", require("./routes/puzzles"));
app.use("/lessons", require("./routes/lessons"));
app.use("/activities/:username", require("./routes/activities"));

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
