// Test Case: JWT token generation on login
// We check that login creates token when credentials are correct.

const { login } = require('./authController');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../config/jwt');

jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('../config/jwt');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('JWT Token Generation - login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate JWT token successfully on valid login', async () => {
    const req = {
      body: {
        email: 'admin@gmail.com',
        password: 'admin123',
      },
    };
    const res = createMockRes();

    const fakeUser = {
      _id: 'user-1',
      email: 'admin@gmail.com',
      role: 'admin',
      password: 'hashed-password',
    };

    User.findOne.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);
    generateToken.mockReturnValue('mock-jwt-token');

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@gmail.com' });
    expect(bcrypt.compare).toHaveBeenCalledWith('admin123', 'hashed-password');
    expect(generateToken).toHaveBeenCalledWith(fakeUser);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Login successful',
      token: 'mock-jwt-token',
      user: { id: 'user-1', email: 'admin@gmail.com', role: 'admin' },
    });
  });
});

