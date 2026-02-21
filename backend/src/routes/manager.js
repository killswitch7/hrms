// routes/manager.js
// Manager routes:
// 1) Team management (same department only)
// 2) Personal pages (attendance + leave + wfh)

const express = require('express');
const { protect, requireRole } = require('../middleware/auth');
const {
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
} = require('../controllers/managerController');
const { employeeAttendanceRouter } = require('./attendanceRoutes');
const { employeeLeaveRouter } = require('./leaveRoutes');
const { employeeWfhRouter } = require('./wfhRoutes');

const router = express.Router();

router.get('/ping', ping);

router.use(protect);
router.use(requireRole('manager'));

router.get('/dashboard-summary', dashboardSummary);
router.get('/employees', getEmployees);
router.get('/attendance', getAttendance);
router.use('/my-attendance', employeeAttendanceRouter);
router.use('/my-leave', employeeLeaveRouter);
router.use('/my-wfh', employeeWfhRouter);

router.get('/leave-requests', getLeaveRequests);
router.patch('/leave-requests/:id/approve', approveLeave);
router.patch('/leave-requests/:id/reject', rejectLeave);

router.get('/wfh-requests', getWfhRequests);
router.patch('/wfh-requests/:id/approve', approveWfh);
router.patch('/wfh-requests/:id/reject', rejectWfh);

module.exports = router;
