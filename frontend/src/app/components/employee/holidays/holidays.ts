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
  holidays: Array<{
    name: string;
    date: string | Date;
    startDate?: string | Date;
    endDate?: string | Date;
    type: string;
  }> = [];
  loading = false;
  error = '';

  constructor(private dashboardService: EmployeeDashboardService) {}

  ngOnInit(): void {
    this.loading = true;
    this.dashboardService.getHolidays().subscribe({
      next: (res) => {
        this.holidays = (res.data || []).map((x) => ({
          name: x.name,
          date: x.startDate || x.date,
          startDate: x.startDate || x.date,
          endDate: x.endDate || x.startDate || x.date,
          type: x.type || 'Company',
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
