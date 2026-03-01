import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css',
})
export class VerifyOtp {
  email = '';
  tempToken = '';
  otp = '';
  loading = false;
  error = '';
  success = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.email = window.sessionStorage.getItem('loginOtpEmail') || '';
      this.tempToken = window.sessionStorage.getItem('loginOtpTempToken') || '';
    }
    if (!this.email || !this.tempToken) {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  verify() {
    this.error = '';
    this.success = '';
    if (!this.otp) {
      this.error = 'Please enter OTP.';
      return;
    }
    this.loading = true;

    this.authService.verifyLoginOtp(this.email, this.otp, this.tempToken).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = 'OTP verified.';
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('loginOtpEmail');
          window.sessionStorage.removeItem('loginOtpTempToken');
        }
        const role = res.user?.role;
        if (role === 'admin') this.router.navigate(['/admin-dashboard'], { replaceUrl: true });
        else if (role === 'manager') this.router.navigate(['/manager-dashboard'], { replaceUrl: true });
        else this.router.navigate(['/dashboard'], { replaceUrl: true });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'OTP verification failed.';
      },
    });
  }

  resend() {
    this.error = '';
    this.success = '';
    this.loading = true;
    this.authService.resendLoginOtp(this.email, this.tempToken).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.message || 'OTP sent again.';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Could not resend OTP.';
      },
    });
  }

  backToLogin() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('loginOtpEmail');
      window.sessionStorage.removeItem('loginOtpTempToken');
    }
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
