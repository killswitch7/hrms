// routes/admin.js
// Main admin router. We keep it small and clean.

const express = require('express');
const router = express.Router();

const { protect, requireRole } = require('../middleware/auth');
const { ping, dashboardSummary, analytics } = require('../controllers/adminController');

const employeeRoutes = require('./employeeRoutes');
const announcementRoutes = require('./announcementRoutes');
const { adminAttendanceRouter } = require('./attendanceRoutes');
const { adminLeaveRouter } = require('./leaveRoutes');
const { adminWfhRouter } = require('./wfhRoutes');
const { adminPayrollRouter } = require('./payrollRoutes');
const { adminHolidayRouter } = require('./holidayRoutes');
const departmentRoutes = require('./departmentRoutes');

// Simple health check.
router.get('/ping', ping);

// All routes below need logged-in admin.
router.use(protect);
router.use(requireRole('admin'));

// Dashboard + analytics
router.get('/dashboard-summary', dashboardSummary);
router.get('/analytics', analytics);

// Feature routes
router.use('/employees', employeeRoutes);
router.use('/attendance', adminAttendanceRouter);
router.use('/leave-requests', adminLeaveRouter);
router.use('/wfh-requests', adminWfhRouter);
router.use('/announcements', announcementRoutes);
router.use('/holidays', adminHolidayRouter);
router.use('/departments', departmentRoutes);
router.use('/payroll', adminPayrollRouter);

module.exports = router;
