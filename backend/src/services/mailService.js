// backend/src/services/mailService.js
// Small mail helper used by leave/WFH/payroll flows.

const { MAIL_USER, MAIL_APP_PASSWORD, NOTIFY_TO } = require('../config/mail');

let nodemailer = null;
try {
  // If dependency is not installed yet, backend should still run.
  // Mail will just be skipped with a log.
  nodemailer = require('nodemailer');
} catch (err) {
  console.warn('nodemailer not installed. Run: npm install in backend folder');
}

let transporter = null;
if (nodemailer) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: MAIL_USER,
      pass: MAIL_APP_PASSWORD,
    },
  });
}

async function sendMail({ subject, text, html, to = NOTIFY_TO }) {
  if (!transporter) return { ok: false, skipped: true, reason: 'transporter-not-ready' };

  try {
    const info = await transporter.sendMail({
      from: `"HRMS Alerts" <${MAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html: html || '',
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error('sendMail error:', err.message || err);
    return { ok: false, error: err.message || 'mail-failed' };
  }
}

function formatDate(dateValue) {
  if (!dateValue) return '-';
  return new Date(dateValue).toLocaleString('en-NP', { timeZone: 'Asia/Kathmandu' });
}

async function notifyLeaveOrWfhDecision({
  requestType = 'Leave',
  status = 'Approved',
  employeeName = 'Employee',
  employeeEmail = '-',
  fromDate,
  toDate,
  reason = '',
  decidedByRole = 'admin',
}) {
  const subject = `[HRMS] ${requestType} ${status} - ${employeeName}`;
  const text =
    `${requestType} request ${status}\n` +
    `Employee: ${employeeName}\n` +
    `Employee Email: ${employeeEmail}\n` +
    `From: ${formatDate(fromDate)}\n` +
    `To: ${formatDate(toDate)}\n` +
    `Reason: ${reason || '-'}\n` +
    `Action By: ${decidedByRole}`;

  const html = `
    <h3>${requestType} Request ${status}</h3>
    <p><b>Employee:</b> ${employeeName}</p>
    <p><b>Email:</b> ${employeeEmail}</p>
    <p><b>From:</b> ${formatDate(fromDate)}</p>
    <p><b>To:</b> ${formatDate(toDate)}</p>
    <p><b>Reason:</b> ${reason || '-'}</p>
    <p><b>Action By:</b> ${decidedByRole}</p>
  `;

  return sendMail({ subject, text, html });
}

async function notifyPayslipDone({
  employeeName = 'Employee',
  employeeId = '-',
  employeeEmail = '-',
  month = '-',
  annualSalary = 0,
  grossPay = 0,
  taxDeduction = 0,
  deductions = 0,
  netPay = 0,
  status = 'Processed',
}) {
  const subject = `[HRMS] Payslip ${status} - ${employeeName} (${month})`;
  const text =
    `Payslip ${status}\n` +
    `Employee: ${employeeName}\n` +
    `Employee ID: ${employeeId}\n` +
    `Employee Email: ${employeeEmail}\n` +
    `Month: ${month}\n` +
    `Annual Salary: NPR ${Number(annualSalary || 0).toLocaleString('en-NP')}\n` +
    `Gross Pay: NPR ${Number(grossPay || 0).toLocaleString('en-NP')}\n` +
    `Tax: NPR ${Number(taxDeduction || 0).toLocaleString('en-NP')}\n` +
    `Total Deductions: NPR ${Number(deductions || 0).toLocaleString('en-NP')}\n` +
    `Net Pay: NPR ${Number(netPay || 0).toLocaleString('en-NP')}`;

  const html = `
    <h3>Payslip ${status}</h3>
    <p><b>Employee:</b> ${employeeName}</p>
    <p><b>Employee ID:</b> ${employeeId}</p>
    <p><b>Email:</b> ${employeeEmail}</p>
    <p><b>Month:</b> ${month}</p>
    <p><b>Annual Salary:</b> NPR ${Number(annualSalary || 0).toLocaleString('en-NP')}</p>
    <p><b>Gross Pay:</b> NPR ${Number(grossPay || 0).toLocaleString('en-NP')}</p>
    <p><b>Tax:</b> NPR ${Number(taxDeduction || 0).toLocaleString('en-NP')}</p>
    <p><b>Total Deductions:</b> NPR ${Number(deductions || 0).toLocaleString('en-NP')}</p>
    <p><b>Net Pay:</b> NPR ${Number(netPay || 0).toLocaleString('en-NP')}</p>
  `;

  return sendMail({ subject, text, html });
}

module.exports = {
  sendMail,
  notifyLeaveOrWfhDecision,
  notifyPayslipDone,
};
