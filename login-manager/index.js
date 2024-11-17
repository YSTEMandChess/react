require("dotenv").config();

const express = require("express");
const http = require("https");
const cors = require("cors");
const argon2 = require("argon2");

const app = express();
const server = http.createServer(app);

const debugging = true;

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
const loggedUsers = {};
const loggedTeachers = {};

app.post('/login', (req, res) => {
  // Retrieve data from the request body
  const { email, pass } = req.data;
  
  // Print the data if debugging (we don't want to print this data if we're actually operating)
  if (debugging) { console.log('Received data:', email, pass); } 

  // Check if data exists
  if (!email || !pass) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  var user = {};

  const match = checkStudentPasskey(email, pass);

  if (match.passed)
  {
    user = {email:match.email, id:match.id, name:match.name};
    result = id;
    const logintoken = hashPassword(id);

    loggedUsers[logintoken] = user;

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

app.post('/get-user-info' , (req, res) => {

  const {token} = req.data;
  exists = checkStudentToken(token);

  if (exists) {
    res.json({passed: true, user: loggedUsers[token]});
  }
  else 
  {
    res.json({passed: false});
  }

});

// Execute all operations
const checkStudentPasskey = async () => {
  try {
    const passMatch = await fetch(`${ACCOUNTAPI}:${ACCOUNTPORT}/test-user-pass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pass })
    });
    
    if (passMatch.passed == true) {return true;}
    else {return false;}
    
  } catch (err) {
    console.error('Error during operations:', err);
  }
};

// Execute all operations
const checkStudentToken = async (token) => {
  try {
    if (token in loggedUsers)
    {
      return loggedUsers[token];
    }
    else {return null;}
    
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
    
    const hashedPassword = await argon2.hash(password);

    console.log('Hashed Password:', hashedPassword);

    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

console.log("Login manager compiled successfully");