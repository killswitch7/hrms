import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './password-reset.html',
  styleUrls: ['./password-reset.css']
})
export class PasswordReset {
  email = '';
  constructor(private router: Router) {}

  onSubmit() {
    // After reset request, navigate to OTP
    this.router.navigate(['/otp']);
  }
}
