// services/payrollService.js
// Simple payroll helpers used by payroll controller.

const fs = require('fs');
const path = require('path');

// Fixed Nepali tax slabs (admin cannot edit these from UI).
const NEPAL_TAX_SLABS = {
  unmarried: [
    { upto: 500000, rate: 1 },
    { upto: 200000, rate: 10 },
    { upto: 300000, rate: 20 },
    { upto: 1000000, rate: 30 },
    { upto: Number.MAX_SAFE_INTEGER, rate: 36 },
  ],
  married: [
    { upto: 600000, rate: 1 },
    { upto: 200000, rate: 10 },
    { upto: 300000, rate: 20 },
    { upto: 900000, rate: 30 },
    { upto: Number.MAX_SAFE_INTEGER, rate: 36 },
  ],
};

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeFilingStatus(v) {
  return String(v) === 'married' ? 'married' : 'unmarried';
}

function calculateAnnualTax(annualIncome, filingStatus = 'unmarried') {
  const slabs = NEPAL_TAX_SLABS[normalizeFilingStatus(filingStatus)];
  let remaining = Math.max(0, toNumber(annualIncome, 0));
  let tax = 0;

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const taxablePart = Math.min(remaining, slab.upto);
    tax += taxablePart * (slab.rate / 100);
    remaining -= taxablePart;
  }

  return Math.round(tax);
}

function calculateMonthlyPayrollFromAnnual({
  annualSalary = 0,
  filingStatus = 'unmarried',
  otherDeductions = 0,
}) {
  const safeAnnualSalary = Math.max(0, toNumber(annualSalary, 0));
  const safeFilingStatus = normalizeFilingStatus(filingStatus);
  const safeOtherDeductions = Math.max(0, toNumber(otherDeductions, 0));

  const annualTax = calculateAnnualTax(safeAnnualSalary, safeFilingStatus);
  const monthlyTax = Math.round(annualTax / 12);
  const grossPay = Math.round(safeAnnualSalary / 12);
  const deductions = monthlyTax + safeOtherDeductions;
  const netPay = Math.max(0, grossPay - deductions);

  return {
    annualSalary: safeAnnualSalary,
    filingStatus: safeFilingStatus,
    grossPay,
    basic: grossPay,
    allowance: 0,
    taxDeduction: monthlyTax,
    otherDeductions: safeOtherDeductions,
    deductions,
    netPay,
    taxMeta: {
      annualTaxableIncome: safeAnnualSalary,
      annualTax,
      monthlyTax,
    },
  };
}

function formatCurrency(value) {
  return `NPR ${Math.round(toNumber(value, 0)).toLocaleString('en-NP')}`;
}

function replacePlaceholders(template, payload) {
  let output = template;
  Object.keys(payload).forEach((key) => {
    const rawValue = payload[key] === undefined || payload[key] === null ? '' : String(payload[key]);
    const safeValue = rawValue.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    output = output.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), safeValue);
  });
  return output;
}

function renderPayslipHtml({ employee, payroll, month }) {
  const templatePath = path.join(__dirname, '..', 'templates', 'payslip.html');
  const template = fs.readFileSync(templatePath, 'utf8');

  const employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email || 'Employee';
  const payload = {
    month: month || payroll.month || '-',
    generatedDate: new Date().toLocaleDateString('en-GB'),
    employeeName,
    employeeId: employee.employeeId || '-',
    department: employee.department || 'N/A',
    designation: employee.designation || 'Employee',
    annualSalary: formatCurrency(payroll.annualSalary),
    monthlyGross: formatCurrency(payroll.grossPay),
    taxDeduction: formatCurrency(payroll.taxDeduction),
    otherDeductions: formatCurrency(payroll.otherDeductions),
    totalDeductions: formatCurrency(payroll.deductions),
    netPay: formatCurrency(payroll.netPay),
    filingStatus: payroll.filingStatus,
    annualTax: formatCurrency(payroll.taxMeta?.annualTax || 0),
    status: payroll.status || 'Processed',
  };

  return replacePlaceholders(template, payload);
}

module.exports = {
  NEPAL_TAX_SLABS,
  normalizeFilingStatus,
  calculateAnnualTax,
  calculateMonthlyPayrollFromAnnual,
  renderPayslipHtml,
};
