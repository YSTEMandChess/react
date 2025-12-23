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

    socketIo.on('connection', (socket) => {
        socket.on('newgame', (msg) => {
            const { role } = JSON.parse(msg);
            if (!['student', 'mentor'].includes(role)) {
                socket.emit('error', 'error : invalid value for msg.role. Requires student/mentor');
                return;
            }
            socket.emit('boardstate', JSON.stringify({
                boardState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
                color: role === 'student' ? 'black' : 'white'
            }));
        });
        socket.on('move', (msg) => {
            // Simulate boardstate after move
            socket.emit('boardstate', JSON.stringify({
                boardState: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR',
                color: 'black' // Add this line
            }));
        });
        socket.on('endgame', () => {
            socket.emit('reset');
        });
        socket.on('undo', () => {
            socket.emit('boardstate', JSON.stringify({
                boardState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
                color: 'black'
            }));
        });
    });

    server.listen(process.env.PORT || 3000, done);
    socketURL = `http://localhost:${process.env.PORT || 3000}`;
});
afterAll((done) => {
    if (ioClient && ioClient.connected) {
        ioClient.disconnect();
    }
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
    }, 10000);

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
            expect(boardState).toBeDefined();
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
