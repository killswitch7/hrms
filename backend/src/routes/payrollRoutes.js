// routes/payrollRoutes.js
// Payroll routers for admin and employee.

const express = require('express');
const {
  getAdminPayrolls,
  createPayroll,
  getMyPayrolls,
  getTaxConfig,
  calculatePayroll,
  getAdminPayrollHtml,
  getMyPayrollHtml,
} = require('../controllers/payrollController');

const adminPayrollRouter = express.Router();
adminPayrollRouter.get('/', getAdminPayrolls);
adminPayrollRouter.post('/', createPayroll);
adminPayrollRouter.get('/tax-config', getTaxConfig);
adminPayrollRouter.post('/calculate', calculatePayroll);
adminPayrollRouter.get('/:id/html', getAdminPayrollHtml);

const employeePayrollRouter = express.Router();
employeePayrollRouter.get('/', getMyPayrolls);
employeePayrollRouter.get('/:id/html', getMyPayrollHtml);

module.exports = {
  adminPayrollRouter,
  employeePayrollRouter,
};
