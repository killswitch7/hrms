// routes/employeeRoutes.js
// Admin side employee management routes.

const express = require('express');
const {
  createEmployee,
  getEmployees,
  getEmployeeProfile,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/adminController');

const router = express.Router();

router.post('/', createEmployee);
router.get('/', getEmployees);
router.get('/:id/profile', getEmployeeProfile);
router.patch('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;
