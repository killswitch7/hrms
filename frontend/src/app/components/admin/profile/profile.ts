import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth';
import { AvatarService } from '../../../services/avatar';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class AdminProfile implements OnInit {
  profile = {
    name: 'Admin',
    email: '',
    role: 'admin',
    lastLogin: new Date().toLocaleString(),
  };

  avatarUrl: string | null = null;
  error = '';

  constructor(
    private authService: AuthService,
    private avatarService: AvatarService
  ) {}

  ngOnInit(): void {
    const email = this.authService.getEmail() || 'admin@company.com';
    const baseName = email.split('@')[0] || 'Admin';
    this.profile.email = email;
    this.profile.name = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    this.avatarUrl = this.avatarService.get('admin', email);
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error = 'Please select an image file.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.avatarUrl = result;
      this.avatarService.set('admin', this.profile.email, result);
    };
    reader.readAsDataURL(file);
  }

  removeAvatar() {
    this.avatarUrl = null;
    this.avatarService.clear('admin', this.profile.email);
  }
}
