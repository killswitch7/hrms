// routes/payrollRoutes.js
// Payroll routers for admin and employee.

const express = require('express');
const { getAdminPayrolls, createPayroll, getMyPayrolls } = require('../controllers/payrollController');

const adminPayrollRouter = express.Router();
adminPayrollRouter.get('/', getAdminPayrolls);
adminPayrollRouter.post('/', createPayroll);

const employeePayrollRouter = express.Router();
employeePayrollRouter.get('/', getMyPayrolls);

module.exports = {
  adminPayrollRouter,
  employeePayrollRouter,
};
