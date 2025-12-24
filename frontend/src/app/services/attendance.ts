// frontend/src/app/services/attendance.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private employeeBase = 'http://localhost:5001/api/employee';
  private adminBase = 'http://localhost:5001/api/admin';

  // -------- Employee side --------

  checkIn(): Observable<any> {
    return this.http.post(`${this.employeeBase}/attendance/check-in`, {});
  }

  checkOut(): Observable<any> {
    return this.http.post(`${this.employeeBase}/attendance/check-out`, {});
  }

  getMyAttendance(from?: string, to?: string): Observable<{ data: AttendanceRecord[] }> {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;

    return this.http.get<{ data: AttendanceRecord[] }>(
      `${this.employeeBase}/attendance`,
      { params }
    );
  }

  // -------- Admin side --------

  getAllAttendance(
    from?: string,
    to?: string,
    employeeId?: string
  ): Observable<{ data: AttendanceRecord[] }> {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (employeeId) params.employeeId = employeeId;

    return this.http.get<{ data: AttendanceRecord[] }>(
      `${this.adminBase}/attendance`,
      { params }
    );
  }
}
