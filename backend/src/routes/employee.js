// backend/src/routes/employee.js
const express = require('express');
const router = express.Router();

const { protect, requireRole } = require('../middleware/auth');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');

// All employee routes require logged-in employee
router.use(protect);
router.use(requireRole('employee'));

// Helper: ensure employee profile exists for current user
async function getOrCreateEmployeeForUser(user) {
  let employee = await Employee.findOne({ user: user._id });

  if (!employee) {
    const [firstNamePart] = user.email.split('@');
    const employeeId = `EMP-${Date.now()}`;

    employee = await Employee.create({
      user: user._id,
      employeeId,
      firstName: firstNamePart || 'Employee',
      lastName: '',
      email: user.email,
      status: 'active',
    });
  }

  return employee;
}

// Simple test route
router.get('/ping', (req, res) => {
  return res.json({ message: 'Employee routes working', user: req.user.email });
});

// -------------------- ATTENDANCE --------------------

// Normalize a JS Date to midnight (start of day)
function normalizeDate(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// POST /api/employee/attendance/check-in
router.post('/attendance/check-in', async (req, res) => {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const today = normalizeDate(new Date());

    let record = await Attendance.findOne({ employee: employee._id, date: today });

    if (record && record.checkIn) {
      return res.status(400).json({ message: 'Already checked in for today' });
    }

    const now = new Date();

    if (!record) {
      record = await Attendance.create({
        employee: employee._id,
        date: today,
        checkIn: now,
        status: 'Present',
      });
    } else {
      record.checkIn = now;
      record.status = 'Present';
      await record.save();
    }

    res.status(201).json({
      message: 'Checked in successfully',
      data: record,
    });
  } catch (err) {
    console.error('Error during check-in:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/employee/attendance/check-out
router.post('/attendance/check-out', async (req, res) => {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const today = normalizeDate(new Date());

    const record = await Attendance.findOne({ employee: employee._id, date: today });

    if (!record || !record.checkIn) {
      return res
        .status(400)
        .json({ message: 'Cannot check-out before check-in for today' });
    }

    if (record.checkOut) {
      return res.status(400).json({ message: 'Already checked out for today' });
    }

    record.checkOut = new Date();
    await record.save();

    res.json({
      message: 'Checked out successfully',
      data: record,
    });
  } catch (err) {
    console.error('Error during check-out:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/employee/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/attendance', async (req, res) => {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);

    let { from, to } = req.query;

    let fromDate, toDate;
    if (from) {
      fromDate = normalizeDate(new Date(from));
    } else {
      // default: last 30 days
      fromDate = normalizeDate(new Date());
      fromDate.setDate(fromDate.getDate() - 30);
    }

    if (to) {
      toDate = normalizeDate(new Date(to));
      toDate.setHours(23, 59, 59, 999);
    } else {
      toDate = normalizeDate(new Date());
      toDate.setHours(23, 59, 59, 999);
    }

    const records = await Attendance.find({
      employee: employee._id,
      date: { $gte: fromDate, $lte: toDate },
    }).sort({ date: -1 });

    res.json({ data: records });
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------- WFH REQUESTS --------------------

// POST /api/employee/wfh
router.post('/wfh', async (req, res) => {
  try {
    const { from, to, reason } = req.body;

    if (!from || !to) {
      return res.status(400).json({ message: 'From and To dates are required' });
    }

    const employee = await getOrCreateEmployeeForUser(req.user);

    const wfhRequest = await LeaveRequest.create({
      employee: employee._id,
      type: 'WFH',
      from: new Date(from),
      to: new Date(to),
      reason,
      status: 'Pending',
    });

    res.status(201).json({
      message: 'WFH request submitted',
      data: wfhRequest,
    });
  } catch (err) {
    console.error('Error creating WFH request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/employee/wfh
router.get('/wfh', async (req, res) => {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);

    const requests = await LeaveRequest.find({
      employee: employee._id,
      type: 'WFH',
    }).sort({ createdAt: -1 });

    res.json({ data: requests });
  } catch (err) {
    console.error('Error fetching WFH requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------- NORMAL LEAVE --------------------

// POST /api/employee/leave
router.post('/leave', async (req, res) => {
  try {
    const { from, to, reason, type } = req.body;

    if (!from || !to) {
      return res.status(400).json({ message: 'From and To dates are required' });
    }

    const leaveType = type || 'Annual';
    if (leaveType === 'WFH') {
      return res
        .status(400)
        .json({ message: 'Use /wfh endpoint for Work From Home requests' });
    }

    const employee = await getOrCreateEmployeeForUser(req.user);

    const leaveReq = await LeaveRequest.create({
      employee: employee._id,
      type: leaveType,
      from: new Date(from),
      to: new Date(to),
      reason,
      status: 'Pending',
    });

    res.status(201).json({
      message: 'Leave request submitted',
      data: leaveReq,
    });
  } catch (err) {
    console.error('Error creating leave request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/employee/leave
router.get('/leave', async (req, res) => {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);

    const { type } = req.query;
    const filter = {
      employee: employee._id,
      type: { $ne: 'WFH' },
    };

    if (type) {
      filter.type = type;
    }

    const requests = await LeaveRequest.find(filter).sort({ createdAt: -1 });

    res.json({ data: requests });
  } catch (err) {
    console.error('Error fetching leave requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
