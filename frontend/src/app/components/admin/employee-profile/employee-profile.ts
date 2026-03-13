import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EmployeeService, EmployeeProfileResponse } from '../../../services/employee';
import { AvatarService } from '../../../services/avatar';

@Component({
  selector: 'app-admin-employee-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './employee-profile.html',
  styleUrl: './employee-profile.css',
})
export class AdminEmployeeProfile {
  loading = false;
  error = '';
  profile: EmployeeProfileResponse['data'] | null = null;
  avatarUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private avatarService: AvatarService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    if (!id) {
      this.error = 'Employee id is missing.';
      return;
    }
    this.loadProfile(id);
  }

  loadProfile(id: string) {
    this.loading = true;
    this.error = '';
    this.employeeService.getEmployeeProfile(id).subscribe({
      next: (res) => {
        this.profile = res.data;
        const avatarKey = this.profile.role === 'manager' ? 'manager' : 'employee';
        this.avatarUrl = this.avatarService.get(avatarKey as 'manager' | 'employee', this.profile.email);
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load profile.';
        this.loading = false;
      },
    });
  }

  back() {
    this.router.navigate(['/employees']);
  }
}
