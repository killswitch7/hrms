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
    if (!this.email) {
      this.error = 'Please enter email.';
      return;
    }
    this.loading = true;
    this.authService.requestForgotPasswordOtp(this.email).subscribe({
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
    this.loading = true;
    this.authService
      .resetForgotPassword({
        email: this.email,
        otp: this.otp,
        newPassword: this.newPassword,
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
