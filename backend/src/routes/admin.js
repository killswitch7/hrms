// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();

const { protect, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Employee = require('../models/Employee');

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

module.exports = router;
