import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Admin, AdminHoliday } from '../../../services/admin';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-admin-holidays',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './holidays.html',
  styleUrls: ['./holidays.css'],
})
export class AdminHolidays {
  holidays: AdminHoliday[] = [];
  loading = false;
  error = '';

  name = '';
  startDate = '';
  endDate = '';
  type: 'Public' | 'Company' | 'Optional' | 'Festival' = 'Public';
  description = '';
  isManager = false;

  constructor(private adminService: Admin, private authService: AuthService) {}

  ngOnInit(): void {
    this.isManager = this.authService.getRole() === 'manager';
    this.loadHolidays();
  }

  loadHolidays() {
    this.loading = true;
    this.error = '';
    this.adminService.getHolidays().subscribe({
      next: (res) => {
        this.holidays = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load holidays.';
        this.loading = false;
      },
    });
  }

  addHoliday() {
    if (this.isManager) return;
    if (!this.name.trim() || !this.startDate) {
      this.error = 'Holiday name and start date are required.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.adminService
      .createHoliday({
        name: this.name.trim(),
        startDate: this.startDate,
        endDate: this.endDate || this.startDate,
        type: this.type,
        description: this.description.trim(),
      })
      .subscribe({
        next: () => {
          this.name = '';
          this.startDate = '';
          this.endDate = '';
          this.type = 'Public';
          this.description = '';
          this.loadHolidays();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to add holiday.';
          this.loading = false;
        },
      });
  }

  deleteHoliday(id: string) {
    if (this.isManager) return;
    if (!window.confirm('Delete this holiday?')) return;
    this.loading = true;
    this.adminService.deleteHoliday(id).subscribe({
      next: () => this.loadHolidays(),
      error: (err) => {
        this.error = err?.error?.message || 'Failed to delete holiday.';
        this.loading = false;
      },
    });
  }
}
