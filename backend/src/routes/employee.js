// backend/src/routes/employee.js
const express = require('express');
const router = express.Router();

const { protect, requireRole } = require('../middleware/auth');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');

// All employee routes require logged-in employee
router.use(protect);
router.use(requireRole('employee'));

// Helper: ensure employee profile exists for current user
async function getOrCreateEmployeeForUser(user) {
  let employee = await Employee.findOne({ user: user._id });

  if (!employee) {
    // Auto-generate a simple employee profile
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
      type: { $ne: 'WFH' }, // exclude WFH here
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
