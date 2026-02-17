// controllers/leaveController.js
// Leave APIs for employee and admin.

const LeaveRequest = require('../models/LeaveRequest');
const { getOrCreateEmployeeForUser } = require('./employeeController');

// Employee: create normal leave (not WFH).
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

// Employee: get own leave requests.
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

// Admin: list leave requests.
async function getAdminLeaveRequests(req, res) {
  try {
    const { status } = req.query;
    const filter = { type: { $ne: 'WFH' } };
    if (status) filter.status = status;

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
    const updated = await LeaveRequest.findOneAndUpdate(
      { _id: req.params.id, type: { $ne: 'WFH' } },
      { status: 'Approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Leave request not found' });
    return res.json({ message: 'Leave approved', data: updated });
  } catch (err) {
    console.error('approveLeave error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function rejectLeave(req, res) {
  try {
    const updated = await LeaveRequest.findOneAndUpdate(
      { _id: req.params.id, type: { $ne: 'WFH' } },
      { status: 'Rejected', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Leave request not found' });
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
