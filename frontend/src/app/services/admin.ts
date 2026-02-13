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
}
