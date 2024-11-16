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
      INSERT INTO users (name, passkey, email)
      VALUES ('${username}', '${passkey}', '${email}');  -- Avoid duplicate entries
    `;
    await client.query(insertQuery);
    console.log('Entry added successfully!');
  } catch (err) {
    console.error('Error adding entry:', err);
  }
};

// Get elements from the table
const getMentorByEmail = async (id) => {
  try {
    const result = await client.query(`SELECT * FROM mentor WHERE email = '${id}';`);


    if (result.rows.length == 1) {
      // Return the only matching row as a JSON object
      console.log('Users:', result.rows); // `result.rows` will contain the fetched rows
      return result.rows[0]; // This will return the entire row in a JSON format
    } 
    else {
      return { message: 'Mentor not found' }; // Handle case where no mentor is found
    }
  } catch (err) {
    console.error('Error fetching elements:', err);
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