// frontend/src/app/services/attendance.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface AttendanceRecord {
  _id?: string;
  date: string | Date;
  checkIn?: string | Date;
  checkOut?: string | Date;
  status?: string;
  note?: string;
  employee?: {
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  // Base URLs for each role
  private employeeBase = 'http://localhost:5001/api/employee';
  private managerMyBase = 'http://localhost:5001/api/manager/my-attendance';
  private adminBase = 'http://localhost:5001/api/admin';
  private managerBase = 'http://localhost:5001/api/manager';

  // Used for admin/manager team attendance page
  private getManageBase(): string {
    return this.auth.getRole() === 'manager' ? this.managerBase : this.adminBase;
  }

  // Used for own check-in/check-out page
  private getSelfBase(): string {
    return this.auth.getRole() === 'manager' ? this.managerMyBase : `${this.employeeBase}/attendance`;
  }

  // -------- Employee side --------

  checkIn(): Observable<any> {
    return this.http.post(`${this.getSelfBase()}/check-in`, {});
  }

  checkOut(): Observable<any> {
    return this.http.post(`${this.getSelfBase()}/check-out`, {});
  }

  getMyAttendance(from?: string, to?: string): Observable<{ data: AttendanceRecord[] }> {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;

    return this.http.get<{ data: AttendanceRecord[] }>(this.getSelfBase(), { params });
  }

  // -------- Admin side --------

  getAllAttendance(
    from?: string,
    to?: string,
    employeeId?: string,
    role?: string
  ): Observable<{ data: AttendanceRecord[] }> {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (employeeId) params.employeeId = employeeId;
    if (role) params.role = role;

    return this.http.get<{ data: AttendanceRecord[] }>(
      `${this.getManageBase()}/attendance`,
      { params }
    );
  }
}
