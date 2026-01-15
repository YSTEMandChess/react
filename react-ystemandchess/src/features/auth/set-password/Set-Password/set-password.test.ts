/**
 * Tests for setPassword Controller.
 * Unit tests for the setPassword controller, mocking the setPasswordService.
 */

const { setPassword } = require('./setPasswordController');
const { updatePassword } = require('./setPasswordService');

jest.mock('./setPasswordService', () => ({
  updatePassword: jest.fn(),
}));

describe('setPassword Controller', () => {
  let req: any, res: any;

  beforeEach(() => {
    req = {
      body: {
        password: 'newPassword123',
        token: 'validToken',
      },
    };
    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
  });

  it('should return 400 if password or token is missing', async () => {
    req.body = {};
    await setPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password and token are required.',
    });
  });

  it('should call updatePassword with the correct arguments', async () => {
    updatePassword.mockResolvedValue({ success: true });
    await setPassword(req, res);
    expect(updatePassword).toHaveBeenCalledWith('newPassword123', 'validToken');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password successfully updated.',
    });
  });

  it('should handle errors from the service', async () => {
    updatePassword.mockResolvedValue({
      success: false,
      message: 'Invalid token',
    });
    await setPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid token',
    });
  });
});
