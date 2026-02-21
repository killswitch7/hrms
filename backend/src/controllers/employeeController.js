// controllers/employeeController.js
// This controller now has only employee-side logic.
// Admin CRUD/dashboard logic was moved to adminController.js

const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const Holiday = require('../models/Holiday');

function splitName(fullName = '') {
  // Split full name into first and last name
  const trimmed = String(fullName).trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const parts = trimmed.split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}

function normalizeDate(input = new Date()) {
  // Keep only date part (00:00:00 time)
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

// If employee profile does not exist, we create it automatically.
async function getOrCreateEmployeeForUser(user) {
  // Try to find employee profile
  let employee = await Employee.findOne({ user: user._id });
  if (employee) return employee;

  // If not found, create a basic profile
  const firstName = user.name || user.email.split('@')[0] || 'Employee';
  employee = await Employee.create({
    user: user._id,
    employeeId: `EMP-${Date.now()}`,
    firstName,
    lastName: '',
    email: user.email,
    status: 'active',
  });
  return employee;
}

// ---------------- EMPLOYEE DASHBOARD ----------------

async function getEmployeeDashboardSummary(req, res) {
  try {
    // Ensure profile exists
    const employee = await getOrCreateEmployeeForUser(req.user);

    // Dates used for today/month/year calculations
    const now = new Date();
    const startOfToday = normalizeDate(now);
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // Fetch all needed data in parallel
    const [todayRecord, monthAttendanceDays, approvedLeaves, announcements] = await Promise.all([
      Attendance.findOne({
        employee: employee._id,
        date: { $gte: startOfToday, $lte: endOfToday },
      }).sort({ createdAt: -1 }),
      Attendance.countDocuments({
        employee: employee._id,
        date: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $in: ['Present', 'WFH'] },
      }),
      LeaveRequest.find({
        employee: employee._id,
        type: { $ne: 'WFH' },
        status: 'Approved',
        from: { $lte: endOfYear },
        to: { $gte: startOfYear },
      }).select('from to'),
      Announcement.find({
        audience: { $in: ['All', 'Employees'] },
        $and: [
          { $or: [{ effectiveFrom: { $exists: false } }, { effectiveFrom: null }, { effectiveFrom: { $lte: now } }] },
          { $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: now } }] },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('title content createdAt'),
    ]);

    // Basic leave balance logic
    const annualAllowance = 24;
    const usedLeaveDays = approvedLeaves.reduce((sum, leave) => {
      const from = normalizeDate(leave.from);
      const to = normalizeDate(leave.to);
      const diff = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
      return sum + (diff > 0 ? diff : 0);
    }, 0);
    const leaveBalance = Math.max(0, annualAllowance - usedLeaveDays);

    // Build today's attendance text
    let todayStatus = 'Not Checked In';
    let checkTime = null;
    if (todayRecord?.checkOut) {
      todayStatus = 'Checked Out';
      checkTime = todayRecord.checkOut;
    } else if (todayRecord?.checkIn) {
      todayStatus = 'Checked In';
      checkTime = todayRecord.checkIn;
    }

    // First take announcements
    let noticeItems = announcements.map((item) => ({
      id: item._id,
      title: item.title,
      content: item.content,
      createdAt: item.createdAt,
    }));

    // If less than 3 notices, add upcoming holidays
    if (noticeItems.length < 3) {
      const holidays = await Holiday.find({ date: { $gte: startOfToday } })
        .sort({ date: 1 })
        .limit(3 - noticeItems.length)
        .select('name date');

      noticeItems = noticeItems.concat(
        holidays.map((h) => ({
          id: h._id,
          title: 'Holiday Notice',
          content: `${h.name} on ${new Date(h.date).toDateString()}`,
          createdAt: h.date,
        }))
      );
    }

    return res.json({
      data: {
        userProfile: {
          name: req.user.name || `${employee.firstName} ${employee.lastName}`.trim(),
          position: employee.designation || 'Employee',
          email: employee.email,
        },
        stats: {
          leaveBalance,
          attendance: monthAttendanceDays,
          notifications: noticeItems.length,
        },
        todayAttendance: {
          status: todayStatus,
          time: checkTime,
          checkIn: todayRecord?.checkIn || null,
          checkOut: todayRecord?.checkOut || null,
        },
        announcements: noticeItems,
      },
    });
  } catch (err) {
    console.error('getEmployeeDashboardSummary error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  splitName,
  normalizeDate,
  getOrCreateEmployeeForUser,
  getEmployeeDashboardSummary,
};
