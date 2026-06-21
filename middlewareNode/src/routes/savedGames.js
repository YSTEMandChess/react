const config = require("config");
const express = require('express');
const passport = require("passport");
const router = express.Router();
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// READ use userid to get all games 

//Write: Start a new game. push to user array

//Write: edit fen of already existing game with every move 

module.exports(router)