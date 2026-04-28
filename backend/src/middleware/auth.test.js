// Simple Jest tests for JWT token validation middleware
// Test case: valid token should pass, invalid token should fail

const { protect } = require('./auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

jest.mock('jsonwebtoken');
jest.mock('../models/User');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('JWT Token Validation - protect middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should allow access when token is valid', async () => {
    const req = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };
    const res = createMockRes();
    const next = jest.fn();

    jwt.verify.mockReturnValue({ id: 'user-1' });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'user-1',
        name: 'Test User',
        role: 'employee',
      }),
    });

    await protect(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should return 401 when token is invalid', async () => {
    const req = {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    };
    const res = createMockRes();
    const next = jest.fn();

    jwt.verify.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await protect(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token is not valid' });
  });

  test('should return 401 when token is missing', async () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No token, authorization denied',
    });
  });
});

