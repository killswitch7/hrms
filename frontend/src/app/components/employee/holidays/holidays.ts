import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeDashboardService } from '../../../services/employee-dashboard';

@Component({
  selector: 'app-employee-holidays',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './holidays.html',
  styleUrls: ['./holidays.css'],
})
export class Holidays {
  holidays: Array<{ name: string; date: string | Date; type: string }> = [];
  loading = false;
  error = '';

  constructor(private dashboardService: EmployeeDashboardService) {}

  ngOnInit(): void {
    this.loading = true;
    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        const notices = res.data?.announcements || [];
        this.holidays = notices
          .filter((x) => x.title?.toLowerCase().includes('holiday'))
          .map((x) => ({
            name: x.content?.split(' on ')[0] || x.title,
            date: x.createdAt,
            type: 'Company Holiday',
          }));
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load holidays.';
        this.loading = false;
      },
    });
  }
}
