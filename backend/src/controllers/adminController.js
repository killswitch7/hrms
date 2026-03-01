// controllers/adminController.js
// Admin controller has only admin work. Kept simple for easy understanding.

const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Payroll = require('../models/Payroll');
const { splitName, normalizeDate } = require('./employeeController');

function ping(req, res) {
  return res.json({ message: 'Admin route working' });
}

// ---------------- Employee CRUD (admin only) ----------------

async function createEmployee(req, res) {
  try {
    // Read form data from frontend
    const {
      name,
      email,
      password,
      department,
      position,
      role = 'employee',
      annualSalary = 0,
      filingStatus = 'unmarried',
    } = req.body;
    const normalizedRole = String(role).trim().toLowerCase();
    const safeAnnualSalary = Math.max(0, Number(annualSalary) || 0);
    const safeFilingStatus = String(filingStatus) === 'married' ? 'married' : 'unmarried';

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (!['employee', 'manager'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Role must be employee or manager.' });
    }
    if (!safeAnnualSalary) {
      return res.status(400).json({ message: 'Annual salary is required.' });
    }
    if (normalizedRole === 'manager' && !String(department || '').trim()) {
      return res.status(400).json({ message: 'Department is required for manager role.' });
    }

    // Email should be unique
    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    // Create user login account
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: normalizedRole,
    });

    // Create employee profile linked to user account
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
      annualSalary: safeAnnualSalary,
      filingStatus: safeFilingStatus,
      baseSalary: Math.round(safeAnnualSalary / 12),
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
    // Read filters from query params
    const { search = '', status = '', role = '', department = '', page = '1', limit = '20' } = req.query;
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    // Build mongo filter object
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

    // Get existing employee profile
    const employee = await Employee.findById(req.params.id).populate('user');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Update fields only if value is sent
    const { name, email, department, designation, status, phone, annualSalary, filingStatus, role } = req.body;

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
    if (annualSalary !== undefined) {
      const safeAnnualSalary = Math.max(0, Number(annualSalary) || 0);
      employee.annualSalary = safeAnnualSalary;
      employee.baseSalary = Math.round(safeAnnualSalary / 12);
    }
    if (filingStatus !== undefined) {
      employee.filingStatus = String(filingStatus) === 'married' ? 'married' : 'unmarried';
    }

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

    // Save profile + user model
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

// ---------------- Employee profile view (admin only) ----------------

async function getEmployeeProfile(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid employee id' });
    }

    const employee = await Employee.findById(req.params.id).populate('user', 'name email role');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const approvedLeaves = await LeaveRequest.find({
      employee: employee._id,
      type: { $ne: 'WFH' },
      status: 'Approved',
      from: { $lte: endOfYear },
      to: { $gte: startOfYear },
    }).select('from to');

    const annualAllowance = 24;
    const usedLeaveDays = approvedLeaves.reduce((sum, leave) => {
      const from = normalizeDate(leave.from);
      const to = normalizeDate(leave.to);
      const diff = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
      return sum + (diff > 0 ? diff : 0);
    }, 0);

    const latestPayroll = await Payroll.findOne({ employee: employee._id }).sort({ month: -1, createdAt: -1 });
    const annualSalary = Number(employee.annualSalary || 0) || Math.round(Number(employee.baseSalary || 0) * 12);

    return res.json({
      data: {
        _id: employee._id,
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
        email: employee.email,
        role: employee.user?.role || 'employee',
        employeeId: employee.employeeId,
        department: employee.department || 'N/A',
        designation: employee.designation || 'N/A',
        phone: employee.phone || '',
        status: employee.status,
        joinDate: employee.joinDate || employee.createdAt,
        salary: {
          annualSalary,
          monthlyBeforeTax: Math.round(annualSalary / 12),
          filingStatus: employee.filingStatus || 'unmarried',
          latestPayroll: latestPayroll
            ? {
                month: latestPayroll.month,
                grossPay: latestPayroll.grossPay || 0,
                taxDeduction: latestPayroll.taxDeduction || 0,
                deductions: latestPayroll.deductions || 0,
                netPay: latestPayroll.netPay || 0,
                status: latestPayroll.status || 'Processed',
              }
            : null,
        },
        leave: {
          annualAllowance,
          used: usedLeaveDays,
          remaining: Math.max(0, annualAllowance - usedLeaveDays),
        },
      },
    });
  } catch (err) {
    console.error('getEmployeeProfile error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ---------------- Dashboard / analytics ----------------

async function dashboardSummary(req, res) {
  try {
    // Build dates for today and this month
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
    // Build dates for month stats
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
  getEmployeeProfile,
  updateEmployee,
  deleteEmployee,
  dashboardSummary,
  analytics,
};
