import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Admin, AdminAnalytics } from '../../../services/admin';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.css'],
})
export class Analytics {
  data: AdminAnalytics | null = null;
  loading = false;
  error = '';

  constructor(private adminService: Admin) {}

  ngOnInit(): void {
    this.loading = true;
    this.adminService.getAnalytics().subscribe({
      next: (res) => {
        this.data = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load analytics.';
        this.loading = false;
      },
    });
  }
}
