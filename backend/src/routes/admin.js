// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();

const { protect, requireRole } = require('../middleware/auth');
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');

// All admin routes require admin user
router.use(protect);
router.use(requireRole('admin'));

// Simple test route
router.get('/ping', (req, res) => {
  return res.json({ message: 'Admin routes working', user: req.user.email });
});

// ---------- Helper to populate employee info ----------
function baseLeaveQuery(extraFilter = {}) {
  return LeaveRequest.find(extraFilter)
    .populate('employee', 'employeeId firstName lastName email')
    .sort({ createdAt: -1 });
}

// ---------- LEAVE REQUESTS (non-WFH) ----------

// GET /api/admin/leave-requests?status=Pending
router.get('/leave-requests', async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { type: { $ne: 'WFH' } }; // exclude WFH
    if (status) {
      filter.status = status;
    }

    const requests = await baseLeaveQuery(filter);

    res.json({ data: requests });
  } catch (err) {
    console.error('Error fetching leave requests (admin):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/leave-requests/:id/approve
router.patch('/leave-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const request = await LeaveRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (request.type === 'WFH') {
      return res.status(400).json({ message: 'This is a WFH request, use /wfh-requests endpoints' });
    }

    request.status = 'Approved';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();

    await request.save();

    res.json({ message: 'Leave request approved', data: request });
  } catch (err) {
    console.error('Error approving leave request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/leave-requests/:id/reject
router.patch('/leave-requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    const request = await LeaveRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (request.type === 'WFH') {
      return res.status(400).json({ message: 'This is a WFH request, use /wfh-requests endpoints' });
    }

    request.status = 'Rejected';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();

    await request.save();

    res.json({ message: 'Leave request rejected', data: request });
  } catch (err) {
    console.error('Error rejecting leave request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- WFH REQUESTS ----------

// GET /api/admin/wfh-requests?status=Pending
router.get('/wfh-requests', async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { type: 'WFH' };
    if (status) {
      filter.status = status;
    }

    const requests = await baseLeaveQuery(filter);

    res.json({ data: requests });
  } catch (err) {
    console.error('Error fetching WFH requests (admin):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/wfh-requests/:id/approve
router.patch('/wfh-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const request = await LeaveRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'WFH request not found' });
    }

    if (request.type !== 'WFH') {
      return res.status(400).json({ message: 'This is not a WFH request' });
    }

    request.status = 'Approved';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();

    await request.save();

    res.json({ message: 'WFH request approved', data: request });
  } catch (err) {
    console.error('Error approving WFH request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/wfh-requests/:id/reject
router.patch('/wfh-requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    const request = await LeaveRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'WFH request not found' });
    }

    if (request.type !== 'WFH') {
      return res.status(400).json({ message: 'This is not a WFH request' });
    }

    request.status = 'Rejected';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();

    await request.save();

    res.json({ message: 'WFH request rejected', data: request });
  } catch (err) {
    console.error('Error rejecting WFH request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
