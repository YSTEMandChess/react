require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);


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

const { Client } = require('pg');

const network = "ystem-network";

server.listen(process.env.PORT, () => {
  console.log(`listening on ${process.env.PORT}`);
});

/// Purpose: Triggered when a client connects to the socket.
/// Input: N/A (Automatically triggered by the connection)
/// Output: Logs "a user connected to socket" in the server console.

// Define a simple route
app.get('/', (req, res) => {

  res.send('Hello, World!');
  
});

app.post('/getuserinfo', (req, res) => {

  res.send('Hello, World!');

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

// Create a table
const creatUsers = async () => {
  try {
    const deleteTableQuery = 'DROP TABLE IF EXISTS Users;';
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS Users (
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

// Add an entry to the table
const addEntry = async () => {
  try {
    const insertQuery = `
      INSERT INTO users (name, email)
      VALUES ('John Doe', 'john.doe@example.com')
      ON CONFLICT (email) DO NOTHING;  -- Avoid duplicate entries
    `;
    await client.query(insertQuery);
    console.log('Entry added successfully!');
  } catch (err) {
    console.error('Error adding entry:', err);
  }
};

// Get elements from the table
const getElements = async () => {
  try {
    const result = await client.query('SELECT id FROM users WHER');
    console.log('Users:', result.rows); // `result.rows` will contain the fetched rows
  } catch (err) {
    console.error('Error fetching elements:', err);
  }
};

// Delete the table
const deleteTable = async () => {
  try {
    const deleteTableQuery = 'DROP TABLE IF EXISTS users;';
    await client.query(deleteTableQuery);
    console.log('Table deleted successfully!');
  } catch (err) {
    console.error('Error deleting table:', err);
  }
};

// Execute all operations
const run = async () => {
  try {
    await createTable(); // Step 1: Create table
    await addEntry();    // Step 2: Add entry
    await getElements(); // Step 3: Retrieve elements
    await deleteTable(); // Step 4: Delete table
  } catch (err) {
    console.error('Error during operations:', err);
  } finally {
    client.end(); // Close the connection
  }
};

// Run the operations
run();