require("dotenv").config();

const express = require("express");
const http = require("https");
const socketIo = require("socket.io");
const cors = require("cors");


const app = express();
const server = http.createServer(app);

const debugging = true;

const { Client } = require('pg');

const network = "ystem-network";

const PORT = 4000;

console.log(network);
console.log(PORT);


// Use CORS middleware to allow all origins
app.use(cors({
  origin: "*", // Allow all origins
  methods: ["GET", "POST"], // Allowed methods
  credentials: true // Allow credentials (if needed)
}));


// Connect to the PostgreSQL server
const client = new Client({
  user: 'admin',  // PostgreSQL username
  host: 'account-db-container',     // Database host (e.g., localhost)
  database: 'account-db', // Database name
  password: 'password', // Database password
  port: 5000,             // PostgreSQL port (default: 5000)
});
// Connect to the PostgreSQL database

async function connectToDatabase(client) {

  try{
    await client.connect();
    console.log("success!");
  }
  catch (err) {
    console.error('Error connecting to postgreSQL database:', err);
    
  }

}

connectToDatabase(client);

// Start the server
app.listen(PORT, () => {
  console.log(`Account server API is running on ${network}:${PORT}`);
});

app.post('/test-student-pass', (req, res) => {
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
      passed: true,
      user: user
    });
  }
  else { 
    // Send a response back of failure
    res.json({
      passed: false,
      user: null
    });
  }
});

app.post('/test-mentor-pass', (req, res) => {
  // Retrieve data from the request body
  const { email, pass } = req.data;

  // Check if data exists
  if (!email || !pass) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Process the data (e.g., save to database, etc.)
  console.log('Received data:', { email, pass });

  let user = getMentorByEmail(email);

  if (user.passkey == pass)
  {
    // Send a response back of success
    res.json({
      passed: true,
      user: user
    });
  }
  else { 
    // Send a response back of failure
    res.json({
      passed: false,
      user: user
    });
  }
});

app.post('/add-student', (req, res) => {
  // Retrieve data from the request body
  const { name, email, pass } = req.data;

  // Check if data exists
  if (!name || !email || !pass) {
    return res.status(400).json({ error: 'Name, pass, and email are required' });
  }

  // Process the data (e.g., save to database, etc.)
  console.log('Received data:', { email, pass });

  let user = addStudent(email);

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

app.post('/add-mentor', (req, res) => {
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

// METHODS FOR CONNECTING TO DATABASE

// Create tables
const createStudentTable = async () => {
  
  // If we're debugging, drop the users table so we can add it again
  if (debugging)
  {
    try {
      
      const deleteTableQuery = 'DROP TABLE IF EXISTS student;';
      
      await client.query(deleteTableQuery);

      console.log('Table deleted successfully!');

    } catch (err) {
      console.error('Error deleting table:', err);
    }
  }

  // Create users table
  try {
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS student (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        FOREIGN KEY user_id REFERENCES users (id)
      );
    `;
    await client.query(createTableQuery);
    console.log('Table created successfully!');
  } catch (err) {
    console.error('Error creating table:', err);
  }
};

const createUsersTable = async () => {
  
  // If we're debugging, drop the users table so we can add it again
  if (debugging)
  {
    try {
      
      const deleteTableQuery = 'DROP TABLE IF EXISTS users;';
      
      await client.query(deleteTableQuery);

      console.log('Table deleted successfully!');

    } catch (err) {
      console.error('Error deleting table:', err);
    }
  }

  // Create users table
  try {
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE,
        name VARCHAR(50)
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
        user_id INTEGER,
        FOREIGN KEY user_id REFERENCES users (id)
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
      
      const deleteTableQuery = 'DROP TABLE IF EXISTS meets;';
      
      await client.query(deleteTableQuery);

      console.log('Table created successfully!');

    } catch (err) {
      console.error('Error creating table:', err);
    }
  }

  // Create mentors table
  try {
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS meets (
        id SERIAL PRIMARY KEY,
        mentor_id INTEGER,
        student_id INTEGER,
        hour INTEGER,
        minute INTEGER,
        day INTEGER,
        FOREIGN KEY (student_id) REFERENCES student (id),
        FOREIGN KEY (mentor_id) REFERENCES mentor (id)
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
      
      const deleteTableQuery = 'DROP TABLE IF EXISTS password;';
      
      await client.query(deleteTableQuery);

      console.log('Table created successfully!');

    } catch (err) {
      console.error('Error creating table:', err);
    }
  }

  // Create mentors table
  try {
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS password (
        user_id INTEGER,
        passkey VARCHAR(50),
        FOREIGN KEY (user_id) REFERENCES user (id)
      );
    `;
    await client.query(createTableQuery);
    console.log('Table created successfully!');
  } catch (err) {
    console.error('Error creating table:', err);
  }
};

// Add User
const addStudent = async (username, passkey, email, ) => {
  try {
    const insertQuery = `
      INSERT INTO student (name, passkey, email)
      VALUES ($1, $2, $3);  -- Avoid duplicate entries
    `;
    await client.query(insertQuery, [username, passkey, email]);
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
      VALUES ($1, $2, $3);  -- Avoid duplicate entries
    `;
    await client.query(insertQuery, [username, passkey, email]);
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
    insertQuery = client.query(`SELECT * FROM mentor WHERE email = '$1';`);
    const result = await client.query(insertQuery, [email]);

    if (result.rows.length == 1) {
      // Return the only matching row as a JSON object
      console.log('Mentors:', result.rows); // `result.rows` will contain the fetched rows
      var name = result.rows[0].name;
      var email = result.rows[0].email;
      var id = result.rows[0].id;

      return {id:id, name:name, email:email}; // This will return the entire row in a JSON format
    } 
    else {
      return {id:id, name:name, email:email}; // Handle case where no mentor is found
    }
  } catch (err) {
    console.error('Error fetching elements:', err);
  }
};

const getStudentByEmail = async (email) => {
  try {
    insertQuery = client.query(`SELECT * FROM student WHERE email = '$1';`);
    const result = await client.query(insertQuery, [email]);


    if (result.rows.length == 1) {
      // Return the only matching row as a JSON object
      console.log('User:', result.rows); // `result.rows` will contain the fetched rows
      
      var name = result.rows[0].name;
      var email = result.rows[0].email;
      var id = result.rows[0].id;

      return {id:id, name:name, email:email}; // This will return non-hidden elements from the table
    } 
    else {
      return {id:null, name:null, email:null}; // Handle case where no mentor is found
    }
  } catch (err) {
    console.error('Error fetching elements:', err);
  }
};

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