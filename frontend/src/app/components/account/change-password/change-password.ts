import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../../services/profile';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-change-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.css'],
})
export class ChangePasswordPage {
  changing = false;
  error = '';
  success = '';

  form = {
    currentPassword: '',
    newPassword: '',
  };

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  submit() {
    if (!this.form.currentPassword || !this.form.newPassword) {
      this.error = 'Current password and new password are required.';
      return;
    }
    this.changing = true;
    this.error = '';
    this.success = '';

    this.profileService.changeMyPassword(this.form).subscribe({
      next: (res) => {
        this.success = res.message || 'Password changed successfully.';
        this.form.currentPassword = '';
        this.form.newPassword = '';
        this.changing = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to change password.';
        this.changing = false;
      },
    });
  }

  backToProfile() {
    const role = this.authService.getRole();
    if (role === 'manager' || role === 'admin') {
      this.router.navigate(['/admin-profile']);
      return;
    }
    this.router.navigate(['/employee-profile']);
  }
}

