// controllers/wfhController.js
// WFH APIs for employee and admin.

const LeaveRequest = require('../models/LeaveRequest');
const { getOrCreateEmployeeForUser } = require('./employeeController');

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
    const { status } = req.query;
    const filter = { type: 'WFH' };
    if (status) filter.status = status;

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
    const updated = await LeaveRequest.findOneAndUpdate(
      { _id: req.params.id, type: 'WFH' },
      { status: 'Approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'WFH request not found' });
    return res.json({ message: 'WFH approved', data: updated });
  } catch (err) {
    console.error('approveWfh error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function rejectWfh(req, res) {
  try {
    const updated = await LeaveRequest.findOneAndUpdate(
      { _id: req.params.id, type: 'WFH' },
      { status: 'Rejected', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'WFH request not found' });
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
