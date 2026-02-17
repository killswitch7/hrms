// routes/wfhRoutes.js
// Work from home routes for both admin and employee.

const express = require('express');
const {
  createWfh,
  getMyWfh,
  getAdminWfhRequests,
  approveWfh,
  rejectWfh,
} = require('../controllers/wfhController');

const employeeWfhRouter = express.Router();
employeeWfhRouter.post('/', createWfh);
employeeWfhRouter.get('/', getMyWfh);

const adminWfhRouter = express.Router();
adminWfhRouter.get('/', getAdminWfhRequests);
adminWfhRouter.patch('/:id/approve', approveWfh);
adminWfhRouter.patch('/:id/reject', rejectWfh);

module.exports = {
  employeeWfhRouter,
  adminWfhRouter,
};
