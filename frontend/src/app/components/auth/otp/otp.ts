import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './otp.html',
  styleUrls: ['./otp.css']
})
export class Otp {
  otpCode = '';

  onSubmit() {
    alert('OTP verified!');
  }
}
