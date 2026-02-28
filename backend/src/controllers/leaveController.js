// controllers/leaveController.js
// Simple leave controller:
// - Employee can create and see own leave
// - Manager leave requests go to admin for approval

const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { getOrCreateEmployeeForUser } = require('./employeeController');

// Get employee profile ids for users with a given role
async function getEmployeeIdsByUserRole(role) {
  const userIds = await User.find({ role }).distinct('_id');
  const employeeIds = await Employee.find({ user: { $in: userIds } }).distinct('_id');
  return employeeIds;
}

// Employee/Manager: create normal leave (not WFH)
async function createLeave(req, res) {
  try {
    const { from, to, reason, type } = req.body;
    if (!from || !to) return res.status(400).json({ message: 'From and To dates are required' });

    const leaveType = type || 'Annual';
    if (leaveType === 'WFH') {
      return res.status(400).json({ message: 'Use /wfh endpoint for Work From Home requests' });
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

    return res.status(201).json({ message: 'Leave request submitted', data: leaveReq });
  } catch (err) {
    console.error('createLeave error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Employee/Manager: get own leave requests
async function getMyLeave(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const { type } = req.query;
    const filter = { employee: employee._id, type: { $ne: 'WFH' } };
    if (type) filter.type = type;

    const data = await LeaveRequest.find(filter).sort({ createdAt: -1 });
    return res.json({ data });
  } catch (err) {
    console.error('getMyLeave error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Admin: list manager leave requests only
async function getAdminLeaveRequests(req, res) {
  try {
    const { status, search = '', from = '', to = '' } = req.query;
    // Admin should only review manager requests
    const managerEmployeeIds = await getEmployeeIdsByUserRole('manager');
    const filter = { type: { $ne: 'WFH' }, employee: { $in: managerEmployeeIds } };
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }
    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      const employees = await Employee.find({
        _id: { $in: managerEmployeeIds },
        $or: [{ employeeId: regex }, { firstName: regex }, { lastName: regex }, { email: regex }],
      }).select('_id');
      filter.employee = { $in: employees.map((e) => e._id) };
    }

    const data = await LeaveRequest.find(filter)
      .populate('employee', 'employeeId firstName lastName email')
      .sort({ createdAt: -1 });

    return res.json({ data });
  } catch (err) {
    console.error('getAdminLeaveRequests error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function approveLeave(req, res) {
  try {
    const request = await LeaveRequest.findOne({ _id: req.params.id, type: { $ne: 'WFH' } }).populate(
      'employee',
      'user'
    );
    if (!request) return res.status(404).json({ message: 'Leave request not found' });

    // Check who created this leave
    const owner = await User.findById(request.employee?.user).select('role');
    if (owner?.role !== 'manager') {
      return res.status(403).json({ message: 'Admin can approve only manager leave requests.' });
    }

    request.status = 'Approved';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();
    const updated = request;
    return res.json({ message: 'Leave approved', data: updated });
  } catch (err) {
    console.error('approveLeave error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function rejectLeave(req, res) {
  try {
    const request = await LeaveRequest.findOne({ _id: req.params.id, type: { $ne: 'WFH' } }).populate(
      'employee',
      'user'
    );
    if (!request) return res.status(404).json({ message: 'Leave request not found' });

    // Check who created this leave
    const owner = await User.findById(request.employee?.user).select('role');
    if (owner?.role !== 'manager') {
      return res.status(403).json({ message: 'Admin can reject only manager leave requests.' });
    }

    request.status = 'Rejected';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();
    const updated = request;
    return res.json({ message: 'Leave rejected', data: updated });
  } catch (err) {
    console.error('rejectLeave error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createLeave,
  getMyLeave,
  getAdminLeaveRequests,
  approveLeave,
  rejectLeave,
};
