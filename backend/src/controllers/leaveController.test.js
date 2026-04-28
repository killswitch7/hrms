// Test Case: Leave request submission with valid data

const { createLeave, approveLeave } = require('./leaveController');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const { getOrCreateEmployeeForUser } = require('./employeeController');
const { notifyLeaveOrWfhDecision } = require('../services/mailService');

jest.mock('../models/LeaveRequest');
jest.mock('../models/User');
jest.mock('./employeeController');
jest.mock('../services/mailService');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('Leave Request Submission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should save leave request when valid data is provided', async () => {
    const req = {
      user: { _id: 'user-1' },
      body: {
        from: '2026-04-20',
        to: '2026-04-22',
        reason: 'Family function',
        type: 'Annual',
      },
    };
    const res = createMockRes();

    const employee = { _id: 'emp-1' };
    const savedLeave = {
      _id: 'leave-1',
      employee: 'emp-1',
      type: 'Annual',
      from: new Date('2026-04-20'),
      to: new Date('2026-04-22'),
      reason: 'Family function',
      status: 'Pending',
    };

    getOrCreateEmployeeForUser.mockResolvedValue(employee);
    LeaveRequest.create.mockResolvedValue(savedLeave);

    await createLeave(req, res);

    expect(getOrCreateEmployeeForUser).toHaveBeenCalledWith(req.user);
    expect(LeaveRequest.create).toHaveBeenCalledWith({
      employee: 'emp-1',
      type: 'Annual',
      from: new Date('2026-04-20'),
      to: new Date('2026-04-22'),
      reason: 'Family function',
      status: 'Pending',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Leave request submitted',
      data: savedLeave,
    });
  });
});

describe('Leave Approval Process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should change pending leave status to approved by admin', async () => {
    const req = {
      params: { id: 'leave-123' },
      user: { _id: 'admin-1', role: 'admin' },
    };
    const res = createMockRes();

    const leaveDoc = {
      _id: 'leave-123',
      employee: {
        user: 'manager-user-1',
        firstName: 'Manager',
        lastName: 'One',
        email: 'manager@test.com',
      },
      type: 'Annual',
      status: 'Pending',
      from: new Date('2026-04-20'),
      to: new Date('2026-04-22'),
      reason: 'Family event',
      save: jest.fn().mockResolvedValue(true),
    };

    LeaveRequest.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(leaveDoc),
    });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ role: 'manager' }),
    });
    notifyLeaveOrWfhDecision.mockResolvedValue(true);

    await approveLeave(req, res);

    expect(leaveDoc.status).toBe('Approved');
    expect(leaveDoc.approvedBy).toBe('admin-1');
    expect(leaveDoc.approvedAt).toBeTruthy();
    expect(leaveDoc.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Leave approved',
      data: leaveDoc,
    });
  });
});
