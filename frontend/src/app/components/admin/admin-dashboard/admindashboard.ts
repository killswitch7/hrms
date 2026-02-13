// frontend/src/app/components/admin/admin-dashboard/admindashboard.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Admin, DashboardSummary } from '../../../services/admin';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admindashboard.html',
  styleUrls: ['./admindashboard.css'],
})
export class AdminDashboard implements OnInit {
  analytics: DashboardSummary = {
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    attendanceRate: 0,
    leaveApprovalRate: 0,
    generatedAt: new Date().toISOString(),
  };

  userProfile = {
    name: 'Admin',
    email: '',
    lastLogin: new Date().toLocaleString(),
  };

  loading = false;
  error = '';

  menuItems = [
    { icon: '👥', label: 'Employees', page: '/employees' },
    { icon: '➕', label: 'Register Employee', page: '/register-employee' },
    { icon: '📅', label: 'Attendance Logs', page: '/attendance' },
    { icon: '✅', label: 'Leave Approvals', page: '/leave-approvals' },
    { icon: '💲', label: 'Payroll', page: '/payroll' },
    { icon: '🔔', label: 'Announcements', page: '/announcements' },
    { icon: '📊', label: 'Analytics', page: '/analytics' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private adminService: Admin
  ) {}

  ngOnInit(): void {
    const email = this.authService.getEmail() || 'admin@company.com';
    const firstPart = email.split('@')[0] || 'Admin';
    this.userProfile.email = email;
    this.userProfile.name = firstPart.charAt(0).toUpperCase() + firstPart.slice(1);

    this.loadDashboardSummary();
  }

  loadDashboardSummary() {
    this.loading = true;
    this.error = '';

    this.adminService.getDashboardSummary().subscribe({
      next: (res) => {
        this.analytics = res.data || this.analytics;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load dashboard data.';
        this.loading = false;
      },
    });
  }

  goTo(page: string) {
    this.router.navigate([page]);
  }

  onLogout() {
    console.log('Logging out from admin...');
    this.authService.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
