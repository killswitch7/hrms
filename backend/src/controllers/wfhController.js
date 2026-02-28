// controllers/wfhController.js
// Simple WFH controller:
// - Employee can create and see own WFH request
// - Manager WFH requests go to admin for approval

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

async function createWfh(req, res) {
  try {
    const { from, to, reason } = req.body;
    if (!from || !to) return res.status(400).json({ message: 'From and To dates are required' });

    const employee = await getOrCreateEmployeeForUser(req.user);
    const data = await LeaveRequest.create({
      employee: employee._id,
      type: 'WFH',
      from: new Date(from),
      to: new Date(to),
      reason,
      status: 'Pending',
    });

    return res.status(201).json({ message: 'WFH request submitted', data });
  } catch (err) {
    console.error('createWfh error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getMyWfh(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const data = await LeaveRequest.find({ employee: employee._id, type: 'WFH' }).sort({ createdAt: -1 });
    return res.json({ data });
  } catch (err) {
    console.error('getMyWfh error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getAdminWfhRequests(req, res) {
  try {
    const { status, search = '', from = '', to = '' } = req.query;
    // Admin should only review manager requests
    const managerEmployeeIds = await getEmployeeIdsByUserRole('manager');
    const filter = { type: 'WFH', employee: { $in: managerEmployeeIds } };
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
    console.error('getAdminWfhRequests error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function approveWfh(req, res) {
  try {
    const request = await LeaveRequest.findOne({ _id: req.params.id, type: 'WFH' }).populate(
      'employee',
      'user'
    );
    if (!request) return res.status(404).json({ message: 'WFH request not found' });

    // Check who created this WFH request
    const owner = await User.findById(request.employee?.user).select('role');
    if (owner?.role !== 'manager') {
      return res.status(403).json({ message: 'Admin can approve only manager WFH requests.' });
    }

    request.status = 'Approved';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();
    const updated = request;
    return res.json({ message: 'WFH approved', data: updated });
  } catch (err) {
    console.error('approveWfh error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function rejectWfh(req, res) {
  try {
    const request = await LeaveRequest.findOne({ _id: req.params.id, type: 'WFH' }).populate(
      'employee',
      'user'
    );
    if (!request) return res.status(404).json({ message: 'WFH request not found' });

    // Check who created this WFH request
    const owner = await User.findById(request.employee?.user).select('role');
    if (owner?.role !== 'manager') {
      return res.status(403).json({ message: 'Admin can reject only manager WFH requests.' });
    }

    request.status = 'Rejected';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();
    const updated = request;
    return res.json({ message: 'WFH rejected', data: updated });
  } catch (err) {
    console.error('rejectWfh error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createWfh,
  getMyWfh,
  getAdminWfhRequests,
  approveWfh,
  rejectWfh,
};
