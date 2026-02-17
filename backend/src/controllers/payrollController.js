// controllers/payrollController.js
// Simple payroll APIs. Easy to read and easy to change.

const Payroll = require('../models/Payroll');
const { getOrCreateEmployeeForUser } = require('./employeeController');

async function getAdminPayrolls(req, res) {
  try {
    const data = await Payroll.find({})
      .populate('employee', 'employeeId firstName lastName email')
      .sort({ month: -1 });
    return res.json({ data });
  } catch (err) {
    console.error('getAdminPayrolls error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function createPayroll(req, res) {
  try {
    const { employee, month, basic = 0, allowance = 0, deductions = 0, status = 'Processed' } = req.body;
    if (!employee || !month) {
      return res.status(400).json({ message: 'Employee and month are required.' });
    }

    const netPay = Number(basic) + Number(allowance) - Number(deductions);
    const data = await Payroll.findOneAndUpdate(
      { employee, month },
      { employee, month, basic, allowance, deductions, netPay, status },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ message: 'Payroll saved', data });
  } catch (err) {
    console.error('createPayroll error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getMyPayrolls(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const data = await Payroll.find({ employee: employee._id }).sort({ month: -1 });
    return res.json({ data });
  } catch (err) {
    console.error('getMyPayrolls error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getAdminPayrolls,
  createPayroll,
  getMyPayrolls,
};
