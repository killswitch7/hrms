import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth';

// Data shape for dashboard cards
export interface DashboardSummary {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  approvedLeaves: number;
  attendanceRate: number;
  leaveApprovalRate: number;
  generatedAt: string;
  recentEmployees: Array<{
    _id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
    designation?: string;
    status: string;
    createdAt: string;
  }>;
}

export interface AdminAnnouncement {
  _id: string;
  title: string;
  content: string;
  type: 'General' | 'HR' | 'Holiday' | 'System';
  audience: 'All' | 'Employees' | 'Admins';
  createdAt: string;
}

export interface AdminAnalytics {
  activeEmployees: number;
  totalEmployees: number;
  presentToday: number;
  attendanceRate: number;
  leave: {
    pending: number;
    approved: number;
    rejected: number;
  };
  generatedAt: string;
}

export interface AdminHoliday {
  _id: string;
  name: string;
  date: string; // old fallback key
  startDate: string;
  endDate: string;
  type: 'Public' | 'Company' | 'Optional' | 'Festival';
  description?: string;
}

export interface DepartmentItem {
  _id: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class Admin {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiRoot = 'http://localhost:5001/api';

  // If role is manager, call manager endpoints.
  // Else call admin endpoints.
  private getManageBase(): string {
    const role = this.auth.getRole();
    return role === 'manager' ? `${this.apiRoot}/manager` : `${this.apiRoot}/admin`;
  }

  getDashboardSummary(): Observable<{ data: DashboardSummary }> {
    return this.http.get<{ data: DashboardSummary }>(
      `${this.getManageBase()}/dashboard-summary`
    );
  }

  getAnalytics(): Observable<{ data: AdminAnalytics }> {
    return this.http.get<{ data: AdminAnalytics }>(`${this.getManageBase()}/analytics`);
  }

  getAnnouncements(): Observable<{ data: AdminAnnouncement[] }> {
    return this.http.get<{ data: AdminAnnouncement[] }>(`${this.getManageBase()}/announcements`);
  }

  createAnnouncement(payload: {
    title: string;
    content: string;
    type?: string;
    audience?: string;
  }): Observable<{ message: string; data: AdminAnnouncement }> {
    return this.http.post<{ message: string; data: AdminAnnouncement }>(
      `${this.getManageBase()}/announcements`,
      payload
    );
  }

  deleteAnnouncement(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.getManageBase()}/announcements/${id}`);
  }

  getHolidays(): Observable<{ data: AdminHoliday[] }> {
    return this.http.get<{ data: AdminHoliday[] }>(`${this.getManageBase()}/holidays?upcoming=false`);
  }

  createHoliday(payload: {
    name: string;
    startDate: string;
    endDate?: string;
    type?: 'Public' | 'Company' | 'Optional' | 'Festival';
    description?: string;
  }): Observable<{ message: string; data: AdminHoliday }> {
    return this.http.post<{ message: string; data: AdminHoliday }>(
      `${this.getManageBase()}/holidays`,
      payload
    );
  }

  deleteHoliday(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.getManageBase()}/holidays/${id}`);
  }

  getDepartments(): Observable<{ data: DepartmentItem[] }> {
    // Try direct departments route first.
    // If that fails, use admin/departments route.
    return this.http
      .get<{ data: DepartmentItem[] }>(`${this.apiRoot}/departments`)
      .pipe(
        catchError(() =>
          this.http.get<{ data: DepartmentItem[] }>(`${this.apiRoot}/admin/departments`)
        )
      );
  }

  createDepartment(payload: { name: string }): Observable<{ message: string; data: DepartmentItem }> {
    // Same fallback logic for create.
    return this.http
      .post<{ message: string; data: DepartmentItem }>(`${this.apiRoot}/departments`, payload)
      .pipe(
        catchError(() =>
          this.http.post<{ message: string; data: DepartmentItem }>(
            `${this.apiRoot}/admin/departments`,
            payload
          )
        )
      );
  }
}
