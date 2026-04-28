// API Test: Protected route should work only with valid token

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Prevent real DB connect from app import
jest.mock('../config/db', () => jest.fn());

// Models used by middleware/controllers in this route
jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));
jest.mock('../models/Department', () => ({
  find: jest.fn(),
}));

const User = require('../models/User');
const Department = require('../models/Department');
const app = require('../app');

describe('Protected API Token Access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should allow access with valid token', async () => {
    const token = jwt.sign(
      { id: 'admin-user-1', email: 'admin@mail.com', role: 'admin' },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1h' }
    );

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'admin-user-1',
        email: 'admin@mail.com',
        role: 'admin',
      }),
    });

    Department.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    const res = await request(app)
      .get('/api/admin/departments')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('should reject access with invalid token', async () => {
    const res = await request(app)
      .get('/api/admin/departments')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Token is not valid');
  });
});

