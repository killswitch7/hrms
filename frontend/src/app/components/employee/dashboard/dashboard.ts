// src/app/components/employee/dashboard.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';
import {
  EmployeeDashboardNotice,
  EmployeeDashboardService,
} from '../../../services/employee-dashboard';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [DatePipe],
})
export class Dashboard implements OnInit {
  userProfile = {
    name: 'Employee',
    position: 'Employee',
    email: '',
  };

  stats = {
    leaveBalance: 0,
    attendance: 0,
    notifications: 0,
  };

  todayAttendance = {
    status: 'Not Checked In',
    time: null as string | null,
    checkIn: null as string | null,
    checkOut: null as string | null,
  };

  announcements: EmployeeDashboardNotice[] = [];
  loading = false;
  error = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private dashboardService: EmployeeDashboardService
  ) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary() {
    this.loading = true;
    this.error = '';

    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        const data = res.data;
        this.userProfile = data.userProfile;
        this.stats = data.stats;
        this.todayAttendance = data.todayAttendance;
        this.announcements = data.announcements || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load dashboard data.';
        this.loading = false;
      },
    });
  }

  onLogout() {
    console.log('Logout clicked, clearing session and redirecting to login');
    this.authService.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  navigateTo(page: string) {
    this.router.navigate([page]);
  }
}
