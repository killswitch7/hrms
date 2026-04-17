// controllers/payrollController.js
// Payroll flow:
// 1) Admin sets annual salary in employee profile.
// 2) Admin clicks calculate/save payslip for a month.
// 3) Employee/manager can open template view of their payslip.

const mongoose = require('mongoose');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { getOrCreateEmployeeForUser } = require('./employeeController');
const { NEPAL_TAX_SLABS, normalizeFilingStatus, calculateMonthlyPayrollFromAnnual, renderPayslipHtml } = require('../services/payrollService');
const { notifyPayslipDone } = require('../services/mailService');
const { htmlToPdfBuffer } = require('../services/htmlPdfService');

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function getEmployeeOr404(employeeId) {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) return null;
  return Employee.findById(employeeId).populate('user', 'name email role');
}

function getMonthDateRange(month) {
  // month format: YYYY-MM
  const safeMonth = String(month || '').trim();
  if (!/^\d{4}-\d{2}$/.test(safeMonth)) {
    const now = new Date();
    return {
      month: now.toISOString().slice(0, 7),
      start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0),
      daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    };
  }

  const [yearStr, monthStr] = safeMonth.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return { month: safeMonth, start, end, daysInMonth };
}

async function getAttendanceSummary(employeeId, month) {
  const { start, end, daysInMonth } = getMonthDateRange(month);

  const stats = await Attendance.aggregate([
    {
      $match: {
        employee: employeeId,
        date: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = {
    daysInMonth,
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0,
    wfhDays: 0,
  };

  stats.forEach((row) => {
    if (row._id === 'Present') summary.presentDays = row.count;
    if (row._id === 'Absent') summary.absentDays = row.count;
    if (row._id === 'Leave') summary.leaveDays = row.count;
    if (row._id === 'WFH') summary.wfhDays = row.count;
  });

  return summary;
}

async function buildPayrollFromEmployee(employee, month, filingStatus, otherDeductions, status) {
  const annualSalaryFromProfile = Number(employee.annualSalary || 0) || Math.round(Number(employee.baseSalary || 0) * 12);
  const computed = calculateMonthlyPayrollFromAnnual({
    annualSalary: annualSalaryFromProfile,
    filingStatus: filingStatus || employee.filingStatus || 'unmarried',
    otherDeductions,
  });
  const attendance = await getAttendanceSummary(employee._id, month);

  // Student-level logic:
  // If employee is marked absent, we cut salary for those absent days.
  const perDaySalary = attendance.daysInMonth > 0 ? Math.round(computed.grossPay / attendance.daysInMonth) : 0;
  const attendanceDeduction = Math.max(0, perDaySalary * attendance.absentDays);
  const totalDeductions = computed.deductions + attendanceDeduction;
  const netPay = Math.max(0, computed.grossPay - totalDeductions);

  const row = {
    employee: employee._id,
    month,
    annualSalary: computed.annualSalary,
    basic: computed.basic,
    allowance: computed.allowance,
    grossPay: computed.grossPay,
    filingStatus: computed.filingStatus,
    taxDeduction: computed.taxDeduction,
    otherDeductions: computed.otherDeductions,
    attendanceDaysInMonth: attendance.daysInMonth,
    presentDays: attendance.presentDays,
    absentDays: attendance.absentDays,
    leaveDays: attendance.leaveDays,
    wfhDays: attendance.wfhDays,
    perDaySalary,
    attendanceDeduction,
    deductions: totalDeductions,
    netPay,
    taxMeta: computed.taxMeta,
    status: status || 'Processed',
  };

  row.payslipHtml = renderPayslipHtml({
    employee,
    payroll: row,
    month,
  });

  return row;
}

async function getTaxConfig(req, res) {
  // Read-only endpoint so frontend can show what slab is used.
  return res.json({
    data: {
      editable: false,
      slabs: NEPAL_TAX_SLABS,
      note: 'Nepali tax slabs are fixed by system.',
    },
  });
}

async function calculatePayroll(req, res) {
  try {
    const { employee: employeeId, month, filingStatus, otherDeductions = 0 } = req.body;
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee is required.' });
    }

    const employee = await getEmployeeOr404(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    const annualSalary = Number(employee.annualSalary || 0) || Math.round(Number(employee.baseSalary || 0) * 12);
    if (!annualSalary) {
      return res.status(400).json({ message: 'Annual salary is missing for this employee. Update employee profile first.' });
    }

    const previewMonth = String(month || '').trim() || new Date().toISOString().slice(0, 7);
    const safeFiling = filingStatus ? normalizeFilingStatus(filingStatus) : employee.filingStatus || 'unmarried';
    const payload = await buildPayrollFromEmployee(
      employee,
      previewMonth,
      safeFiling,
      Math.max(0, toNumber(otherDeductions, 0)),
      'Processed'
    );

    return res.json({ data: payload });
  } catch (err) {
    console.error('calculatePayroll error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getAdminPayrolls(req, res) {
  try {
    const { month = '', search = '' } = req.query;
    const filter = {};
    if (month) filter.month = String(month).trim();

    let data = await Payroll.find(filter)
      .populate('employee', 'employeeId firstName lastName email')
      .sort({ month: -1, createdAt: -1 });

    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      data = data.filter((row) => {
        const e = row.employee || {};
        return (
          regex.test(e.employeeId || '') ||
          regex.test(e.firstName || '') ||
          regex.test(e.lastName || '') ||
          regex.test(e.email || '')
        );
      });
    }

    return res.json({ data });
  } catch (err) {
    console.error('getAdminPayrolls error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function createPayroll(req, res) {
  try {
    const {
      employee: employeeId,
      month,
      otherDeductions = 0,
      filingStatus,
      status = 'Processed',
    } = req.body;

    if (!employeeId || !month) {
      return res.status(400).json({ message: 'Employee and month are required.' });
    }

    const employee = await getEmployeeOr404(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    const annualSalary = Number(employee.annualSalary || 0) || Math.round(Number(employee.baseSalary || 0) * 12);
    if (!annualSalary) {
      return res.status(400).json({ message: 'Annual salary is missing for this employee. Update employee profile first.' });
    }

    const safeFiling = filingStatus ? normalizeFilingStatus(filingStatus) : employee.filingStatus || 'unmarried';
    const row = await buildPayrollFromEmployee(
      employee,
      String(month).trim(),
      safeFiling,
      Math.max(0, toNumber(otherDeductions, 0)),
      status
    );

    const data = await Payroll.findOneAndUpdate(
      { employee: employee._id, month: row.month },
      row,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('employee', 'employeeId firstName lastName email');

    await notifyPayslipDone({
      employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email || 'Employee',
      employeeId: employee.employeeId || '-',
      employeeEmail: employee.email || '-',
      month: row.month,
      annualSalary: row.annualSalary,
      grossPay: row.grossPay,
      taxDeduction: row.taxDeduction,
      deductions: row.deductions,
      netPay: row.netPay,
      status: row.status,
    });

    return res.status(201).json({ message: 'Payslip saved successfully', data });
  } catch (err) {
    console.error('createPayroll error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getMyPayrolls(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const data = await Payroll.find({ employee: employee._id }).sort({ month: -1, createdAt: -1 });
    return res.json({ data });
  } catch (err) {
    console.error('getMyPayrolls error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getAdminPayrollHtml(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid payroll id.' });
    }

    const row = await Payroll.findById(id).populate('employee', 'employeeId firstName lastName email department designation');
    if (!row) return res.status(404).json({ message: 'Payslip not found.' });

    let html = row.payslipHtml || '';
    if (!html) {
      html = renderPayslipHtml({
        employee: row.employee || {},
        payroll: row,
        month: row.month,
      });
      row.payslipHtml = html;
      await row.save();
    }

    return res.json({ data: { html, month: row.month } });
  } catch (err) {
    console.error('getAdminPayrollHtml error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getMyPayrollHtml(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid payroll id.' });
    }

    const employee = await getOrCreateEmployeeForUser(req.user);
    const row = await Payroll.findOne({ _id: id, employee: employee._id });
    if (!row) return res.status(404).json({ message: 'Payslip not found.' });

    let html = row.payslipHtml || '';
    if (!html) {
      html = renderPayslipHtml({
        employee,
        payroll: row,
        month: row.month,
      });
      row.payslipHtml = html;
      await row.save();
    }

    return res.json({ data: { html, month: row.month } });
  } catch (err) {
    console.error('getMyPayrollHtml error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function downloadAdminPayrollPdf(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid payroll id.' });
    }

    const row = await Payroll.findById(id).populate('employee', 'employeeId firstName lastName email department designation');
    if (!row) return res.status(404).json({ message: 'Payslip not found.' });

    let html = row.payslipHtml || '';
    if (!html) {
      html = renderPayslipHtml({
        employee: row.employee || {},
        payroll: row,
        month: row.month,
      });
      row.payslipHtml = html;
      await row.save();
    }

    const pdf = await htmlToPdfBuffer(html);
    const filename = `payslip-${row.employee?.employeeId || 'EMP'}-${row.month || 'month'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (err) {
    console.error('downloadAdminPayrollPdf error:', err);
    return res.status(500).json({ message: 'Failed to generate PDF. Install puppeteer in backend.' });
  }
}

async function downloadMyPayrollPdf(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid payroll id.' });
    }

    const employee = await getOrCreateEmployeeForUser(req.user);
    const row = await Payroll.findOne({ _id: id, employee: employee._id });
    if (!row) return res.status(404).json({ message: 'Payslip not found.' });

    let html = row.payslipHtml || '';
    if (!html) {
      html = renderPayslipHtml({
        employee,
        payroll: row,
        month: row.month,
      });
      row.payslipHtml = html;
      await row.save();
    }

    const pdf = await htmlToPdfBuffer(html);
    const filename = `payslip-${employee.employeeId || 'EMP'}-${row.month || 'month'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (err) {
    console.error('downloadMyPayrollPdf error:', err);
    return res.status(500).json({ message: 'Failed to generate PDF. Install puppeteer in backend.' });
  }
}

module.exports = {
  getAdminPayrolls,
  createPayroll,
  getMyPayrolls,
  getTaxConfig,
  calculatePayroll,
  getAdminPayrollHtml,
  getMyPayrollHtml,
  downloadAdminPayrollPdf,
  downloadMyPayrollPdf,
};
