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
  sendingOtp = false;
  error = '';
  success = '';

  form = {
    currentPassword: '',
    newPassword: '',
    otp: '',
  };

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  submit() {
    const currentPassword = this.form.currentPassword;
    const newPassword = this.form.newPassword;
    const otp = this.form.otp.trim();
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;
    const otpRegex = /^\d{6}$/;

    if (!this.form.currentPassword || !this.form.newPassword || !this.form.otp) {
      this.error = 'Current password, new password and OTP are required.';
      return;
    }
    if (currentPassword.length < 6) {
      this.error = 'Current password is too short.';
      return;
    }
    if (!strongPassword.test(newPassword)) {
      this.error = 'New password must be 8+ chars with uppercase, lowercase and number.';
      return;
    }
    if (!otpRegex.test(otp)) {
      this.error = 'OTP must be exactly 6 digits.';
      return;
    }
    this.changing = true;
    this.error = '';
    this.success = '';

    this.profileService
      .changeMyPassword({
        currentPassword,
        newPassword,
        otp,
      })
      .subscribe({
      next: (res) => {
        this.success = res.message || 'Password changed successfully.';
        this.form.currentPassword = '';
        this.form.newPassword = '';
        this.form.otp = '';
        this.changing = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to change password.';
        this.changing = false;
      },
    });
  }

  sendOtp() {
    this.error = '';
    this.success = '';
    this.sendingOtp = true;
    this.profileService.requestChangePasswordOtp().subscribe({
      next: (res) => {
        this.success = res.message || 'OTP sent.';
        this.sendingOtp = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to send OTP.';
        this.sendingOtp = false;
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
