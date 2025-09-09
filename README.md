# Welcome to the Y STEM and Chess Project

This is an educational platform that combines chess instruction with STEM learning, aimed at supporting socially and economically underserved students. The platform helps students who benefit from alternative learning approaches by providing chess tutoring alongside mathematics, computer science, and mentoring.

---

## Development Environment Setup

To run the platform, you’ll need **Node.js v14**, **nodemon**, and **Apache** installed.

### NodeJS

This project requires NodeJS version 14.

**Linux:**

```bash
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS:**

```bash
brew install node@14
```

Or download from [nodejs.org](https://nodejs.org/)

**Windows:**
Download and install from [nodejs.org](https://nodejs.org/)

---

### Nodemon

Nodemon automatically restarts your server whenever code changes are detected.

**Linux/macOS:**

```bash
sudo npm install -g nodemon
```

**Windows:**

```bash
npm install -g nodemon
```

---

### Apache

Apache is used as a web server to serve the chess client interface.

**Linux:**

```bash
sudo apt update && sudo apt install apache2
```

**macOS:**

```bash
brew install httpd
```

**Windows:**
[Apache Installation Guide](https://httpd.apache.org/docs/2.4/platform/windows.html)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YSTEMandChess/react.git
cd react
```

### 2. Environment Setup

Running the following script creates all environment files needed for the platform services:

**Linux/macOS or Windows (Git Bash):**

```bash
sh create_dev_envs.sh
```

---

## Setting Up Each Service

Each service runs independently and requires its own terminal window. Start the Middleware API first, then the other services in any order.

#### Middleware API (Backend)

Handles user authentication, database operations, and coordinates other services.


```bash
cd middlewareNode
npm install    # Install backend dependencies  
npm start      # Start the API server
```

The server typically runs on port 8000. You should see "MongoDB Connected..." when it starts successfully.

---

#### Main React Application (Frontend)

Primary interface for students and mentors:

```bash
cd react-ystemandchess
npm install
npm start
```

The frontend runs on `http://localhost:3000` (or the next available port if 3000 is occupied).

---

#### Chess Game Server

Manages chess game logic, validates moves, and handles real-time gameplay:

```bash
cd chessServer
npm install
npm start
```

Defaults to port 3000 (or the next available port if taken).

---

#### Chess Engine Server

Integrates Stockfish for AI opponents and move analysis:

```bash
cd stockfishServer
npm install
npm start
```

This service usually runs on port 8080.

---

#### Chess Client (Testing Interface)

```bash
cd chessClient
npm install
```

Run the http server on port 80 using: `npx http-server -p 80` to ensure that the chess board frame loads during any session.
You can use the **Live Server extension in VS Code** to open the HTML files for local testing of the chess board:

* **Board only:** Right-click `index.html` → "Open with Live Server"
* **Board with controls:** Right-click `parent.html` → "Open with Live Server"
* **Mentor/Student interaction:** Right-click `both.html` → "Open with Live Server"

---

#### React Chess Component (Optional)

Modern React-based chess component for development/testing:

```bash
cd chess-client-react-refactor
npm install 
npm start 
```

Open `src/app.js` to ensure debug mode is set to `true`.

---

## Contributing

1. Create a new branch with a descriptive name:

```bash
git checkout -b my-branch-name
```

2. Test thoroughly to ensure all services work together.
3. Commit changes with clear messages.
4. Push and create a Pull Request for review.

---

You’re all set! Happy coding and thank you for contributing to educational equity! 🎯♟️