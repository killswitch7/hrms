import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface MyProfileData {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  employeeId: string;
  department: string;
  designation: string;
  phone: string;
  joinDate: string | Date;
  salary: {
    annualSalary: number;
    monthlyBeforeTax: number;
    filingStatus: 'unmarried' | 'married';
    latestPayroll: null | {
      month: string;
      grossPay: number;
      taxDeduction: number;
      deductions: number;
      netPay: number;
      status: string;
    };
  };
  leave: {
    annualAllowance: number;
    used: number;
    remaining: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private employeeBase = 'http://localhost:5001/api/employee';
  private managerBase = 'http://localhost:5001/api/manager';

  private getBase() {
    return this.auth.getRole() === 'manager' ? this.managerBase : this.employeeBase;
  }

  getMyProfile(): Observable<{ data: MyProfileData }> {
    return this.http.get<{ data: MyProfileData }>(`${this.getBase()}/profile`);
  }

  updateMyProfile(payload: {
    firstName: string;
    lastName?: string;
    phone?: string;
    designation?: string;
  }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.getBase()}/profile`, payload);
  }

  changeMyPassword(payload: {
    currentPassword: string;
    newPassword: string;
    otp: string;
  }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.getBase()}/change-password`, payload);
  }

  requestChangePasswordOtp(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.getBase()}/change-password/request-otp`, {});
  }
}
