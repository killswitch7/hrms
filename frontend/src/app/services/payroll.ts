import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface PayrollItem {
  _id?: string;
  month: string;
  annualSalary?: number;
  basic: number;
  allowance: number;
  grossPay?: number;
  taxDeduction?: number;
  otherDeductions?: number;
  deductions: number;
  netPay: number;
  filingStatus?: 'unmarried' | 'married';
  status?: string;
  employee?: {
    _id?: string;
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface TaxSlab {
  upto: number;
  rate: number;
}

@Injectable({
  providedIn: 'root',
})
export class Payroll {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private adminBase = 'http://localhost:5001/api/admin/payroll';
  private employeeBase = 'http://localhost:5001/api/employee/payroll';
  private managerBase = 'http://localhost:5001/api/manager/my-payroll';

  getMyPayrolls(): Observable<{ data: any[] }> {
    const url = this.auth.getRole() === 'manager' ? this.managerBase : this.employeeBase;
    return this.http.get<{ data: PayrollItem[] }>(url);
  }

  getAdminPayrolls(filters?: { month?: string; search?: string }): Observable<{ data: PayrollItem[] }> {
    return this.http.get<{ data: PayrollItem[] }>(this.adminBase, {
      params: {
        month: filters?.month || '',
        search: filters?.search || '',
      },
    });
  }

  createOrUpdatePayroll(payload: {
    employee: string;
    month: string;
    otherDeductions?: number;
    filingStatus?: 'unmarried' | 'married';
    status?: 'Pending' | 'Processed' | 'Paid';
  }): Observable<{ message: string; data: PayrollItem }> {
    return this.http.post<{ message: string; data: PayrollItem }>(this.adminBase, payload);
  }

  getTaxConfig(): Observable<{ data: { slabs: { unmarried: TaxSlab[]; married: TaxSlab[] } } }> {
    return this.http.get<{ data: { slabs: { unmarried: TaxSlab[]; married: TaxSlab[] } } }>(
      `${this.adminBase}/tax-config`
    );
  }

  calculate(payload: {
    employee: string;
    month?: string;
    otherDeductions?: number;
    filingStatus?: 'unmarried' | 'married';
  }): Observable<{
    data: {
      annualSalary: number;
      grossPay: number;
      basic: number;
      allowance: number;
      taxDeduction: number;
      otherDeductions: number;
      deductions: number;
      netPay: number;
      payslipHtml?: string;
      taxMeta: {
        annualTaxableIncome: number;
        annualTax: number;
        monthlyTax: number;
      };
    };
  }> {
    return this.http.post<{
      data: {
        annualSalary: number;
        grossPay: number;
        basic: number;
        allowance: number;
        taxDeduction: number;
        otherDeductions: number;
        deductions: number;
        netPay: number;
        payslipHtml?: string;
        taxMeta: {
          annualTaxableIncome: number;
          annualTax: number;
          monthlyTax: number;
        };
      };
    }>(`${this.adminBase}/calculate`, payload);
  }

  getAdminPayrollHtml(id: string): Observable<{ data: { html: string; month: string } }> {
    return this.http.get<{ data: { html: string; month: string } }>(`${this.adminBase}/${id}/html`);
  }

  getMyPayrollHtml(id: string): Observable<{ data: { html: string; month: string } }> {
    const url = this.auth.getRole() === 'manager' ? this.managerBase : this.employeeBase;
    return this.http.get<{ data: { html: string; month: string } }>(`${url}/${id}/html`);
  }
}
