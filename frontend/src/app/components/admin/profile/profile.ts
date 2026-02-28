import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth';
import { AvatarService } from '../../../services/avatar';
import { ProfileService } from '../../../services/profile';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class AdminProfile implements OnInit {
  profile = {
    name: 'Admin',
    email: '',
    role: 'admin',
    lastLogin: new Date().toLocaleString(),
  };

  avatarUrl: string | null = null;
  error = '';
  isManager = false;

  leaveInfo = {
    annualAllowance: 24,
    used: 0,
    remaining: 24,
  };

  salaryInfo = {
    annualSalary: 0,
    monthlyBeforeTax: 0,
    filingStatus: 'unmarried',
    latestMonth: '',
    latestGrossPay: 0,
    latestTax: 0,
    latestDeductions: 0,
    latestNetPay: 0,
    latestStatus: '',
  };

  constructor(
    private authService: AuthService,
    private avatarService: AvatarService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.isManager = this.authService.getRole() === 'manager';
    const email = this.authService.getEmail() || 'admin@company.com';
    const baseName = email.split('@')[0] || 'Admin';
    this.profile.email = email;
    this.profile.name = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    this.profile.role = this.isManager ? 'manager' : 'admin';
    this.avatarUrl = this.avatarService.get(this.isManager ? 'manager' : 'admin', email);
    if (this.isManager) this.loadManagerProfile();
  }

  loadManagerProfile() {
    this.error = '';
    this.profileService.getMyProfile().subscribe({
      next: (res) => {
        const data = res.data;
        this.profile.name = data.name || this.profile.name;
        this.profile.email = data.email || this.profile.email;

        this.leaveInfo = data.leave || this.leaveInfo;
        this.salaryInfo.annualSalary = data.salary?.annualSalary || 0;
        this.salaryInfo.monthlyBeforeTax = data.salary?.monthlyBeforeTax || 0;
        this.salaryInfo.filingStatus = data.salary?.filingStatus || 'unmarried';
        this.salaryInfo.latestMonth = data.salary?.latestPayroll?.month || '';
        this.salaryInfo.latestGrossPay = data.salary?.latestPayroll?.grossPay || 0;
        this.salaryInfo.latestTax = data.salary?.latestPayroll?.taxDeduction || 0;
        this.salaryInfo.latestDeductions = data.salary?.latestPayroll?.deductions || 0;
        this.salaryInfo.latestNetPay = data.salary?.latestPayroll?.netPay || 0;
        this.salaryInfo.latestStatus = data.salary?.latestPayroll?.status || '';

      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load manager profile.';
      },
    });
  }

  onAvatarSelected(event: Event) {
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
      this.avatarService.set(this.isManager ? 'manager' : 'admin', this.profile.email, result);
    };
    reader.readAsDataURL(file);
  }

  removeAvatar() {
    this.avatarUrl = null;
    this.avatarService.clear(this.isManager ? 'manager' : 'admin', this.profile.email);
  }
}
