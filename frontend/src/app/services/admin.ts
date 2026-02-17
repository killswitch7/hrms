import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  date: string;
  type: 'Public' | 'Company' | 'Optional' | 'Festival';
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Admin {
  private http = inject(HttpClient);
  private adminBase = 'http://localhost:5001/api/admin';

  getDashboardSummary(): Observable<{ data: DashboardSummary }> {
    return this.http.get<{ data: DashboardSummary }>(
      `${this.adminBase}/dashboard-summary`
    );
  }

  getAnalytics(): Observable<{ data: AdminAnalytics }> {
    return this.http.get<{ data: AdminAnalytics }>(`${this.adminBase}/analytics`);
  }

  getAnnouncements(): Observable<{ data: AdminAnnouncement[] }> {
    return this.http.get<{ data: AdminAnnouncement[] }>(`${this.adminBase}/announcements`);
  }

  createAnnouncement(payload: {
    title: string;
    content: string;
    type?: string;
    audience?: string;
  }): Observable<{ message: string; data: AdminAnnouncement }> {
    return this.http.post<{ message: string; data: AdminAnnouncement }>(
      `${this.adminBase}/announcements`,
      payload
    );
  }

  deleteAnnouncement(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.adminBase}/announcements/${id}`);
  }

  getHolidays(): Observable<{ data: AdminHoliday[] }> {
    return this.http.get<{ data: AdminHoliday[] }>(`${this.adminBase}/holidays?upcoming=false`);
  }

  createHoliday(payload: {
    name: string;
    date: string;
    type?: 'Public' | 'Company' | 'Optional' | 'Festival';
    description?: string;
  }): Observable<{ message: string; data: AdminHoliday }> {
    return this.http.post<{ message: string; data: AdminHoliday }>(
      `${this.adminBase}/holidays`,
      payload
    );
  }

  deleteHoliday(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.adminBase}/holidays/${id}`);
  }
}
