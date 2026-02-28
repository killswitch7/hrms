import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeItem, EmployeeService } from '../../../services/employee';
import { Payroll as PayrollService, PayrollItem } from '../../../services/payroll';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payroll.html',
  styleUrls: ['./payroll.css'],
})
export class Payroll implements OnInit {
  employees: EmployeeItem[] = [];
  payrolls: PayrollItem[] = [];

  loading = false;
  error = '';
  success = '';

  filterMonth = '';
  filterSearch = '';

  form = {
    employee: '',
    month: '',
    filingStatus: 'unmarried' as 'unmarried' | 'married',
    otherDeductions: 0,
    status: 'Processed' as 'Pending' | 'Processed' | 'Paid',
  };

  preview = {
    annualSalary: 0,
    grossPay: 0,
    taxDeduction: 0,
    otherDeductions: 0,
    deductions: 0,
    netPay: 0,
    annualTaxableIncome: 0,
    annualTax: 0,
    monthlyTax: 0,
  };

  selectedPayslipHtml = '';
  selectedPayslipMonth = '';

  constructor(
    private employeeService: EmployeeService,
    private payrollService: PayrollService
  ) {}

  ngOnInit(): void {
    this.form.month = new Date().toISOString().slice(0, 7);
    this.loadEmployees();
    this.loadPayrolls();
  }

  loadEmployees() {
    this.employeeService.getEmployees({ limit: 500, status: 'active' }).subscribe({
      next: (res) => {
        this.employees = res.data || [];
      },
      error: () => {
        this.error = 'Failed to load employees.';
      },
    });
  }

  loadPayrolls() {
    this.loading = true;
    this.error = '';
    this.payrollService
      .getAdminPayrolls({ month: this.filterMonth, search: this.filterSearch.trim() })
      .subscribe({
        next: (res) => {
          this.payrolls = res.data || [];
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to load payroll records.';
          this.loading = false;
        },
      });
  }

  get selectedEmployee(): EmployeeItem | null {
    return this.employees.find((e) => e._id === this.form.employee) || null;
  }

  calculatePreview() {
    this.error = '';
    this.success = '';
    if (!this.form.employee) {
      this.error = 'Please select employee first.';
      return;
    }

    this.payrollService
      .calculate({
        employee: this.form.employee,
        month: this.form.month,
        filingStatus: this.form.filingStatus,
        otherDeductions: Number(this.form.otherDeductions || 0),
      })
      .subscribe({
        next: (res) => {
          const data = res.data;
          this.preview.annualSalary = data.annualSalary || 0;
          this.preview.grossPay = data.grossPay || 0;
          this.preview.taxDeduction = data.taxDeduction || 0;
          this.preview.otherDeductions = data.otherDeductions || 0;
          this.preview.deductions = data.deductions || 0;
          this.preview.netPay = data.netPay || 0;
          this.preview.annualTaxableIncome = data.taxMeta?.annualTaxableIncome || 0;
          this.preview.annualTax = data.taxMeta?.annualTax || 0;
          this.preview.monthlyTax = data.taxMeta?.monthlyTax || 0;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to calculate payroll.';
        },
      });
  }

  savePayroll() {
    this.error = '';
    this.success = '';
    if (!this.form.employee || !this.form.month) {
      this.error = 'Employee and month are required.';
      return;
    }

    this.payrollService
      .createOrUpdatePayroll({
        employee: this.form.employee,
        month: this.form.month,
        filingStatus: this.form.filingStatus,
        otherDeductions: Number(this.form.otherDeductions || 0),
        status: this.form.status,
      })
      .subscribe({
        next: (res) => {
          this.success = res.message || 'Payslip saved.';
          this.loadPayrolls();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to save payslip.';
        },
      });
  }

  openPayslip(payrollId?: string) {
    if (!payrollId) return;
    this.error = '';
    this.payrollService.getAdminPayrollHtml(payrollId).subscribe({
      next: (res) => {
        this.selectedPayslipHtml = res.data?.html || '';
        this.selectedPayslipMonth = res.data?.month || '';
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load payslip template.';
      },
    });
  }

  closePayslip() {
    this.selectedPayslipHtml = '';
    this.selectedPayslipMonth = '';
  }
}
