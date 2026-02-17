import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Admin, AdminHoliday } from '../../../services/admin';

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
  date = '';
  type: 'Public' | 'Company' | 'Optional' | 'Festival' = 'Public';
  description = '';

  constructor(private adminService: Admin) {}

  ngOnInit(): void {
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
    if (!this.name.trim() || !this.date) {
      this.error = 'Holiday name and date are required.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.adminService
      .createHoliday({
        name: this.name.trim(),
        date: this.date,
        type: this.type,
        description: this.description.trim(),
      })
      .subscribe({
        next: () => {
          this.name = '';
          this.date = '';
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
