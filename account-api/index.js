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

app.use(express.json()); // This parses JSON request bodies into req.body

// Start the server
app.listen(PORT, () => {
  console.log(`Account server API is running on ${network}:${PORT}`);
});

app.post('/test-user-pass', (req, res) => {
  // Retrieve data from the request body
  const { email, pass } = req.data;

  // Check if data exists
  if (!email || !pass) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  var user = getUserByEmail(email);
  var id = user.id;
  var realpass = getPasskey(id);

  // Process the data (e.g., save to database, etc.)
  console.log('Received data:', { email, pass });

  if (realpass == pass)
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



app.post('/add-student', (req, res) => {
  // Retrieve data from the request body
  const { name, email, pass: passkey } = req.data;

  // Check if data exists
  if (!name || !email || !passkey) {
    return res.status(400).json({ error: 'Name, pass, and email are required' });
  }

  // Process the data (e.g., save to database, etc.)
  console.log('Received data:', { email, pass: passkey });

  addUser(name, email);
  addPasskey(passkey);
  var passed = addStudent(getUserByEmail(email).id);
  
  if (passed )
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

  addUser(name, email);
  addPasskey(pass);
  var user = getUserByEmail(getUserByEmail(email));
  
  var id = user.id;
  var passed = addMentor(id);


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

app.post('/add-meeting', (req, res) => {
  // Retrieve data from the request body
  const { hour, minute, day, student_email, mentor_email } = req.data;

  // Check if data exists
  if (!hour || !minute || !day || !student_id || !mentor_id) {
    return res.status(400).json({ error: 'Name, pass, and email are required' });
  }

  // Process the data (e.g., save to database, etc.)

  var student_id = getUserByEmail(getUserByEmail(student_email).id);
  var mentor_id = getUserByEmail(getUserByEmail(mentor_email).id);

  var passed = addMeet(student_id, mentor_id, hour, minute, day);


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

app.post('/add-teaches', (req, res) => {
// Retrieve data from the request body
  const { student_email, teacher_email } = req.data;

  // Check if data exists
  if ( !student_id || !teacher_id) {
    return res.status(400).json({ error: 'Name, pass, and email are required' });
  }

  // Process the data (e.g., save to database, etc.)

  var student_id = getUserByEmail(getUserByEmail(student_email).id);
  var teacher_id = getUserByEmail(getUserByEmail(teacher_email).id);

  var passed = addTeaches(student_id, mentor_id);

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
// TODO : 

app.post('/add-teacher', (req, res) => {
  // Retrieve data from the request body
  const { name, email, pass } = req.data;

  // Check if data exists
  if (!name || !email || !pass) {
    return res.status(400).json({ error: 'Name, pass, and email are required' });
  }

  // Process the data (e.g., save to database, etc.)
  console.log('Received data:', { email, pass });

  var passed = addTeacher(email);

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

app.post('/modify-user', (req, res) => {
  //Retrieve data from the request body
  const { newName, email, newPass } = req.data;

  //Check if data exists
  if(!newName || !email || !newPass) {
    return res.status(400).json({ error: 'Name, pass, and email are required' });
  }

  console.log('Received data:', { email, newPass });

  var passed = modifyUser(email)

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
        id INTEGER PRIMARY KEY,
        FOREIGN KEY (id) REFERENCES users (id)
      );
    `;
    await client.query(createTableQuery);
    console.log('Table created successfully!');
    return true;
  } catch (err) {
    console.error('Error creating table:', err);
    return false;
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
    return true;
  } catch (err) {
    console.error('Error creating table:', err);
    return false;
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
        id INTEGER PRIMARY KEY,
        FOREIGN KEY (id) REFERENCES users (id)
      );
    `;
    await client.query(createTableQuery);
    console.log('Table created successfully!');
    return true;
  } catch (err) {
    console.error('Error creating table:', err);
    return false;
  }
};

const createMeetsTable = async () => {
  
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
    return true;
  } catch (err) {
    console.error('Error creating table:', err);
    return false;
  }
};

const createTeacherTable = async () => {
  // If we're debugging, drop the teacher table so we can add it again
  if (debugging)
    {
      try {
        
        const deleteTableQuery = 'DROP TABLE IF EXISTS teacher;';
        
        await client.query(deleteTableQuery);
  
        console.log('Table deleted successfully!');
  
      } catch (err) {
        console.error('Error deleting table:', err);
      }
    }
  
    // Create teacher table
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS teacher (
          id SERIAL PRIMARY KEY,
          email VARCHAR(100) UNIQUE,
          name VARCHAR(50),
          passkey VARCHAR(20)
        );
      `;
      await client.query(createTableQuery);
      console.log('Table created successfully!');
      return true;
    } catch (err) {
      console.error('Error creating table:', err);
      return false;
    }
  }

const createPasskeyTable = async () => {
  
    // If we're debugging, drop the users table so we can add it again

  // Create mentors table
  try {

    const deleteTableQuery = 'DROP TABLE IF EXISTS passkey;';
      
    await client.query(deleteTableQuery);
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS passkey (
        id INTEGER PRIMARY KEY,
        passkey VARCHAR(50),
        FOREIGN KEY (id) REFERENCES users (id)
      );
    `;
    await client.query(createTableQuery);
    console.log('Table created successfully!');
    return true;
  } catch (err) {
    console.error('Error creating table:', err);
    return false;
  }
};

const createTeachesTable = async () => {
  // If we're debugging, drop the users table so we can add it again
  if (debugging)
    {
      try {
        
        const deleteTableQuery = 'DROP TABLE IF EXISTS teaches;';
        
        await client.query(deleteTableQuery);
  
        console.log('Table deleted successfully!');
  
      } catch (err) {
        console.error('Error creating table:', err);
      }
    }
  
    // Create teaches table
    try {
      
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS teaches (
          id SERIAL PRIMARY KEY,
          teacher_id INTEGER,
          student_id INTEGER,
          FOREIGN KEY (student_id) REFERENCES teacher (id),
          FOREIGN KEY (teacher_id) REFERENCES student (id)
        );
      `;
      await client.query(createTableQuery);
      console.log('Table created successfully!');
      return true;
    } catch (err) {
      console.error('Error creating table:', err);
      return false;
    }
}
// Add User

const addUser = async (username, email) => {
  try {
    const insertQuery = `
      INSERT INTO users (email, name)
      VALUES ($1, $2);  -- Avoid duplicate entries
    `;
    await client.query(insertQuery, [email, username]);
    console.log('Entry added successfully!');
    return true;
  } catch (err) {
    console.error('Error adding entry:', err);
    return false;
  }
};

const addPasskey = async (user_id, passkey) => {
  try {
    const insertQuery = `
      INSERT INTO passkey (id, passkey)
      VALUES ($1, $2);  -- Avoid duplicate entries
    `;
    await client.query(insertQuery, [user_id, passkey]);
    console.log('Entry added successfully!');
    return true;
  } catch (err) {
    console.error('Error adding entry:', err);
    return false;
  }
};

const addMeet = async (student_id, mentor_id, hour, minute, day) => {
  try {
    const insertQuery = `
      INSERT INTO meets (student_id, mentor_id, hour, minute, day)
      VALUES ($1, $2, $3, $4, $5);  -- Avoid duplicate entries
    `;
    await client.query(insertQuery, [student_id, mentor_id, hour, minute, day]);
    console.log('Entry added successfully!');
    return true;
  } catch (err) {
    console.error('Error adding entry:', err);
    return false;
  }
};

const addTeaches = async (student_id, teacher_id) => {
  try {
    const insertQuery = `
      INSERT INTO teaches (student_id, teacher_id)
      VALUES ($1, $2);  -- Avoid duplicate entries
    `;
    await client.query(insertQuery, [student_id, teacher_id])
    console.log('Entry added successfully!')
    return true;
  } catch (err) {
    console.error('Error adding entry:', err);
    return false;
  }
}

const addStudent = async (student_id) => {
  try {
    const insertQuery = `
      INSERT INTO student (id)
      VALUES ($1);  -- Avoid duplicate entries
    `;
    await client.query(insertQuery, [student_id]);
    console.log('Entry added successfully!');
    return true;
  } catch (err) {
    console.error('Error adding entry:', err);
    return false;
  }
};

const addMentor = async (mentor_id) => {
  try {
    const insertQuery = `
      INSERT INTO mentor (id)
      VALUES ($1);  -- Avoid duplicate entries
    `;
    await client.query(insertQuery, [mentor_id]);
    console.log('Entry added successfully!');
    return true;
  } catch (err) {
    console.error('Error adding entry:', err);
    return false;
  }
};

const addTeacher = async (username, passkey, email, ) => {
  try {
    const insertQuery = `
      INSERT INTO teacher (name, passkey, email)
      VALUES ($1, $2, $3);  -- Avoid duplicate entries
    `;
    await client.query(insertQuery, [username, passkey, email]);
    console.log('Entry added successfully!');
    return true;
  } catch (err) {
    console.error('Error adding entry:', err);
    return false;
  }
}
// Get elements from the table
const getUserByEmail = async (email) => {
  try {
    insertQuery = client.query(`SELECT * FROM users WHERE email = '$1';`);
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

// Get elements from the table
const getPasskey= async (id) => {
  try {
    insertQuery = client.query(`SELECT * FROM users WHERE id = '$1';`);
    const result = await client.query(insertQuery, [id]);

    if (result.rows.length == 1) {
      // Return the only matching row as a JSON object
      console.log('Mentors:', result.rows); // `result.rows` will contain the fetched rows
      var passkey = result.rows[0].passkey;

      return passkey; // This will return the entire row in a JSON format
    } 
    else {
      return null; // Handle case where no mentor is found
    }
  } catch (err) {
    console.error('Error fetching elements:', err);
  }
};



// TODO : 

const getTeacherByEmail = async (email) => {
  try {
    insertQuery = client.query(`SELECT * FROM teacher WHERE email = '$1';`);
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
      return { message: 'User not found or multiple teachers with same email' }; // Handle case where no teacher is found
    }
  } catch (err) {
    console.error('Error fetching elements:', err);
  }
};

const modifyUser = async (email, newName, newPasskey) => {
  try {
    const updateQuery = `
      UPDATE student
      SET name = $2, passkey = $3
      WHERE email = $1
      `;
    
    const result = await client.query(updateQuery, [email, newName, newPasskey])
    console.log('User info updated successfully!')
    return true;
  } catch (err) {
    console.error('Error updating user info.')
    return false;
  }
};

// Execute all operations
const run = async () => {
  try {
    await createUsersTable();
    await createPasskeyTable();

    await createStudentTable(); 
    await createMentorTable();
    
    await createMeetsTable();
    await createTeacherTable();
    
  } catch (err) {
    console.error('Error during operations:', err);
  }
};

// Run the operations
run();