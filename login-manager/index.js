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

app.post('/login-student', (req, res) => {
  // Retrieve data from the request body
  const { email, pass } = req.data;

  // Check if data exists
  if (!email || !pass) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  var student = {}

  const match = checkPasskey(email, pass);
  const logintoken = null;

  if (match)
  {
    student = {}
    result = email + pass
    const logintoken = bcrypt.hash(email, 1);
    loggedStudents[logintoken];
  }

  // Print the data if debugging (we don't want to print this data if we're actually operating)
  if (debugging) { console.log('Received data:', { email, pass }); } 

  // Send a response back of success
  res.json({
    passed: true, 
    token: logintoken
  });
  
});

app.post('/logout-student', (req, res) => {
  const { token } = req.data;

  try {
    delete loggedStudents[token];
    res.json({passed: true});
  }
  catch (err) {
    console.error('Error during operations:', err);
    res.json({ passed: false});
  }

});



app.post('/logout', (req, res) => {
  // Retrieve data from the request body
  const { email, pass } = req.data;

  // Check if data exists
  if (!email || !pass) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Process the data (e.g., save to database, etc.)
  console.log('Received data:', { email, pass });

  let user = getStudentByEmail(email);

  if (user.passkey == pass)
  {
    // Send a response back of success
    res.json({
      passed: true
    });
  }
  else { 
    // Send a response back of failure
    res.json({
      passed: false
    });
  }
});

// Execute all operations
const checkPasskey = async () => {
  try {
    const passMatch = await fetch(`${ACCOUNTAPI}/add-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, pass })
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

// Execute all operations
const addUser = async (oldpass) => {
  try {
    newpass = hashPassword(oldpass);
    
    const response = await fetch(`${ACCOUNTAPI}/add-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, pass })
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.passed;

  } catch (err) {
    console.error('Error during operations:', err);
  }
};


// Function to hash a password
async function hashPassword(password) {
  try {
    // Generating hash
    if (debugging) {const saltRounds = 2;}
    else { const saltRounds = 10; }
    
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('Hashed Password:', hashedPassword);

    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

// Execute all operations
const run = async () => {
  try {
    await createStudentTable(); 
    await createMentorTable();
    await createMentorsTable();
    
  } catch (err) {
    console.error('Error during operations:', err);
  }
};

// Run the operations
run();