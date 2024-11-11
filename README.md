# Y STEM and Chess
Welcome to the Y STEM and Chess project! This document will guide you through setting up your development environment.

## Development Environment Setup

### Prerequisites

#### NodeJS
This project uses NodeJS version 14

For Linux: `sudo apt install nodejs`

For Windows: https://www.geeksforgeeks.org/installation-of-node-js-on-windows/

#### Nodemon
Nodemon is a utility that will monitor for any changes in your source and automatically restart your server. 

For Linux: `sudo npm install -g nodemon`

For Windows:`npm install -g nodemon`

#### Apache
Apache is a widely used web server software

For Linux: sudo apt update && sudo apt install apache2

For Windows: https://httpd.apache.org/docs/2.4/platform/windows.html

#### Environment Variables
You should have been given access to a script named `create_dev_envs.sh`
1. Paste this file into the root of the react repository
2. Run it in the terminal by running `sh create_dev_envs.sh`
3. If you are on Windows, you will have to run the script in Git Bash

### Setting Up Individual Services

This project consists of several services. Here's how to set each one up:

#### React Frontend (`react-ystemandchess`)

1. Navigate to the `react-ystemandchess` directory inside the `react` folder.
2. Run `npm install` to install the necessary dependencies.
3. run `npm start` to start the React development environment.

#### Middleware Node (`middlewareNode`)

1. Navigate to the `middlewareNode` directory inside the `react` folder.
2. Run `npm install` to install the necessary dependencies.
3. Run `nodemon index.js` to start the server.

#### Stockfish Server (`stockfishServer`)

1. Navigate to the `stockfishServer` directory inside the `react` folder.
2. Run `npm install` and `npm i dotenv` to install the necessary dependencies.
3. Run `nodemon index.js` to start the server.

#### Chess Server (`chessServer`)

1. Navigate to the `chessServer` directory inside the `react` folder.
2. Run `npm install` and `npm i dotenv` to install the necessary dependencies.
3. Run `nodemon index.js` to start the server.

#### Chess Client (`chessClient`)

The purpose of the chess Client is to 

1. Navigate to the `react-ystemandchess/src/chesswidgets/chessClient` directory inside the `react` folder you cloned from github.
2. Run `npm i dotenv` to install the necessary dependencies (this includes Chess.js).
3. Install live server visual studio extension.
4. To see the chessBoard only, click on index.html and select "run with live server".
5. To see the chessBoard with parentWindow, right click on parent.html and select "run with live server"
6. To see how both mentor and student interact, right click on both.html and select "run with live server"
7. NOTE : before you can test multiplayer functionality with the chessClient, you MUST have chessServer started first to facilitate communication between two users (mentor and student)
