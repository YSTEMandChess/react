require("dotenv").config();

const express = require("express");
const http = require("https");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const debugging = true;

const bcrypt = require('bcrypt');

const network = "ystem-network";

const PORT = 3000;

const ACCOUNTAPI = "account-api-container";
const ACCOUNTPORT = 4000;


console.log(network);
console.log(PORT);

// Use CORS middleware to allow all origins
app.use(cors({
  origin: "*", // Allow all origins
  methods: ["GET", "POST"], // Allowed methods
  credentials: true // Allow credentials (if needed)
}));

// Start the server
app.listen(PORT, () => {
  console.log(`Account server API is running on ${network}:${PORT}`);
});

const loggedMentors = {};
const loggedStudents = {};
const loggedTeachers = {};

app.post('/login-student', (req, res) => {
  // Retrieve data from the request body
  const { email, pass } = req.data;
  
  // Print the data if debugging (we don't want to print this data if we're actually operating)
  if (debugging) { console.log('Received data:', email, pass); } 

  // Check if data exists
  if (!email || !pass) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  var student = {};

  const match = checkStudentPasskey(email, pass);

  if (match)
  {
    student = {email:email, id:id};
    result = id;
    const logintoken = bcrypt.hash(result, 1);

    loggedStudents[logintoken] = student;

    // Send a response back of success
    res.json({
      passed: true, 
      token: logintoken
    });
  }
  else
  {
    // Send a response back of success
    res.json({
      passed: false, 
      token: null
    });
  }

    
  
});

app.post('/logout-student', (req, res) => {
  const { token } = req.data;

  if (checkStudentToken(token)) {
    try {
      delete loggedStudents[token];
      res.json({passed: true});
    }
    catch (err) {
      console.error('Error during operations:', err);
      res.json({ passed: false});
    }
  }
  else { res.json({passed: true}); }

});

app.post('/get-student-info' , (req, res) => {

  const {token} = req.data;
  exists = checkStudentToken(token);

  if (exists) {
    res.json({pass: true, user: loggedStudents[token]});
  }
  else 
  {
    res.json({pass: false});
  }

});

// TODO : LOGOUT FOR TEACHER AND MENTOR      A
// TODO : LOGIN FOR TEACHER AND MENTOR       |
// TODO : GET INFO FOR TEACHER AND MENTOR    |

// Execute all operations
const checkStudentPasskey = async () => {
  try {
    const passMatch = await fetch(`${ACCOUNTAPI}:${ACCOUNTPORT}/test-student-pass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pass })
    });
    
  } catch (err) {
    console.error('Error during operations:', err);
  }
};

// Execute all operations
const checkStudentToken = async (token) => {
  try {
    if (token in loggedStudents)
    {
      return loggedStudents[token];
    }
    
  } catch (err) {
    console.error('Error during operations:', err);
  }
};

// Function to hash a password
async function hashPassword(password) {
  try {

    const saltRounds = 10;
    // Generating hash
    if (debugging) { saltRounds = 1;}
    
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('Hashed Password:', hashedPassword);

    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

console.log("Login manager compiled successfully");