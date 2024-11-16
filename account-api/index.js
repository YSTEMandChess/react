require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");


const app = express();
const server = http.createServer(app);

const debugging = true;

const { Client } = require('pg');

const network = "ystem-network";

// Use CORS middleware to allow all origins
app.use(cors({
  origin: "*", // Allow all origins
  methods: ["GET", "POST"], // Allowed methods
  credentials: true // Allow credentials (if needed)
}));

const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allowed methods
    credentials: true // Allow credentials if needed
  }
});

server.listen(process.env.PORT, () => {
  console.log(`listening on ${process.env.PORT}`);
});

app.post('/signin-user', (req, res) => {
  // Retrieve data from the request body
  const { email, pass } = req.data;

  // Check if data exists
  if (!email || !pass) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Process the data (e.g., save to database, etc.)
  console.log('Received data:', { email, pass });

  user = getUserByEmail(email);

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

app.post('/signin-mentor', (req, res) => {
  // Retrieve data from the request body
  const { email, pass } = req.data;

  // Check if data exists
  if (!email || !pass) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Process the data (e.g., save to database, etc.)
  console.log('Received data:', { email, pass });

  user = getMentorByEmail(email);

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

app.post('/signup-user', (req, res) => {
  // Retrieve data from the request body
  const { name, email, pass } = req.data;

  // Check if data exists
  if (!name || !email || !pass) {
    return res.status(400).json({ error: 'Name, pass, and email are required' });
  }

  // Process the data (e.g., save to database, etc.)
  console.log('Received data:', { email, pass });

  user = addUser(email);

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

app.post('/signup-mentor', (req, res) => {
  // Retrieve data from the request body
  const { name, email, pass } = req.data;

  // Check if data exists
  if (!name || !email || !pass) {
    return res.status(400).json({ error: 'Name, pass, and email are required' });
  }

  // Process the data (e.g., save to database, etc.)
  console.log('Received data:', { email, pass });

  var passed = addMentor(email);

  if (passed)
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://${network}:${PORT}`);
});


// METHODS FOR CONNECTING TO DATABASE

// Connect to the PostgreSQL server
const client = new Client({
  user: 'admin',  // PostgreSQL username
  host: 'account-db-container',     // Database host (e.g., localhost)
  database: 'account-db', // Database name
  password: 'password', // Database password
  port: 5432,             // PostgreSQL port (default: 5432)
});

// Connect to the PostgreSQL database
client.connect();

// Create tables
const createUsersTable = async () => {
  
  // If we're debugging, drop the users table so we can add it again
  if (debugging)
  {
    try {
      
      const deleteTableQuery = 'DROP TABLE IF EXISTS user;';
      
      await client.query(deleteTableQuery);

      console.log('Table created successfully!');

    } catch (err) {
      console.error('Error creating table:', err);
    }
  }

  // Create users table
  try {
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS user (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE,
        name VARCHAR(50),
        passkey VARCHAR(20)
      );
    `;
    await client.query(createTableQuery);
    console.log('Table created successfully!');
  } catch (err) {
    console.error('Error creating table:', err);
  }
};

const createMentorTable = async () => {
  
  // If we're debugging, drop the users table so we can add it again
  if (debugging)
  {
    try {
      
      const deleteTableQuery = 'DROP TABLE IF EXISTS mentor;';
      
      await client.query(deleteTableQuery);

      console.log('Table created successfully!');

    } catch (err) {
      console.error('Error creating table:', err);
    }
  }

  // Create users table
  try {
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS mentor (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE,
        name VARCHAR(50),
        passkey VARCHAR(20)
      );
    `;
    await client.query(createTableQuery);
    console.log('Table created successfully!');
  } catch (err) {
    console.error('Error creating table:', err);
  }
};

const createMentorsTable = async () => {
  
  // If we're debugging, drop the users table so we can add it again
  if (debugging)
  {
    try {
      
      const deleteTableQuery = 'DROP TABLE IF EXISTS mentors;';
      
      await client.query(deleteTableQuery);

      console.log('Table created successfully!');

    } catch (err) {
      console.error('Error creating table:', err);
    }
  }

  // Create mentors table
  try {
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS mentors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        mentor_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES user (id),
        FOREIGN KEY (mentor_id) REFERENCES mentor (id)
      );
    `;
    await client.query(createTableQuery);
    console.log('Table created successfully!');
  } catch (err) {
    console.error('Error creating table:', err);
  }
};

// Add User
const addUser = async (username, passkey, email, ) => {
  try {
    const insertQuery = `
      INSERT INTO user (name, passkey, email)
      VALUES ('${username}', '${passkey}', '${email}');  -- Avoid duplicate entries
    `;
    await client.query(insertQuery);
    console.log('Entry added successfully!');
    return true;
  } catch (err) {
    console.error('Error adding entry:', err);
    return false;
  }
};

const addMentor = async (mentor, passkey, email, ) => {
  try {
    const insertQuery = `
      INSERT INTO mentor (name, passkey, email)
      VALUES ('${mentor}', '${passkey}', '${email}');  -- Avoid duplicate entries
    `;
    await client.query(insertQuery);
    console.log('Entry added successfully!');
    return true;
  } catch (err) {
    console.error('Error adding entry:', err);
    return false;
  }
};

// Get elements from the table
const getMentorByEmail = async (email) => {
  try {
    const result = await client.query(`SELECT * FROM mentor WHERE email = '${email}';`);


    if (result.rows.length == 1) {
      // Return the only matching row as a JSON object
      console.log('Mentors:', result.rows); // `result.rows` will contain the fetched rows
      return result.rows[0]; // This will return the entire row in a JSON format
    } 
    else {
      return { message: 'Mentor not found or multiple mentors with same email' }; // Handle case where no mentor is found
    }
  } catch (err) {
    console.error('Error fetching elements:', err);
  }
};

const getUserByEmail = async (email) => {
  try {
    const result = await client.query(`SELECT * FROM user WHERE email = '${email}';`);


    if (result.rows.length == 1) {
      // Return the only matching row as a JSON object
      console.log('User:', result.rows); // `result.rows` will contain the fetched rows
      return result.rows[0]; // This will return the entire row in a JSON format
    } 
    else {
      return { message: 'User not found or multiple mentors with same email' }; // Handle case where no mentor is found
    }
  } catch (err) {
    console.error('Error fetching elements:', err);
  }
};

// Execute all operations
const run = async () => {
  try {
    await createUsersTable(); 
    await createMentorTable();
    await createMentorsTable();
    
  } catch (err) {
    console.error('Error during operations:', err);
  } finally {
    client.end(); // Close the connection
  }
};

// Run the operations
run();