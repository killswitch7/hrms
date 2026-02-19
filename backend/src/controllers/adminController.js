// controllers/adminController.js
// Admin controller has only admin work. Kept simple for easy understanding.

const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const { splitName, normalizeDate } = require('./employeeController');

function ping(req, res) {
  return res.json({ message: 'Admin route working' });
}

// ---------------- EMPLOYEE CRUD (ADMIN) ----------------

async function createEmployee(req, res) {
  try {
    const { name, email, password, department, position, role = 'employee' } = req.body;
    const normalizedRole = String(role).trim().toLowerCase();
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (!['employee', 'manager'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Role must be employee or manager.' });
    }
    if (normalizedRole === 'manager' && !String(department || '').trim()) {
      return res.status(400).json({ message: 'Department is required for manager role.' });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: normalizedRole,
    });

    const { firstName, lastName } = splitName(name);
    const employee = await Employee.create({
      user: user._id,
      employeeId: `EMP-${Date.now()}`,
      firstName: firstName || name,
      lastName,
      email: normalizedEmail,
      department: department || '',
      designation: position || (normalizedRole === 'manager' ? 'Manager' : ''),
      status: 'active',
    });

    return res.status(201).json({
      message: 'Employee registered successfully',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      employee,
    });
  } catch (err) {
    console.error('createEmployee error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate field value', key: err.keyValue });
    }
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getEmployees(req, res) {
  try {
    const { search = '', status = '', role = '', department = '', page = '1', limit = '20' } = req.query;
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const filter = {};
    if (status && ['active', 'inactive'].includes(String(status))) {
      filter.status = status;
    }
    if (department) {
      filter.department = String(department).trim();
    }
    if (role && ['employee', 'manager', 'admin'].includes(String(role))) {
      const userIds = await User.find({ role }).distinct('_id');
      filter.user = { $in: userIds };
    }

    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      filter.$or = [
        { employeeId: regex },
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { department: regex },
        { designation: regex },
      ];
    }

    const [data, total] = await Promise.all([
      Employee.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      Employee.countDocuments(filter),
    ]);

    return res.json({
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.max(Math.ceil(total / safeLimit), 1),
      },
    });
  } catch (err) {
    console.error('getEmployees error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updateEmployee(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid employee id' });
    }

    const employee = await Employee.findById(req.params.id).populate('user');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const { name, email, department, designation, status, phone, baseSalary, role } = req.body;

    if (name !== undefined) {
      const { firstName, lastName } = splitName(name);
      employee.firstName = firstName || employee.firstName;
      employee.lastName = lastName;
      if (employee.user) employee.user.name = String(name).trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const exists = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: employee.user?._id },
      });
      if (exists) return res.status(409).json({ message: 'A user with this email already exists.' });
      employee.email = normalizedEmail;
      if (employee.user) employee.user.email = normalizedEmail;
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
    if (role !== undefined) {
      if (!['employee', 'manager'].includes(String(role))) {
        return res.status(400).json({ message: 'Role must be employee or manager.' });
      }
      if (employee.user) employee.user.role = role;
    }

    const effectiveRole = String(role !== undefined ? role : employee.user?.role || 'employee');
    if (effectiveRole === 'manager' && !String(employee.department || '').trim()) {
      return res.status(400).json({ message: 'Manager must have a department.' });
    }

    await Promise.all([
      employee.save(),
      employee.user ? employee.user.save() : Promise.resolve(),
    ]);

    const updated = await Employee.findById(employee._id).populate('user', 'name email role');
    return res.json({ message: 'Employee updated successfully', data: updated });
  } catch (err) {
    console.error('updateEmployee error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function deleteEmployee(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid employee id' });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    await Promise.all([
      User.findByIdAndDelete(employee.user),
      Employee.findByIdAndDelete(employee._id),
      Attendance.deleteMany({ employee: employee._id }),
      LeaveRequest.deleteMany({ employee: employee._id }),
    ]);

    return res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error('deleteEmployee error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------- DASHBOARD / ANALYTICS ----------------

async function dashboardSummary(req, res) {
  try {
    const startOfToday = normalizeDate(new Date());
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalEmployees, presentDocs, pendingLeaves, approvedThisMonth, leaveOutcomeStats, recentEmployees] =
      await Promise.all([
        Employee.countDocuments({ status: 'active' }),
        Attendance.distinct('employee', {
          date: { $gte: startOfToday, $lte: endOfToday },
          status: { $in: ['Present', 'WFH'] },
        }),
        LeaveRequest.countDocuments({ status: 'Pending' }),
        LeaveRequest.countDocuments({ status: 'Approved', approvedAt: { $gte: startOfMonth } }),
        LeaveRequest.aggregate([
          { $match: { status: { $in: ['Approved', 'Rejected'] } } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Employee.find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .select('employeeId firstName lastName email department designation status createdAt'),
      ]);

    const presentToday = presentDocs.length;
    const attendanceRate = totalEmployees ? Math.round((presentToday / totalEmployees) * 100) : 0;
    const approvedCount = leaveOutcomeStats.find((x) => x._id === 'Approved')?.count || 0;
    const rejectedCount = leaveOutcomeStats.find((x) => x._id === 'Rejected')?.count || 0;
    const leaveApprovalRate =
      approvedCount + rejectedCount ? Math.round((approvedCount / (approvedCount + rejectedCount)) * 100) : 0;

    return res.json({
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
    console.error('dashboardSummary error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function analytics(req, res) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = normalizeDate(now);
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
    console.error('analytics error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  ping,
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  dashboardSummary,
  analytics,
};
