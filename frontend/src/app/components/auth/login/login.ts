import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  email: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    this.error = '';

    if (!this.email || !this.password) {
      this.error = 'Please enter both email and password.';
      return;
    }

    this.loading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;

        if (res.requiresOtp) {
          if (!res.email || !res.tempToken) {
            this.error = 'OTP session not ready. Please try login again.';
            return;
          }
          // store temporary login OTP info
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('loginOtpEmail', res.email);
            window.sessionStorage.setItem('loginOtpTempToken', res.tempToken);
          }
          this.router.navigate(['/verify-otp'], { replaceUrl: true });
          return;
        }

        if (!res.token || !res.user) {
          this.error = 'Login response is invalid.';
          return;
        }

        // saveSession is already called inside login(), but this is safe too:
        this.authService.saveSession(res.token, res.user.role, res.user.email);

        if (res.user.role === 'admin') {
          this.router.navigate(['/admin-dashboard'], { replaceUrl: true });
        } else if (res.user.role === 'manager') {
          this.router.navigate(['/manager-dashboard'], { replaceUrl: true });
        } else {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        }
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err.error?.message || 'Login failed. Please check your credentials.';
        console.error('Login error:', err);
      },
    });
  }
}
