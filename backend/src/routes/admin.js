// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();

const { protect, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');

/**
 * Quick test route
 * GET /api/admin/ping
 */
router.get('/ping', (req, res) => {
  res.json({ message: 'Admin route working' });
});

/**
 * POST /api/admin/employees
 * Admin creates a new employee (User + Employee)
 * Body from frontend:
 * { name, email, password, department, position }
 */
router.post('/employees', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, department, position } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase();

    // 1) Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: 'A user with this email already exists.' });
    }

    // 2) Create User for login
    const user = new User({
      name,
      email: normalizedEmail,
      password,          // hashed by User pre-save hook
      role: 'employee',  // 🔴 force employee role
    });

    await user.save();

    // 3) Create Employee profile (match your existing schema)
    const employee = new Employee({
      user: user._id,
      employeeId: `EMP-${Date.now()}`,
      firstName: name,
      lastName: '',
      email: normalizedEmail,
      department: department || '',
      position: position || '',
      status: 'active',
      // any other defaults defined in Employee schema
    });

    await employee.save();

    const userSafe = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.status(201).json({
      message: 'Employee registered successfully',
      user: userSafe,
      employee,
    });
  } catch (err) {
    console.error('Create employee error:', err);

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        details: err.errors,
      });
    }

    if (err.code === 11000) {
      return res.status(409).json({
        message: 'Duplicate key error',
        key: err.keyValue,
      });
    }

    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * ---------- ATTENDANCE (ADMIN) ----------
 */
// GET /api/admin/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD&employeeId=EMP-123
router.get('/attendance', protect, requireRole('admin'), async (req, res) => {
  try {
    const { from, to, employeeId } = req.query;

    const filter = {};

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }

    if (employeeId) {
      const employee = await Employee.findOne({ employeeId });
      if (!employee) {
        return res.json({ data: [] });
      }
      filter.employee = employee._id;
    }

    const records = await Attendance.find(filter)
      .populate('employee', 'employeeId firstName lastName email')
      .sort({ date: -1 });

    res.json({ data: records });
  } catch (err) {
    console.error('Error fetching attendance (admin):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * ---------- LEAVE & WFH APPROVALS ----------
 * Admin only
 */

// GET /api/admin/leave-requests?status=Pending
router.get('/leave-requests', protect, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { type: { $ne: 'WFH' } };
    if (status) filter.status = status;

    const requests = await LeaveRequest.find(filter)
      .populate('employee', 'employeeId firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ data: requests });
  } catch (err) {
    console.error('Error fetching leave requests (admin):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/wfh-requests?status=Pending
router.get('/wfh-requests', protect, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { type: 'WFH' };
    if (status) filter.status = status;

    const requests = await LeaveRequest.find(filter)
      .populate('employee', 'employeeId firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ data: requests });
  } catch (err) {
    console.error('Error fetching WFH requests (admin):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/leave-requests/:id/approve
router.patch('/leave-requests/:id/approve', protect, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await LeaveRequest.findOneAndUpdate(
      { _id: id, type: { $ne: 'WFH' } },
      { status: 'Approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    res.json({ message: 'Leave approved', data: updated });
  } catch (err) {
    console.error('Error approving leave:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/leave-requests/:id/reject
router.patch('/leave-requests/:id/reject', protect, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await LeaveRequest.findOneAndUpdate(
      { _id: id, type: { $ne: 'WFH' } },
      { status: 'Rejected', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    res.json({ message: 'Leave rejected', data: updated });
  } catch (err) {
    console.error('Error rejecting leave:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/wfh-requests/:id/approve
router.patch('/wfh-requests/:id/approve', protect, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await LeaveRequest.findOneAndUpdate(
      { _id: id, type: 'WFH' },
      { status: 'Approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'WFH request not found' });
    }

    res.json({ message: 'WFH approved', data: updated });
  } catch (err) {
    console.error('Error approving WFH:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/wfh-requests/:id/reject
router.patch('/wfh-requests/:id/reject', protect, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await LeaveRequest.findOneAndUpdate(
      { _id: id, type: 'WFH' },
      { status: 'Rejected', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'WFH request not found' });
    }

    res.json({ message: 'WFH rejected', data: updated });
  } catch (err) {
    console.error('Error rejecting WFH:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
