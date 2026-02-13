import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmployeeDashboardNotice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
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

  getSummary(): Observable<{ data: EmployeeDashboardSummary }> {
    return this.http.get<{ data: EmployeeDashboardSummary }>(
      `${this.employeeBase}/dashboard-summary`
    );
  }
}
