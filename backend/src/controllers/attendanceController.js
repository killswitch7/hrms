// controllers/attendanceController.js
// Attendance logic for both admin and employee routes.

const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { getOrCreateEmployeeForUser, normalizeDate } = require('./employeeController');

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

// Admin: attendance table and day-wise present/absent list.
async function getAdminAttendance(req, res) {
  try {
    const { from, to, employeeId } = req.query;
    const fromDate = from ? startOfDay(from) : startOfDay(new Date());
    const toDate = to ? endOfDay(to) : endOfDay(fromDate);
    const isSingleDay = fromDate.getTime() === startOfDay(toDate).getTime();

    if (isSingleDay) {
      const employeeFilter = { status: 'active' };
      if (employeeId) employeeFilter.employeeId = employeeId;

      const employees = await Employee.find(employeeFilter)
        .select('employeeId firstName lastName email')
        .sort({ firstName: 1, lastName: 1 });

      if (!employees.length) return res.json({ data: [] });

      const dayRecords = await Attendance.find({
        employee: { $in: employees.map((e) => e._id) },
        date: { $gte: fromDate, $lte: toDate },
      }).sort({ createdAt: -1 });

      const byEmployee = new Map();
      dayRecords.forEach((rec) => {
        const key = String(rec.employee);
        if (!byEmployee.has(key)) byEmployee.set(key, rec);
      });

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

    const filter = { date: { $gte: fromDate, $lte: toDate } };
    if (employeeId) {
      const employee = await Employee.findOne({ employeeId });
      if (!employee) return res.json({ data: [] });
      filter.employee = employee._id;
    }

    const records = await Attendance.find(filter)
      .populate('employee', 'employeeId firstName lastName email')
      .sort({ date: -1 });

    return res.json({ data: records });
  } catch (err) {
    console.error('getAdminAttendance error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Employee: check in.
async function checkIn(req, res) {
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

    return res.status(201).json({ message: 'Checked in successfully', data: record });
  } catch (err) {
    console.error('checkIn error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Employee: check out.
async function checkOut(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const today = normalizeDate(new Date());
    const record = await Attendance.findOne({ employee: employee._id, date: today });

    if (!record || !record.checkIn) {
      return res.status(400).json({ message: 'Cannot check-out before check-in for today' });
    }
    if (record.checkOut) {
      return res.status(400).json({ message: 'Already checked out for today' });
    }

    record.checkOut = new Date();
    await record.save();
    return res.json({ message: 'Checked out successfully', data: record });
  } catch (err) {
    console.error('checkOut error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Employee: get own attendance history.
async function getMyAttendance(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const { from, to } = req.query;

    let fromDate = from ? normalizeDate(new Date(from)) : normalizeDate(new Date());
    if (!from) fromDate.setDate(fromDate.getDate() - 30);

    let toDate = to ? normalizeDate(new Date(to)) : normalizeDate(new Date());
    toDate.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      employee: employee._id,
      date: { $gte: fromDate, $lte: toDate },
    }).sort({ date: -1 });

    return res.json({ data: records });
  } catch (err) {
    console.error('getMyAttendance error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getAdminAttendance,
  checkIn,
  checkOut,
  getMyAttendance,
};
