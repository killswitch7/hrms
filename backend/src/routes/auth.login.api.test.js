// API Test: POST /api/auth/login
// Jest + Supertest test file

const request = require('supertest');

// Prevent real DB connect when app is imported
jest.mock('../config/db', () => jest.fn());

// Mock models used by auth routes
jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
}));
jest.mock('../models/Employee', () => ({
  findOne: jest.fn(),
}));

// Mock OTP service because auth route imports it
jest.mock('../services/otpService', () => ({
  createAndSendOtp: jest.fn(),
  verifyOtp: jest.fn(),
}));

const User = require('../models/User');
const app = require('../app'); // app must be exported without app.listen

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and token for valid login', async () => {
    User.findOne.mockResolvedValue({
      _id: 'user-101',
      name: 'Test User',
      email: 'test@mail.com',
      role: 'admin',
      comparePassword: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@mail.com',
      password: '123456',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(10);
    expect(res.body).toHaveProperty('message', 'Login successful');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('role', 'admin');
  });

  test('should return 400 for invalid login', async () => {
    User.findOne.mockResolvedValue({
      _id: 'user-101',
      email: 'test@mail.com',
      role: 'admin',
      comparePassword: jest.fn().mockResolvedValue(false),
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@mail.com',
      password: 'wrong-password',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
    expect(res.body).not.toHaveProperty('token');
  });
});
