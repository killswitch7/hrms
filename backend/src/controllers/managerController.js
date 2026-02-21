// controllers/managerController.js
// Manager controller:
// - Manager can see only own department data
// - Manager can approve/reject employee leave and WFH in same department

const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const { normalizeDate } = require('./employeeController');

// Start of day helper (00:00:00)
function startOfDay(input = new Date()) {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

// End of day helper (23:59:59)
function endOfDay(input = new Date()) {
  const d = new Date(input);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Find manager department from manager profile
async function getManagerDepartment(userId) {
  const profile = await Employee.findOne({ user: userId }).select('department');
  const department = String(profile?.department || '').trim();
  return department;
}

// Get employee profile ids in a department.
// Optional: filter by user role like employee/manager.
async function getDepartmentEmployeeIds(department, role = '') {
  if (!department) return [];
  const filter = { department };
  if (role) {
    const userIds = await User.find({ role }).distinct('_id');
    filter.user = { $in: userIds };
  }
  const employees = await Employee.find(filter).select('_id');
  return employees.map((e) => e._id);
}

// Nice label for UI
function roleLabel(role) {
  return role === 'manager' ? 'Manager' : role === 'admin' ? 'Admin' : 'Employee';
}

async function ping(req, res) {
  return res.json({ message: 'Manager route working' });
}

async function dashboardSummary(req, res) {
  try {
    // Manager must have department
    const department = await getManagerDepartment(req.user._id);
    if (!department) return res.status(400).json({ message: 'Manager department not set.' });

    const employeeIds = await getDepartmentEmployeeIds(department);
    // Date range for daily/monthly stats
    const startToday = startOfDay(new Date());
    const endToday = endOfDay(new Date());
    const startMonth = new Date();
    startMonth.setDate(1);
    startMonth.setHours(0, 0, 0, 0);

    // Load stats in parallel
    const [totalEmployees, presentDocs, pendingLeaves, approvedThisMonth, leaveOutcomeStats, recentEmployees] =
      await Promise.all([
        Employee.countDocuments({ department, status: 'active' }),
        Attendance.distinct('employee', {
          employee: { $in: employeeIds },
          date: { $gte: startToday, $lte: endToday },
          status: { $in: ['Present', 'WFH'] },
        }),
        LeaveRequest.countDocuments({ employee: { $in: employeeIds }, status: 'Pending' }),
        LeaveRequest.countDocuments({
          employee: { $in: employeeIds },
          status: 'Approved',
          approvedAt: { $gte: startMonth },
        }),
        LeaveRequest.aggregate([
          { $match: { employee: { $in: employeeIds }, status: { $in: ['Approved', 'Rejected'] } } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Employee.find({ department })
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
        department,
        managerRole: roleLabel(req.user.role),
        generatedAt: new Date(),
        recentEmployees,
      },
    });
  } catch (err) {
    console.error('manager dashboardSummary error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getEmployees(req, res) {
  try {
    // Manager can only see same department
    const department = await getManagerDepartment(req.user._id);
    if (!department) return res.status(400).json({ message: 'Manager department not set.' });

    // Read filters from query
    const { search = '', status = '', role = '', department: departmentFilter = '', page = '1', limit = '20' } = req.query;
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    // Build mongo filter
    const filter = { department };
    if (departmentFilter && String(departmentFilter).trim() !== department) {
      return res.json({
        data: [],
        pagination: { page: 1, limit: safeLimit, total: 0, pages: 1 },
      });
    }
    if (status && ['active', 'inactive'].includes(String(status))) filter.status = status;
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
    if (role && ['employee', 'manager'].includes(String(role))) {
      const roleUserIds = await User.find({ role }).distinct('_id');
      filter.user = { $in: roleUserIds };
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
    console.error('manager getEmployees error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getAttendance(req, res) {
  try {
    // Manager can only see same department attendance
    const department = await getManagerDepartment(req.user._id);
    if (!department) return res.status(400).json({ message: 'Manager department not set.' });

    // Read date + optional filters
    const { from, to, employeeId, status = '' } = req.query;
    const fromDate = from ? startOfDay(from) : startOfDay(new Date());
    const toDate = to ? endOfDay(to) : endOfDay(fromDate);
    const isSingleDay = fromDate.getTime() === startOfDay(toDate).getTime();

    const employeeFilter = { department, status: 'active' };
    if (employeeId) employeeFilter.employeeId = employeeId;
    const employees = await Employee.find(employeeFilter)
      .select('employeeId firstName lastName email department')
      .sort({ firstName: 1, lastName: 1 });
    if (!employees.length) return res.json({ data: [] });

    const employeeIds = employees.map((e) => e._id);

    // For one day: also show absent employees
    if (isSingleDay) {
      const dayRecords = await Attendance.find({
        employee: { $in: employeeIds },
        date: { $gte: fromDate, $lte: toDate },
      }).sort({ createdAt: -1 });

      const byEmployee = new Map();
      dayRecords.forEach((rec) => {
        const key = String(rec.employee);
        if (!byEmployee.has(key)) byEmployee.set(key, rec);
      });

      // One row per employee
      let rows = employees.map((emp) => {
        const rec = byEmployee.get(String(emp._id));
        const rowStatus = rec ? rec.status || 'Present' : 'Absent';
        return {
          _id: rec?._id || `absent-${emp._id}-${fromDate.toISOString()}`,
          date: fromDate,
          checkIn: rec?.checkIn || null,
          checkOut: rec?.checkOut || null,
          status: rowStatus,
          employee: {
            _id: emp._id,
            employeeId: emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            department: emp.department,
          },
        };
      });

      if (status) {
        rows = rows.filter((r) => String(r.status).toLowerCase() === String(status).toLowerCase());
      }
      return res.json({ data: rows });
    }

    const filter = {
      employee: { $in: employeeIds },
      date: { $gte: fromDate, $lte: toDate },
    };
    if (status) filter.status = status;

    const data = await Attendance.find(filter)
      .populate('employee', 'employeeId firstName lastName email department')
      .sort({ date: -1 });

    return res.json({ data });
  } catch (err) {
    console.error('manager getAttendance error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getLeaveRequests(req, res) {
  try {
    // Leave list for same department employees only
    const department = await getManagerDepartment(req.user._id);
    if (!department) return res.status(400).json({ message: 'Manager department not set.' });

    const { status, search = '' } = req.query;
    const deptEmployeeIds = await getDepartmentEmployeeIds(department, 'employee');
    let employeeIds = deptEmployeeIds;

    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      const searchEmployees = await Employee.find({
        _id: { $in: deptEmployeeIds },
        $or: [{ employeeId: regex }, { firstName: regex }, { lastName: regex }, { email: regex }],
      }).select('_id');
      employeeIds = searchEmployees.map((e) => e._id);
    }

    const filter = { type: { $ne: 'WFH' }, employee: { $in: employeeIds } };
    if (status) filter.status = status;

    const data = await LeaveRequest.find(filter)
      .populate('employee', 'employeeId firstName lastName email department')
      .sort({ createdAt: -1 });
    return res.json({ data });
  } catch (err) {
    console.error('manager getLeaveRequests error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getWfhRequests(req, res) {
  try {
    // WFH list for same department employees only
    const department = await getManagerDepartment(req.user._id);
    if (!department) return res.status(400).json({ message: 'Manager department not set.' });

    const { status, search = '' } = req.query;
    const deptEmployeeIds = await getDepartmentEmployeeIds(department, 'employee');
    let employeeIds = deptEmployeeIds;

    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      const searchEmployees = await Employee.find({
        _id: { $in: deptEmployeeIds },
        $or: [{ employeeId: regex }, { firstName: regex }, { lastName: regex }, { email: regex }],
      }).select('_id');
      employeeIds = searchEmployees.map((e) => e._id);
    }

    const filter = { type: 'WFH', employee: { $in: employeeIds } };
    if (status) filter.status = status;

    const data = await LeaveRequest.find(filter)
      .populate('employee', 'employeeId firstName lastName email department')
      .sort({ createdAt: -1 });
    return res.json({ data });
  } catch (err) {
    console.error('manager getWfhRequests error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function approveLeave(req, res) {
  try {
    // Validate id first
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid leave request id' });
    }
    const department = await getManagerDepartment(req.user._id);
    if (!department) return res.status(400).json({ message: 'Manager department not set.' });

    const request = await LeaveRequest.findOne({ _id: req.params.id, type: { $ne: 'WFH' } }).populate('employee');
    if (!request) return res.status(404).json({ message: 'Leave request not found' });
    // Only same department allowed
    if (String(request.employee?.department || '') !== department) {
      return res.status(403).json({ message: 'You can only manage your own department requests.' });
    }
    // Manager can approve only employee requests (not manager/admin)
    const owner = await User.findById(request.employee?.user).select('role');
    if (owner?.role !== 'employee') {
      return res.status(403).json({ message: 'Manager can approve only employee leave requests.' });
    }

    request.status = 'Approved';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();
    return res.json({ message: 'Leave approved', data: request });
  } catch (err) {
    console.error('manager approveLeave error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function rejectLeave(req, res) {
  try {
    // Validate id first
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid leave request id' });
    }
    const department = await getManagerDepartment(req.user._id);
    if (!department) return res.status(400).json({ message: 'Manager department not set.' });

    const request = await LeaveRequest.findOne({ _id: req.params.id, type: { $ne: 'WFH' } }).populate('employee');
    if (!request) return res.status(404).json({ message: 'Leave request not found' });
    // Only same department allowed
    if (String(request.employee?.department || '') !== department) {
      return res.status(403).json({ message: 'You can only manage your own department requests.' });
    }
    // Manager can reject only employee requests
    const owner = await User.findById(request.employee?.user).select('role');
    if (owner?.role !== 'employee') {
      return res.status(403).json({ message: 'Manager can reject only employee leave requests.' });
    }

    request.status = 'Rejected';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();
    return res.json({ message: 'Leave rejected', data: request });
  } catch (err) {
    console.error('manager rejectLeave error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function approveWfh(req, res) {
  try {
    // Validate id first
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid WFH request id' });
    }
    const department = await getManagerDepartment(req.user._id);
    if (!department) return res.status(400).json({ message: 'Manager department not set.' });

    const request = await LeaveRequest.findOne({ _id: req.params.id, type: 'WFH' }).populate('employee');
    if (!request) return res.status(404).json({ message: 'WFH request not found' });
    // Only same department allowed
    if (String(request.employee?.department || '') !== department) {
      return res.status(403).json({ message: 'You can only manage your own department requests.' });
    }
    // Manager can approve only employee requests
    const owner = await User.findById(request.employee?.user).select('role');
    if (owner?.role !== 'employee') {
      return res.status(403).json({ message: 'Manager can approve only employee WFH requests.' });
    }

    request.status = 'Approved';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();
    return res.json({ message: 'WFH approved', data: request });
  } catch (err) {
    console.error('manager approveWfh error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function rejectWfh(req, res) {
  try {
    // Validate id first
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid WFH request id' });
    }
    const department = await getManagerDepartment(req.user._id);
    if (!department) return res.status(400).json({ message: 'Manager department not set.' });

    const request = await LeaveRequest.findOne({ _id: req.params.id, type: 'WFH' }).populate('employee');
    if (!request) return res.status(404).json({ message: 'WFH request not found' });
    // Only same department allowed
    if (String(request.employee?.department || '') !== department) {
      return res.status(403).json({ message: 'You can only manage your own department requests.' });
    }
    // Manager can reject only employee requests
    const owner = await User.findById(request.employee?.user).select('role');
    if (owner?.role !== 'employee') {
      return res.status(403).json({ message: 'Manager can reject only employee WFH requests.' });
    }

    request.status = 'Rejected';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();
    return res.json({ message: 'WFH rejected', data: request });
  } catch (err) {
    console.error('manager rejectWfh error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  ping,
  dashboardSummary,
  getEmployees,
  getAttendance,
  getLeaveRequests,
  approveLeave,
  rejectLeave,
  getWfhRequests,
  approveWfh,
  rejectWfh,
};
