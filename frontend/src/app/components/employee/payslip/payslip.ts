import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Payroll } from '../../../services/payroll';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-employee-payslip',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payslip.html',
  styleUrl: './payslip.css',
})
export class Payslip {
  payslips: any[] = [];
  filteredPayslips: any[] = [];
  loading = false;
  error = '';
  selectedHtml = '';
  selectedMonth = '';
  roleLabel = 'Employee';
  monthFilter = '';
  totalNetPay = 0;
  totalTax = 0;

  constructor(private payrollService: Payroll, private authService: AuthService) {}

  ngOnInit() {
    this.roleLabel = this.authService.getRole() === 'manager' ? 'Manager' : 'Employee';
    this.loading = true;
    this.error = '';
    this.payrollService.getMyPayrolls().subscribe({
      next: (res) => {
        this.payslips = res.data || [];
        this.applyMonthFilter();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load payslips.';
        this.loading = false;
      },
    });
  }

  applyMonthFilter() {
    const month = String(this.monthFilter || '').trim();
    this.filteredPayslips = month ? this.payslips.filter((p) => p.month === month) : [...this.payslips];

    this.totalNetPay = this.filteredPayslips.reduce((sum, p) => sum + Number(p.netPay || 0), 0);
    this.totalTax = this.filteredPayslips.reduce((sum, p) => sum + Number(p.taxDeduction || 0), 0);
  }

  clearMonthFilter() {
    this.monthFilter = '';
    this.applyMonthFilter();
  }

  viewPayslip(payrollId?: string) {
    if (!payrollId) return;
    this.error = '';
    this.payrollService.getMyPayrollHtml(payrollId).subscribe({
      next: (res) => {
        this.selectedHtml = res.data?.html || '';
        this.selectedMonth = res.data?.month || '';
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load payslip view.';
      },
    });
  }

  closeView() {
    this.selectedHtml = '';
    this.selectedMonth = '';
  }
}
