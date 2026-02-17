// routes/holidayRoutes.js
// Separate holiday routes for admin and employee.

const express = require('express');
const { getHolidays, createHoliday, deleteHoliday } = require('../controllers/holidayController');

const adminHolidayRouter = express.Router();
adminHolidayRouter.get('/', getHolidays);
adminHolidayRouter.post('/', createHoliday);
adminHolidayRouter.delete('/:id', deleteHoliday);

const employeeHolidayRouter = express.Router();
employeeHolidayRouter.get('/', getHolidays);

module.exports = {
  adminHolidayRouter,
  employeeHolidayRouter,
};
