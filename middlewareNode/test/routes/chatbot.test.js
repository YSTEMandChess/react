const request = require('supertest');
const app = require('../../src/server');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { ConversationState } = require('../../src/models/conversationsModel');

//Mock the conversation engine
//Return a mocked response
jest.mock('../../src/utils/conversationEngine', () => ({
  generateBotResponse: jest.fn(({ currentState, userMessage }) => {
    return {
      botMessage: `Mocked response for: "${userMessage}" in state "${currentState}"`,
      nextState: 'MOCKED_NEXT_STATE'
    };
  }),
}));

// Import the mocked function
const { generateBotResponse } = require('../../src/utils/conversationEngine');

let mongoServer;

// This keeps tests isolated from the real database
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

// Clear mocks after each test
afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
  generateBotResponse.mockClear();
});

// Close the connection after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Test suite for POST /bot/respond endpoint
describe('POST /bot/respond', () => {
  const testUserId = 'testUser123';
  const validUserMessage = 'Hello bot, how are you?';
  const initialClientState = 'GREETING';

  // Test case 1: Authentication header is missing
  it('returns 401 if authentication header is missing', async () => {
    const res = await request(app)
      .post('/bot/respond')
      .send({ userMessage: validUserMessage, currentState: initialClientState });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Authentication required');
  });
  // Test case 2: Input validation fails
  it('returns 400 if input validation fails', async () => {
    const res = await request(app)
      .post('/bot/respond')
      .set('X-User-Id', testUserId)
      .send({ userMessage: 'This contains badword', currentState: initialClientState });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid user message');
  });
  // Test case 3: Required fields are missing
  it('returns 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/bot/respond')
      .set('X-User-Id', testUserId)
      .send({ currentState: initialClientState });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('userId, userMessage, and currentState are required');
  });
  // Test case 4: Valid request with new user   
  it('creates new conversation for new user', async () => {
    const res = await request(app)
      .post('/bot/respond')
      .set('X-User-Id', testUserId)
      .send({ userMessage: validUserMessage, currentState: initialClientState });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('botMessage');
    expect(res.body).toHaveProperty('nextState');

    expect(generateBotResponse).toHaveBeenCalledTimes(1);
    expect(generateBotResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        currentState: initialClientState,
        userMessage: validUserMessage,
      })
    );

    const savedState = await ConversationState.findOne({ userId: testUserId });

    expect(savedState).toBeTruthy();
    expect(savedState.currentState).toBe('MOCKED_NEXT_STATE');
    expect(savedState.conversationHistory).toHaveLength(2);
  });
  // Test case 5: Valid request with existing user
  it('updates conversation for existing user', async () => {
    await request(app)
      .post('/bot/respond')
      .set('X-User-Id', testUserId)
      .send({ userMessage: 'First message', currentState: 'GREETING' });

    generateBotResponse.mockClear();

    const res = await request(app)
      .post('/bot/respond')
      .set('X-User-Id', testUserId)
      .send({ userMessage: 'Second message', currentState: 'MOCKED_NEXT_STATE' });

    expect(res.statusCode).toBe(200);
    expect(generateBotResponse).toHaveBeenCalledTimes(1);

    const savedState = await ConversationState.findOne({ userId: testUserId });

    expect(savedState.currentState).toBe('MOCKED_NEXT_STATE');
    expect(savedState.conversationHistory).toHaveLength(4);
  });
  // Test case 6: Valid request with existing user and unexpected error in conversation engine
  it('returns 500 if unexpected error occurs', async () => {
    generateBotResponse.mockImplementationOnce(() => {
      throw new Error('Engine failure');
    });

    const res = await request(app)
      .post('/bot/respond')
      .set('X-User-Id', testUserId)
      .send({ userMessage: validUserMessage, currentState: initialClientState });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});