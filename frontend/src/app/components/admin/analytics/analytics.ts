import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Admin, AdminAnalytics } from '../../../services/admin';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './analytics.html',
  styleUrl: './analytics-page.css',
})
export class Analytics {
  data: AdminAnalytics | null = null;
  loading = false;
  error = '';
  attendanceChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Absent', 'Present'],
    datasets: [{ data: [0, 0] }],
  };
  leaveChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Pending', 'Approved'],
    datasets: [{ label: 'Leave Requests', data: [0, 0] }],
  };
  readonly attendanceChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };
  readonly leaveChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    plugins: { legend: { display: false } },
  };

  constructor(private adminService: Admin) {}

  ngOnInit(): void {
    this.loading = true;
    this.adminService.getAnalytics().subscribe({
      next: (res) => {
        this.data = res.data;
        this.buildCharts();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load analytics.';
        this.loading = false;
      },
    });
  }

  private buildCharts(): void {
    if (!this.data) return;

    const present = this.data.presentToday || 0;
    const total = this.data.totalEmployees || 0;
    const absent = Math.max(0, total - present);

    this.attendanceChartData = {
      labels: ['Absent', 'Present'],
      datasets: [
        {
          data: [absent, present],
          backgroundColor: ['#ef4444', '#10b981'],
          borderWidth: 0,
        },
      ],
    };

    this.leaveChartData = {
      labels: ['Pending', 'Approved'],
      datasets: [
        {
          label: 'Leave Requests',
          data: [
            this.data.leave.pending || 0,
            this.data.leave.approved || 0,
          ],
          backgroundColor: ['#f59e0b', '#2563eb'],
          borderRadius: 8,
        },
      ],
    };
  }
}
