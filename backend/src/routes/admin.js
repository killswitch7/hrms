// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { protect, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');

function splitName(fullName = '') {
  const trimmed = String(fullName).trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }

  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function startOfDay(input = new Date()) {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(input = new Date()) {
  const d = new Date(input);
  d.setHours(23, 59, 59, 999);
  return d;
}

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
    const { firstName, lastName } = splitName(name);

    const employee = new Employee({
      user: user._id,
      employeeId: `EMP-${Date.now()}`,
      firstName: firstName || name,
      lastName,
      email: normalizedEmail,
      department: department || '',
      designation: position || '',
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
 * GET /api/admin/employees
 * Query: search, status, page, limit
 */
router.get('/employees', protect, requireRole('admin'), async (req, res) => {
  try {
    const {
      search = '',
      status = '',
      page = '1',
      limit = '20',
    } = req.query;

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const filter = {};
    if (status && ['active', 'inactive'].includes(String(status))) {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      filter.$or = [
        { employeeId: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
        { designation: searchRegex },
      ];
    }

    const [items, total] = await Promise.all([
      Employee.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      Employee.countDocuments(filter),
    ]);

    return res.json({
      data: items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.max(Math.ceil(total / safeLimit), 1),
      },
    });
  } catch (err) {
    console.error('Error fetching employees (admin):', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/admin/employees/:id
 */
router.patch('/employees/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid employee id' });
    }

    const employee = await Employee.findById(id).populate('user');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const {
      name,
      email,
      department,
      designation,
      status,
      phone,
      baseSalary,
    } = req.body;

    if (name !== undefined) {
      const { firstName, lastName } = splitName(name);
      employee.firstName = firstName || employee.firstName;
      employee.lastName = lastName;
      if (employee.user) {
        employee.user.name = String(name).trim();
      }
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const emailExists = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: employee.user?._id },
      });
      if (emailExists) {
        return res.status(409).json({ message: 'A user with this email already exists.' });
      }

      employee.email = normalizedEmail;
      if (employee.user) {
        employee.user.email = normalizedEmail;
      }
    }

    if (department !== undefined) employee.department = String(department).trim();
    if (designation !== undefined) employee.designation = String(designation).trim();
    if (phone !== undefined) employee.phone = String(phone).trim();
    if (baseSalary !== undefined) employee.baseSalary = Number(baseSalary) || 0;

    if (status !== undefined) {
      if (!['active', 'inactive'].includes(String(status))) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      employee.status = status;
    }

    await Promise.all([
      employee.save(),
      employee.user ? employee.user.save() : Promise.resolve(),
    ]);

    const updated = await Employee.findById(employee._id).populate('user', 'name email role');
    return res.json({ message: 'Employee updated successfully', data: updated });
  } catch (err) {
    console.error('Error updating employee (admin):', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate field value', key: err.keyValue });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/admin/employees/:id
 */
router.delete('/employees/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid employee id' });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await Promise.all([
      User.findByIdAndDelete(employee.user),
      Employee.findByIdAndDelete(employee._id),
      Attendance.deleteMany({ employee: employee._id }),
      LeaveRequest.deleteMany({ employee: employee._id }),
    ]);

    return res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error('Error deleting employee (admin):', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * ---------- DASHBOARD SUMMARY (ADMIN) ----------
 * GET /api/admin/dashboard-summary
 */
router.get('/dashboard-summary', protect, requireRole('admin'), async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalEmployees,
      presentDocs,
      pendingLeaves,
      approvedThisMonth,
      leaveOutcomeStats,
      recentEmployees,
    ] =
      await Promise.all([
        Employee.countDocuments({ status: 'active' }),
        Attendance.distinct('employee', {
          date: { $gte: startOfToday, $lte: endOfToday },
          status: { $in: ['Present', 'WFH'] },
        }),
        LeaveRequest.countDocuments({ status: 'Pending' }),
        LeaveRequest.countDocuments({
          status: 'Approved',
          approvedAt: { $gte: startOfMonth },
        }),
        LeaveRequest.aggregate([
          {
            $match: {
              status: { $in: ['Approved', 'Rejected'] },
            },
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
        Employee.find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .select('employeeId firstName lastName email department designation status createdAt'),
      ]);

    const presentToday = presentDocs.length;
    const attendanceRate =
      totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

    const approvedCount =
      leaveOutcomeStats.find((x) => x._id === 'Approved')?.count || 0;
    const rejectedCount =
      leaveOutcomeStats.find((x) => x._id === 'Rejected')?.count || 0;
    const leaveApprovalRate =
      approvedCount + rejectedCount > 0
        ? Math.round((approvedCount / (approvedCount + rejectedCount)) * 100)
        : 0;

    res.json({
      data: {
        totalEmployees,
        presentToday,
        pendingLeaves,
        approvedLeaves: approvedThisMonth,
        attendanceRate,
        leaveApprovalRate,
        generatedAt: new Date(),
        recentEmployees,
      },
    });
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * ---------- ATTENDANCE (ADMIN) ----------
 */
// GET /api/admin/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD&employeeId=EMP-123
router.get('/attendance', protect, requireRole('admin'), async (req, res) => {
  try {
    const { from, to, employeeId } = req.query;
    const fromDate = from ? startOfDay(from) : startOfDay(new Date());
    const toDate = to ? endOfDay(to) : endOfDay(fromDate);
    const isSingleDay =
      fromDate.getTime() === startOfDay(toDate).getTime();

    // Single day view: show all employees with Present/Absent state.
    if (isSingleDay) {
      const employeeFilter = { status: 'active' };
      if (employeeId) {
        employeeFilter.employeeId = employeeId;
      }

      const employees = await Employee.find(employeeFilter)
        .select('employeeId firstName lastName email')
        .sort({ firstName: 1, lastName: 1 });

      if (!employees.length) {
        return res.json({ data: [] });
      }

      const employeeIds = employees.map((e) => e._id);
      const dayRecords = await Attendance.find({
        employee: { $in: employeeIds },
        date: { $gte: fromDate, $lte: toDate },
      }).sort({ createdAt: -1 });

      const byEmployee = new Map();
      for (const rec of dayRecords) {
        const key = String(rec.employee);
        if (!byEmployee.has(key)) byEmployee.set(key, rec);
      }

      const rows = employees.map((emp) => {
        const rec = byEmployee.get(String(emp._id));
        const present = !!rec && ['Present', 'WFH'].includes(rec.status || 'Present');

        return {
          _id: rec?._id || `absent-${emp._id}-${fromDate.toISOString()}`,
          date: fromDate,
          checkIn: rec?.checkIn || null,
          checkOut: rec?.checkOut || null,
          status: present ? (rec.status || 'Present') : 'Absent',
          employee: {
            _id: emp._id,
            employeeId: emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
          },
        };
      });

      return res.json({ data: rows });
    }

    // Range view: keep historical attendance records only.
    const filter = {
      date: { $gte: fromDate, $lte: toDate },
    };

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

    return res.json({ data: records });
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

/**
 * ---------- ANNOUNCEMENTS (ADMIN CRUD) ----------
 */
router.get('/announcements', protect, requireRole('admin'), async (req, res) => {
  try {
    const data = await Announcement.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ data });
  } catch (err) {
    console.error('Error loading announcements:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/announcements', protect, requireRole('admin'), async (req, res) => {
  try {
    const { title, content, type = 'General', audience = 'All', effectiveFrom, effectiveTo } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const created = await Announcement.create({
      title: String(title).trim(),
      content: String(content).trim(),
      type,
      audience,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
      createdBy: req.user._id,
    });

    return res.status(201).json({ message: 'Announcement created', data: created });
  } catch (err) {
    console.error('Error creating announcement:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/announcements/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid announcement id' });
    }

    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    return res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * ---------- ANALYTICS (ADMIN) ----------
 */
router.get('/analytics', protect, requireRole('admin'), async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);

    const [activeEmployees, totalEmployees, todayPresentDocs, leaveStats] = await Promise.all([
      Employee.countDocuments({ status: 'active' }),
      Employee.countDocuments({}),
      Attendance.distinct('employee', {
        date: { $gte: startOfToday, $lte: endOfToday },
        status: { $in: ['Present', 'WFH'] },
      }),
      LeaveRequest.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const pending = leaveStats.find((x) => x._id === 'Pending')?.count || 0;
    const approved = leaveStats.find((x) => x._id === 'Approved')?.count || 0;
    const rejected = leaveStats.find((x) => x._id === 'Rejected')?.count || 0;

    return res.json({
      data: {
        activeEmployees,
        totalEmployees,
        presentToday: todayPresentDocs.length,
        attendanceRate: activeEmployees ? Math.round((todayPresentDocs.length / activeEmployees) * 100) : 0,
        leave: { pending, approved, rejected },
        generatedAt: now,
      },
    });
  } catch (err) {
    console.error('Error loading analytics:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
