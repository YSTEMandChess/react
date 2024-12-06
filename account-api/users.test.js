const request = require('supertest');
const app = require('./index.js');  // Adjust the path to your app
const { addUser, addPasskey, addStudent, getUserByEmail } = require('./index.js'); // Adjust imports based on your app structure

jest.mock('./index.js');  // Mock the services used in the route


describe('POST /add-student', () => {
  afterEach(() => {
    jest.clearAllMocks();  // Clear mocks between tests
  });

  it('should return 400 if name, email or pass are missing', async () => {
    const response = await request(app)
      .post('/add-student')
      .send({
        name: 'John Doe',  // Missing email and passkey
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Name, pass, and email are required');
  });

  it('should successfully add a student if valid data is provided', async () => {
    const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    const mockPasskey = 'test-passkey';
    
    // Mock the service functions
    addUser.mockResolvedValue(mockUser);
    addPasskey.mockResolvedValue(true);
    getUserByEmail.mockResolvedValue(mockUser);
    addStudent.mockResolvedValue(true);

    const response = await request(app)
      .post('/add-student')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        pass: mockPasskey
      });

    expect(response.status).toBe(200);
    expect(response.body.passed).toBe(true);
    expect(addUser).toHaveBeenCalledWith('John Doe', 'john@example.com');
    expect(addPasskey).toHaveBeenCalledWith(mockPasskey);
    expect(addStudent).toHaveBeenCalledWith(mockUser.id);
  });

  it('should return failure if student addition fails', async () => {
    const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
    const mockPasskey = 'test-passkey';

    // Mock service functions for failure scenario
    addUser.mockResolvedValue(mockUser);
    addPasskey.mockResolvedValue(true);
    getUserByEmail.mockResolvedValue(mockUser);
    addStudent.mockResolvedValue(false); // Simulate failure

    const response = await request(app)
      .post('/add-student')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        pass: mockPasskey
      });

    expect(response.status).toBe(200);  // Status is still 200 because it's a valid request
    expect(response.body.passed).toBe(false);
  });
});
