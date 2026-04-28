// API Test: Employee leave submission with valid data

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Prevent real DB connection from app import
jest.mock('../config/db', () => jest.fn());

// Mock models used by auth + leave flow
jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));
jest.mock('../models/Employee', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../models/LeaveRequest', () => ({
  create: jest.fn(),
}));

const User = require('../models/User');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const app = require('../app');

describe('POST /api/employee/leave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should submit leave request successfully with valid data', async () => {
    const token = jwt.sign(
      { id: 'emp-user-1', email: 'test@mail.com', role: 'employee' },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1h' }
    );

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'emp-user-1',
        email: 'test@mail.com',
        role: 'employee',
      }),
    });

    Employee.findOne.mockResolvedValue({
      _id: 'emp-profile-1',
      user: 'emp-user-1',
      employeeId: 'EMP-123',
      email: 'test@mail.com',
      status: 'active',
    });

    const savedLeave = {
      _id: 'leave-1',
      employee: 'emp-profile-1',
      type: 'Annual',
      from: new Date('2026-04-20'),
      to: new Date('2026-04-21'),
      reason: 'Medical visit',
      status: 'Pending',
    };

    LeaveRequest.create.mockResolvedValue(savedLeave);

    const res = await request(app)
      .post('/api/employee/leave')
      .set('Authorization', `Bearer ${token}`)
      .send({
        from: '2026-04-20',
        to: '2026-04-21',
        type: 'Annual',
        reason: 'Medical visit',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Leave request submitted');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status', 'Pending');
  });
});

