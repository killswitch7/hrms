import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// These interfaces are the data coming from backend.
export interface EmployeeDashboardNotice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface EmployeeHoliday {
  _id: string;
  name: string;
  date: string;
  type: 'Public' | 'Company' | 'Optional' | 'Festival';
  description?: string;
}

export interface EmployeeDashboardSummary {
  userProfile: {
    name: string;
    position: string;
    email: string;
  };
  stats: {
    leaveBalance: number;
    attendance: number;
    notifications: number;
  };
  todayAttendance: {
    status: string;
    time: string | null;
    checkIn: string | null;
    checkOut: string | null;
  };
  announcements: EmployeeDashboardNotice[];
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeDashboardService {
  private http = inject(HttpClient);
  private employeeBase = 'http://localhost:5001/api/employee';

  // Dashboard summary for employee home page
  getSummary(): Observable<{ data: EmployeeDashboardSummary }> {
    return this.http.get<{ data: EmployeeDashboardSummary }>(
      `${this.employeeBase}/dashboard-summary`
    );
  }

  // Holiday list for employee holiday page
  getHolidays(): Observable<{ data: EmployeeHoliday[] }> {
    return this.http.get<{ data: EmployeeHoliday[] }>(
      `${this.employeeBase}/holidays`
    );
  }
}
