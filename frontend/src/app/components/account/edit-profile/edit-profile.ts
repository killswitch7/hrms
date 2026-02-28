import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../../services/profile';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.html',
  styleUrls: ['./edit-profile.css'],
})
export class EditProfilePage implements OnInit {
  loading = false;
  saving = false;
  error = '';
  success = '';

  form = {
    firstName: '',
    lastName: '',
    phone: '',
    designation: '',
  };

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.profileService.getMyProfile().subscribe({
      next: (res) => {
        const data = res.data;
        this.form.firstName = data.firstName || '';
        this.form.lastName = data.lastName || '';
        this.form.phone = data.phone || '';
        this.form.designation = data.designation || '';
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load profile.';
        this.loading = false;
      },
    });
  }

  save() {
    this.saving = true;
    this.error = '';
    this.success = '';
    this.profileService.updateMyProfile(this.form).subscribe({
      next: (res) => {
        this.success = res.message || 'Profile updated successfully.';
        this.saving = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to update profile.';
        this.saving = false;
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

