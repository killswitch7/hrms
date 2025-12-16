// src/app/components/admin/admin-dashboard/admin-dashboard.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admindashboard.html',
  styleUrls: ['./admindashboard.css']
})
export class AdminDashboard {

  analytics = {
    totalEmployees: 50,
    presentToday: 42,
    pendingLeaves: 5,
    approvedLeaves: 20,
    attendanceRate: 84,
    leaveApprovalRate: 80
  };

  userProfile = {
    name: 'Admin User',
    email: 'admin@company.com',
    lastLogin: new Date().toLocaleString()
  };

  menuItems = [
    { icon: '👥', label: 'Employees', page: '/employees' },
    { icon: '📅', label: 'Attendance Logs', page: '/attendance' },
    { icon: '✅', label: 'Leave Approvals', page: '/leave-approvals' },
    { icon: '💲', label: 'Payroll', page: '/payroll' },
    { icon: '🔔', label: 'Announcements', page: '/announcements' },
    { icon: '📊', label: 'Analytics', page: '/analytics' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  // used by the tool cards and Profile button
  navigateTo(page: string) {
    this.router.navigate([page]);
  }

  onLogout() {
    console.log('Logging out from admin...');
    this.authService.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
