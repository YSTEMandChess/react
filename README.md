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

For Windows
1. Install Apache from https://httpd.apache.org/docs/2.4/platform/windows.html
2. Once you are done downloading the `.zip` file to any location you want
3. After extracting the file, set the environment variable for it by adding the location of `<Insert Path Here/Apache24/bin` to the PATH environment variable

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

1. Navigate to the `chessClient` directory inside the `react` folder.
2. Run `npm i dotenv` to install the necessary dependencies.
3. Start the chess client:
  - On Linux: Run `cp -r * /var/www/html/`. You'll need to do this every time you make a change to the `chessClient` directory.
  - On Windows: Copy all the files from `chessClient` into the `htdocs` folder of your Apache installation. Then, run `httpd -k install` and `httpd -k start` in your terminal. After this, you should be able to go to "http://localhost" and see the chessboard.

That's it! You've set up your development environment for the Y STEM and Chess project. Happy coding!