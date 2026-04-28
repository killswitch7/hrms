// Test Case: Payroll calculation logic

const { calculateMonthlyPayrollFromAnnual, renderPayslipHtml } = require('./payrollService');

describe('Payroll Calculation Logic', () => {
  test('should calculate monthly salary values correctly from annual salary', () => {
    const result = calculateMonthlyPayrollFromAnnual({
      annualSalary: 1200000,
      filingStatus: 'unmarried',
      otherDeductions: 2000,
    });

    // Basic sanity checks for logic
    expect(result.annualSalary).toBe(1200000);
    expect(result.grossPay).toBe(100000); // 1200000 / 12
    expect(result.taxDeduction).toBeGreaterThan(0);
    expect(result.otherDeductions).toBe(2000);
    expect(result.deductions).toBe(result.taxDeduction + 2000);
    expect(result.netPay).toBe(result.grossPay - result.deductions);
  });

  test('should apply deduction amount correctly on salary', () => {
    const result = calculateMonthlyPayrollFromAnnual({
      annualSalary: 600000,
      filingStatus: 'unmarried',
      otherDeductions: 1500,
    });

    // Deductions should be tax + other deductions
    const expectedDeductions = result.taxDeduction + 1500;
    expect(result.otherDeductions).toBe(1500);
    expect(result.deductions).toBe(expectedDeductions);
    expect(result.netPay).toBe(result.grossPay - expectedDeductions);
  });

  test('should generate payslip html correctly', () => {
    const employee = {
      employeeId: 'EMP-1001',
      firstName: 'Shuvam',
      lastName: 'Sharma',
      department: 'IT',
      designation: 'Software Engineer',
      email: 'xshuvam7@gmail.com',
    };

    const payroll = {
      month: '2026-04',
      annualSalary: 1200000,
      grossPay: 100000,
      taxDeduction: 8333,
      otherDeductions: 2000,
      attendanceDeduction: 1000,
      deductions: 11333,
      netPay: 88667,
      filingStatus: 'unmarried',
      status: 'Processed',
      attendanceDaysInMonth: 30,
      presentDays: 26,
      absentDays: 1,
      leaveDays: 2,
      wfhDays: 1,
      perDaySalary: 3333,
      taxMeta: {
        annualTax: 100000,
      },
    };

    const html = renderPayslipHtml({
      employee,
      payroll,
      month: '2026-04',
    });

    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain('Payslip');
    expect(html).toContain('Shuvam Sharma');
    expect(html).toContain('EMP-1001');
    expect(html).toContain('2026-04');
    expect(html).toContain('Net Salary');
  });
});
