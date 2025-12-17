// frontend/src/app/services/leave.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveRequest {
  _id?: string;
  from: string | Date;
  to: string | Date;
  reason?: string;
  status?: LeaveStatus;
  type?: string;       // 'Annual' | 'Sick' | 'Casual' | 'Other' | 'WFH'
  createdAt?: string;
  employee?: {
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

// For simplicity, WFH uses same shape
export type WfhRequest = LeaveRequest;

@Injectable({
  providedIn: 'root',
})
export class LeaveService {
  private http = inject(HttpClient);

  private employeeBase = 'http://localhost:5001/api/employee';
  private adminBase = 'http://localhost:5001/api/admin';

  // ---------- EMPLOYEE: NORMAL LEAVE ----------

  createLeave(request: {
    from: string;
    to: string;
    type: string;
    reason?: string;
  }): Observable<any> {
    return this.http.post(`${this.employeeBase}/leave`, request);
  }

  getMyLeaveRequests(type?: string): Observable<{ data: LeaveRequest[] }> {
    const url = type
      ? `${this.employeeBase}/leave?type=${type}`
      : `${this.employeeBase}/leave`;

    return this.http.get<{ data: LeaveRequest[] }>(url);
  }

  // ---------- EMPLOYEE: WFH ----------

  createWfh(request: { from: string; to: string; reason?: string }): Observable<any> {
    return this.http.post(`${this.employeeBase}/wfh`, request);
  }

  getMyWfhRequests(): Observable<{ data: WfhRequest[] }> {
    return this.http.get<{ data: WfhRequest[] }>(`${this.employeeBase}/wfh`);
  }

  // ---------- ADMIN: LEAVE (non-WFH) ----------

  getAllLeaveRequests(status?: LeaveStatus): Observable<{ data: LeaveRequest[] }> {
    const url = status
      ? `${this.adminBase}/leave-requests?status=${status}`
      : `${this.adminBase}/leave-requests`;

    return this.http.get<{ data: LeaveRequest[] }>(url);
  }

  approveLeave(id: string): Observable<any> {
    return this.http.patch(`${this.adminBase}/leave-requests/${id}/approve`, {});
  }

  rejectLeave(id: string): Observable<any> {
    return this.http.patch(`${this.adminBase}/leave-requests/${id}/reject`, {});
  }

  // ---------- ADMIN: WFH ----------

  getAllWfhRequests(status?: LeaveStatus): Observable<{ data: WfhRequest[] }> {
    const url = status
      ? `${this.adminBase}/wfh-requests?status=${status}`
      : `${this.adminBase}/wfh-requests`;

    return this.http.get<{ data: WfhRequest[] }>(url);
  }

  approveWfh(id: string): Observable<any> {
    return this.http.patch(`${this.adminBase}/wfh-requests/${id}/approve`, {});
  }

  rejectWfh(id: string): Observable<any> {
    return this.http.patch(`${this.adminBase}/wfh-requests/${id}/reject`, {});
  }
}
