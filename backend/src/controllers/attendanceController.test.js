// Test Case: Duplicate attendance check-in should be blocked

const { checkIn, checkOut } = require('./attendanceController');
const Attendance = require('../models/Attendance');
const {
  getOrCreateEmployeeForUser,
  normalizeDate,
} = require('./employeeController');

jest.mock('../models/Attendance');
jest.mock('./employeeController');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('Attendance Duplicate Check-In', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should reject second check-in request on same day', async () => {
    const req = { user: { _id: 'user-1' } };
    const res1 = createMockRes();
    const res2 = createMockRes();

    const employee = { _id: 'emp-1' };
    const today = new Date('2026-04-17T00:00:00.000Z');

    getOrCreateEmployeeForUser.mockResolvedValue(employee);
    normalizeDate.mockReturnValue(today);

    const createdRecord = {
      _id: 'att-1',
      employee: 'emp-1',
      date: today,
      checkIn: new Date('2026-04-17T09:00:00.000Z'),
      status: 'Present',
    };

    // First request: no record -> create success
    Attendance.findOne.mockResolvedValueOnce(null);
    Attendance.create.mockResolvedValueOnce(createdRecord);

    await checkIn(req, res1);

    expect(res1.status).toHaveBeenCalledWith(201);
    expect(Attendance.create).toHaveBeenCalledTimes(1);

    // Second request: record with check-in already exists -> reject
    Attendance.findOne.mockResolvedValueOnce({
      _id: 'att-1',
      employee: 'emp-1',
      date: today,
      checkIn: new Date('2026-04-17T09:00:00.000Z'),
      status: 'Present',
    });

    await checkIn(req, res2);

    expect(res2.status).toHaveBeenCalledWith(400);
    expect(res2.json).toHaveBeenCalledWith({
      message: 'Already checked in for today',
    });
  });
});

describe('Attendance Check-Out', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update attendance with check-out time after check-in', async () => {
    const req = { user: { _id: 'user-2' } };
    const res = createMockRes();

    const employee = { _id: 'emp-2' };
    const today = new Date('2026-04-17T00:00:00.000Z');

    getOrCreateEmployeeForUser.mockResolvedValue(employee);
    normalizeDate.mockReturnValue(today);

    const record = {
      _id: 'att-2',
      employee: 'emp-2',
      date: today,
      checkIn: new Date('2026-04-17T09:05:00.000Z'),
      checkOut: null,
      status: 'Present',
      save: jest.fn().mockResolvedValue(true),
    };

    Attendance.findOne.mockResolvedValue(record);

    await checkOut(req, res);

    expect(Attendance.findOne).toHaveBeenCalledWith({
      employee: 'emp-2',
      date: today,
    });
    expect(record.save).toHaveBeenCalledTimes(1);
    expect(record.checkOut).toBeTruthy();
    expect(res.json).toHaveBeenCalledWith({
      message: 'Checked out successfully',
      data: record,
    });
  });
});
