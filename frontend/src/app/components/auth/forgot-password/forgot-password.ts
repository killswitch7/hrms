import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  email = '';
  otp = '';
  newPassword = '';
  loading = false;
  error = '';
  success = '';

  constructor(private authService: AuthService, private router: Router) {}

  requestOtp() {
    this.error = '';
    this.success = '';
    const email = this.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      this.error = 'Please enter email.';
      return;
    }
    if (!emailRegex.test(email)) {
      this.error = 'Please enter a valid email.';
      return;
    }
    this.loading = true;
    this.authService.requestForgotPasswordOtp(email).subscribe({
      next: (res) => {
        this.success = res.message || 'OTP sent.';
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to send OTP.';
        this.loading = false;
      },
    });
  }

  resetPassword() {
    this.error = '';
    this.success = '';
    if (!this.email || !this.otp || !this.newPassword) {
      this.error = 'Email, OTP and new password are required.';
      return;
    }
    const email = this.email.trim().toLowerCase();
    const otp = this.otp.trim();
    const newPassword = this.newPassword;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const otpRegex = /^\d{6}$/;
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

    if (!emailRegex.test(email)) {
      this.error = 'Please enter a valid email.';
      return;
    }
    if (!otpRegex.test(otp)) {
      this.error = 'OTP must be exactly 6 digits.';
      return;
    }
    if (!strongPassword.test(newPassword)) {
      this.error = 'Password must be 8+ chars with uppercase, lowercase and number.';
      return;
    }

    this.loading = true;
    this.authService
      .resetForgotPassword({
        email,
        otp,
        newPassword,
      })
      .subscribe({
        next: (res) => {
          this.success = res.message || 'Password reset successful.';
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to reset password.';
          this.loading = false;
        },
      });
  }

  goToLogin() {
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
