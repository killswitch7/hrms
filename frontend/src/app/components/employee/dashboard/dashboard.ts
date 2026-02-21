// src/app/components/employee/dashboard.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';
import {
  EmployeeDashboardNotice,
  EmployeeDashboardService,
} from '../../../services/employee-dashboard';
import { AvatarService } from '../../../services/avatar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatDividerModule,
  ],
  providers: [DatePipe],
})
export class Dashboard implements OnInit {
  // Top bar profile data
  userProfile = {
    name: 'Employee',
    position: 'Employee',
    email: '',
  };

  // Main dashboard numbers
  stats = {
    leaveBalance: 0,
    attendance: 0,
    notifications: 0,
  };

  // Today's check-in/check-out summary
  todayAttendance = {
    status: 'Not Checked In',
    time: null as string | null,
    checkIn: null as string | null,
    checkOut: null as string | null,
  };

  announcements: EmployeeDashboardNotice[] = [];
  loading = false;
  error = '';
  avatarUrl: string | null = null;
  lastUpdated: Date = new Date();

  constructor(
    private router: Router,
    private authService: AuthService,
    private dashboardService: EmployeeDashboardService,
    private avatarService: AvatarService
  ) {}

  ngOnInit(): void {
    // Load dashboard data once page opens
    this.loadSummary();
  }

  loadSummary() {
    // Call backend and fill cards
    this.loading = true;
    this.error = '';

    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        const data = res.data;
        this.userProfile = data.userProfile;
        this.avatarUrl = this.avatarService.get('employee', data.userProfile.email);
        this.stats = data.stats;
        this.todayAttendance = data.todayAttendance;
        this.announcements = data.announcements || [];
        this.lastUpdated = new Date();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load dashboard data.';
        this.loading = false;
      },
    });
  }

  onLogout() {
    // Clear session and go back to login
    this.authService.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  navigateTo(page: string) {
    // Small helper to open another page
    this.router.navigate([page]);
  }

  onAvatarSelected(event: Event) {
    // Save selected profile photo for this user
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error = 'Please select an image file.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.avatarUrl = result;
      this.avatarService.set('employee', this.userProfile.email, result);
    };
    reader.readAsDataURL(file);
  }

  removeAvatar() {
    this.avatarUrl = null;
    this.avatarService.clear('employee', this.userProfile.email);
  }
}
