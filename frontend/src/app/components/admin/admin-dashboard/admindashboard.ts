// frontend/src/app/components/admin/admin-dashboard/admindashboard.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Admin, DashboardSummary } from '../../../services/admin';
import { AvatarService } from '../../../services/avatar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-admin-dashboard',
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
  templateUrl: './admindashboard.html',
  styleUrls: ['./admindashboard.css'],
})
export class AdminDashboard implements OnInit {
  // Numbers for cards
  analytics: DashboardSummary = {
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    attendanceRate: 0,
    leaveApprovalRate: 0,
    generatedAt: new Date().toISOString(),
    recentEmployees: [],
  };

  // Top bar user data
  userProfile = {
    name: 'Admin',
    email: '',
    role: 'admin',
    department: '',
    lastLogin: new Date().toLocaleString(),
  };

  loading = false;
  error = '';
  avatarUrl: string | null = null;
  isManager = false;

  // Admin tool buttons
  adminMenuItems = [
    { icon: 'groups', label: 'Employees', page: '/employees' },
    { icon: 'domain', label: 'Departments', page: '/departments' },
    { icon: 'person_add', label: 'Register Employee', page: '/register-employee' },
    { icon: 'event_note', label: 'Attendance Logs', page: '/attendance' },
    { icon: 'task_alt', label: 'Leave Approvals', page: '/leave-approvals' },
    { icon: 'payments', label: 'Payroll', page: '/payroll' },
    { icon: 'celebration', label: 'Holidays', page: '/holidays' },
    { icon: 'campaign', label: 'Announcements', page: '/announcements' },
    { icon: 'query_stats', label: 'Analytics', page: '/analytics' },
    { icon: 'description', label: 'Document Requests', page: '/hr-documents' },
  ];
  // Manager tool buttons
  managerMenuItems = [
    { icon: 'access_time', label: 'My Attendance', page: '/manager-attendance' },
    { icon: 'home_work', label: 'My Leave & WFH', page: '/manager-leave' },
    { icon: 'description', label: 'My Documents', page: '/manager-documents' },
    { icon: 'groups', label: 'Employees', page: '/employees' },
    { icon: 'event_note', label: 'Attendance Logs', page: '/attendance' },
    { icon: 'task_alt', label: 'Leave Approvals', page: '/leave-approvals' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private adminService: Admin,
    private avatarService: AvatarService
  ) {}

  ngOnInit(): void {
    // Check role and load profile basics
    this.isManager = this.authService.getRole() === 'manager';
    const email = this.authService.getEmail() || 'admin@company.com';
    const firstPart = email.split('@')[0] || 'Admin';
    this.userProfile.email = email;
    this.userProfile.role = this.isManager ? 'manager' : 'admin';
    this.userProfile.name = firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
    this.avatarUrl = this.avatarService.get(this.isManager ? 'manager' : 'admin', email);

    // Load dashboard numbers
    this.loadDashboardSummary();
  }

  get menuItems() {
    return this.isManager ? this.managerMenuItems : this.adminMenuItems;
  }

  loadDashboardSummary() {
    // Call backend and fill cards
    this.loading = true;
    this.error = '';

    this.adminService.getDashboardSummary().subscribe({
      next: (res) => {
        this.analytics = res.data || this.analytics;
        this.userProfile.department = (res.data as any)?.department || '';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load dashboard data.';
        this.loading = false;
      },
    });
  }

  goTo(page: string) {
    // Simple route navigation helper
    this.router.navigate([page]);
  }

  onLogout() {
    // Clear session and go to login
    this.authService.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  onAvatarSelected(event: Event) {
    // Save selected image in local storage
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
      this.avatarService.set(this.isManager ? 'manager' : 'admin', this.userProfile.email, result);
    };
    reader.readAsDataURL(file);
  }

  removeAvatar() {
    this.avatarUrl = null;
    this.avatarService.clear(this.isManager ? 'manager' : 'admin', this.userProfile.email);
  }
}
