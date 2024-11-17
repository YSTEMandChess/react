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

const PORT = 4001;

console.log(network);
console.log(PORT);

// Execute all operations
const run = async () => {
  try {
    
  } catch (err) {
    console.error('Error during operations:', err);
  }
};

// Run the operations
run();