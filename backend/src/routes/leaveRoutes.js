// routes/leaveRoutes.js
// Leave routes for both admin and employee.

const express = require('express');
const {
  createLeave,
  getMyLeave,
  getAdminLeaveRequests,
  approveLeave,
  rejectLeave,
} = require('../controllers/leaveController');

const employeeLeaveRouter = express.Router();
employeeLeaveRouter.post('/', createLeave);
employeeLeaveRouter.get('/', getMyLeave);

const adminLeaveRouter = express.Router();
adminLeaveRouter.get('/', getAdminLeaveRequests);
adminLeaveRouter.patch('/:id/approve', approveLeave);
adminLeaveRouter.patch('/:id/reject', rejectLeave);

module.exports = {
  employeeLeaveRouter,
  adminLeaveRouter,
};
