// frontend/src/app/services/leave.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveRequest {
  _id?: string;
  from: string | Date;
  to: string | Date;
  reason?: string;
  status?: LeaveStatus;
  type?: string;      
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
  private auth = inject(AuthService);

  // Base URLs for each role
  private employeeBase = 'http://localhost:5001/api/employee';
  private managerMyLeaveBase = 'http://localhost:5001/api/manager/my-leave';
  private managerMyWfhBase = 'http://localhost:5001/api/manager/my-wfh';
  private adminBase = 'http://localhost:5001/api/admin';
  private managerBase = 'http://localhost:5001/api/manager';

  // Used by admin/manager approval pages
  private getManageBase(): string {
    return this.auth.getRole() === 'manager' ? this.managerBase : this.adminBase;
  }

  // Used by employee/manager own leave request page
  private getSelfLeaveBase(): string {
    return this.auth.getRole() === 'manager' ? this.managerMyLeaveBase : `${this.employeeBase}/leave`;
  }

  // Used by employee/manager own WFH request page
  private getSelfWfhBase(): string {
    return this.auth.getRole() === 'manager' ? this.managerMyWfhBase : `${this.employeeBase}/wfh`;
  }

  // ---------- EMPLOYEE: NORMAL LEAVE ----------

  createLeave(request: {
    from: string;
    to: string;
    type: string;
    reason?: string;
  }): Observable<any> {
    return this.http.post(this.getSelfLeaveBase(), request);
  }

  getMyLeaveRequests(type?: string): Observable<{ data: LeaveRequest[] }> {
    const base = this.getSelfLeaveBase();
    const url = type ? `${base}?type=${type}` : base;

    return this.http.get<{ data: LeaveRequest[] }>(url);
  }

  // ---------- EMPLOYEE: WFH ----------

  createWfh(request: { from: string; to: string; reason?: string }): Observable<any> {
    return this.http.post(this.getSelfWfhBase(), request);
  }

  getMyWfhRequests(): Observable<{ data: WfhRequest[] }> {
    return this.http.get<{ data: WfhRequest[] }>(this.getSelfWfhBase());
  }

  // ---------- ADMIN: LEAVE (non-WFH) ----------

  getAllLeaveRequests(status?: LeaveStatus, search?: string): Observable<{ data: LeaveRequest[] }> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString();
    const url = `${this.getManageBase()}/leave-requests${qs ? `?${qs}` : ''}`;

    return this.http.get<{ data: LeaveRequest[] }>(url);
  }

  approveLeave(id: string): Observable<any> {
    return this.http.patch(`${this.getManageBase()}/leave-requests/${id}/approve`, {});
  }

  rejectLeave(id: string): Observable<any> {
    return this.http.patch(`${this.getManageBase()}/leave-requests/${id}/reject`, {});
  }

  // ---------- ADMIN: WFH ----------

  getAllWfhRequests(status?: LeaveStatus, search?: string): Observable<{ data: WfhRequest[] }> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString();
    const url = `${this.getManageBase()}/wfh-requests${qs ? `?${qs}` : ''}`;

    return this.http.get<{ data: WfhRequest[] }>(url);
  }

  approveWfh(id: string): Observable<any> {
    return this.http.patch(`${this.getManageBase()}/wfh-requests/${id}/approve`, {});
  }

  rejectWfh(id: string): Observable<any> {
    return this.http.patch(`${this.getManageBase()}/wfh-requests/${id}/reject`, {});
  }
}
