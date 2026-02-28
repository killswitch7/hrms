import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Admin, AdminAnnouncement } from '../../../services/admin';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './announcements.html',
  styleUrls: ['./announcements.css'],
})
export class Announcements {
  announcements: AdminAnnouncement[] = [];
  title = '';
  content = '';
  type = 'General';
  audience = 'All';
  loading = false;
  error = '';
  isManager = false;

  constructor(private adminService: Admin, private authService: AuthService) {}

  ngOnInit(): void {
    this.isManager = this.authService.getRole() === 'manager';
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.loading = true;
    this.error = '';
    this.adminService.getAnnouncements().subscribe({
      next: (res) => {
        this.announcements = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load announcements.';
        this.loading = false;
      },
    });
  }

  createAnnouncement() {
    if (this.isManager) return;
    if (!this.title.trim() || !this.content.trim()) {
      this.error = 'Title and content are required.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.adminService
      .createAnnouncement({
        title: this.title,
        content: this.content,
        type: this.type,
        audience: this.audience,
      })
      .subscribe({
        next: () => {
          this.title = '';
          this.content = '';
          this.type = 'General';
          this.audience = 'All';
          this.loadAnnouncements();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to create announcement.';
          this.loading = false;
        },
      });
  }

  deleteAnnouncement(id: string) {
    if (this.isManager) return;
    const ok = window.confirm('Delete this announcement?');
    if (!ok) return;

    this.loading = true;
    this.adminService.deleteAnnouncement(id).subscribe({
      next: () => this.loadAnnouncements(),
      error: (err) => {
        this.error = err?.error?.message || 'Failed to delete announcement.';
        this.loading = false;
      },
    });
  }
}
