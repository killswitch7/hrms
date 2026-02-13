import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeDashboardService } from '../../../services/employee-dashboard';

interface NotificationItem {
  title: string;
  message: string;
  type: 'info' | 'warning';
  createdAt: string | Date;
  read: boolean;
}

@Component({
  selector: 'app-employee-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css'],
})
export class Notifications {
  notifications: NotificationItem[] = [];
  loading = false;
  error = '';

  constructor(private dashboardService: EmployeeDashboardService) {}

  ngOnInit(): void {
    this.loading = true;
    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        const notices = res.data?.announcements || [];
        this.notifications = notices.map((n, index) => ({
          title: n.title,
          message: n.content,
          type: n.title?.toLowerCase().includes('maintenance') ? 'warning' : 'info',
          createdAt: n.createdAt,
          read: index !== 0,
        }));
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load notifications.';
        this.loading = false;
      },
    });
  }

  markAllRead() {
    this.notifications.forEach((n) => (n.read = true));
  }
}
