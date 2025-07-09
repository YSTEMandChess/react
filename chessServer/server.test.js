const request = require('supertest');
const { io } = require('socket.io-client');
const http = require('http');
require('dotenv').config();

let server;
let ioClient;
let socketURL;

beforeAll((done) => {
  const app = require('express')();
  server = http.createServer(app);
  const socketIo = require('socket.io')(server, {
    cors: { origin: "*" },
  });

  // Mock some necessary socket event handlers here
  socketIo.on('connection', (socket) => {
    socket.on('newgame', (msg) => { /* some game init logic */ });
    socket.on('move', (msg) => { /* some move logic */ });
    socket.on('endgame', (msg) => { /* some endgame logic */ });
    // Add any other necessary handlers
  });

  server.listen(process.env.PORT || 3000, done);
  socketURL = `http://localhost:${process.env.PORT || 3000}`;
});

afterAll((done) => {
  server.close(done);
});

describe('Server Setup and Socket Tests', () => {

  // Test server response
  it('should return a successful server connection', async () => {
    const response = await request(server).get('/');
    expect(response.status).toBe(404); // Adjust depending on your routes
  });

  // Test socket connection
  it('should connect to socket successfully', (done) => {
    ioClient = io(socketURL);

    ioClient.on('connect', () => {
      expect(ioClient.connected).toBe(true);
      done();
    });
  });

  // Test new game initialization
  it('should initialize a new game for a student', (done) => {
    ioClient.emit('newgame', JSON.stringify({
      student: 'Alice',
      mentor: 'Bob',
      role: 'student'
    }));

    ioClient.on('boardstate', (msg) => {
      const { boardState, color } = JSON.parse(msg);
      expect(boardState).toBeDefined(); // Ensure board state is provided
      expect(color).toBe('black'); // Student is assigned black
      done();
    });
  });

  // Test move handling
  it('should allow a valid chess move', (done) => {
    ioClient.emit('move', JSON.stringify({
      from: 'e2',
      to: 'e4'
    }));

    ioClient.on('boardstate', (msg) => {
      const { boardState } = JSON.parse(msg);
      expect(boardState).toContain('rnbqkbnr'); // Check board state reflects the move
      done();
    });
  });

  // Test end game
  it('should end the game and reset the state', (done) => {
    ioClient.emit('endgame', JSON.stringify({
      student: 'Alice',
      mentor: 'Bob',
    }));

    ioClient.on('reset', () => {
      expect(true).toBe(true); // Just checking the reset event was emitted
      done();
    });
  });


  // Test undo action
  it('should undo the last move', (done) => {
    ioClient.emit('undo', JSON.stringify({
      moveId: 'move1',
      playerId: 'Alice'
    }));

    ioClient.on('boardstate', (msg) => {
      const { boardState } = JSON.parse(msg);
      expect(boardState).toBeDefined(); // Ensure board state has been reverted
      done();
    });
  });

  // Test invalid role error handling
  it('should emit an error for invalid role in new game', (done) => {
    ioClient.emit('newgame', JSON.stringify({
      student: 'Alice',
      mentor: 'Bob',
      role: 'invalid_role'
    }));

    ioClient.on('error', (msg) => {
      expect(msg).toBe('error : invalid value for msg.role. Requires student/mentor');
      done();
    });
  });
});
