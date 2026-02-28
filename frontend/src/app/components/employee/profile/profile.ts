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
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile implements OnInit {
  profile = {
    name: 'Employee',
    email: '',
    position: 'Employee', // designation
    department: 'N/A',
    employeeId: 'N/A',
    joinDate: new Date().toISOString(),
    phone: '',
  };

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

  avatarUrl: string | null = null;
  error = '';

  constructor(
    private authService: AuthService,
    private avatarService: AvatarService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    const email = this.authService.getEmail() || '';
    this.profile.email = email;
    this.avatarUrl = this.avatarService.get('employee', email);
    this.loadProfile();
  }

  loadProfile() {
    this.error = '';
    this.profileService.getMyProfile().subscribe({
      next: (res) => {
        const data = res.data;
        this.profile.name = data.name || this.profile.name;
        this.profile.email = data.email || this.profile.email;
        this.profile.position = data.designation || 'Employee';
        this.profile.department = data.department || 'N/A';
        this.profile.employeeId = data.employeeId || 'N/A';
        this.profile.joinDate = String(data.joinDate || this.profile.joinDate);
        this.profile.phone = data.phone || '';

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

        this.avatarUrl = this.avatarService.get('employee', this.profile.email);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load profile data.';
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
      this.avatarService.set('employee', this.profile.email, result);
    };
    reader.readAsDataURL(file);
  }

  removeAvatar() {
    this.avatarUrl = null;
    this.avatarService.clear('employee', this.profile.email);
  }
}
