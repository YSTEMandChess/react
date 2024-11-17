require("dotenv").config();
const readline = require("readline");
const axios = require("axios");

const network = "ystem-network"; // API server name
const PORT = 4000; // API server port
const BASE_URL = `http://${network}:${PORT}`; // Base URL for API requests

console.log("Connected to API at:", BASE_URL);

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to get user input
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// Main loop
const run = async () => {
  console.log("Welcome! Use this tool to add users, mentors, or meetings to the system.");

  while (true) {
    try {
      // Ask for the action
      const action = await askQuestion("Would you like to add a user, mentor, or meeting? (type 'exit' to quit): ");

      if (action.toLowerCase() === "exit") {
        console.log("Exiting...");
        break;
      }

      let data = {};
      let endpoint = "";

      // Handle user actions
      if (action.toLowerCase() === "user") {
        const name = await askQuestion("Enter user's name: ");
        const email = await askQuestion("Enter user's email: ");
        data = { name, email };
        endpoint = "/add-user";
      } else if (action.toLowerCase() === "mentor") {
        const name = await askQuestion("Enter mentor's name: ");
        const expertise = await askQuestion("Enter mentor's area of expertise: ");
        data = { name, expertise };
        endpoint = "/add-mentor";
      } else if (action.toLowerCase() === "meeting") {
        const topic = await askQuestion("Enter meeting topic: ");
        const time = await askQuestion("Enter meeting time: ");
        data = { topic, time };
        endpoint = "/add-meeting";
      } else {
        console.log("Invalid option. Please choose 'user', 'mentor', or 'meeting'.");
        continue;
      }

      // Make the API request
      const response = await axios.post(`${BASE_URL}${endpoint}`, data);
      console.log("Success:", response.data);
    } catch (err) {
      console.error("Error:", err.response ? err.response.data : err.message);
    }
  }

  rl.close();
};

run();
