// frontend/src/app/components/admin/attendance/attendance.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // 👈 add this
import {
  AttendanceService,
  AttendanceRecord,
} from '../../../services/attendance';

@Component({
  selector: 'app-admin-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],   // 👈 include FormsModule here
  templateUrl: './attendance.html',
  styleUrls: ['./attendance.css'],
})
export class AdminAttendance implements OnInit {
  records: AttendanceRecord[] = [];
  loading = false;
  error = '';

  filterFrom: string = '';
  filterTo: string = '';
  filterEmployeeId: string = '';
  filterRole: string = '';

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.filterFrom = today;
    this.filterTo = today;
    this.loadAttendance();
  }

  loadAttendance() {
    this.loading = true;
    this.error = '';

    this.attendanceService
      .getAllAttendance(
        this.filterFrom,
        this.filterTo,
        this.filterEmployeeId,
        this.filterRole
      )
      .subscribe({
        next: (res) => {
          this.records = res.data || [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading admin attendance:', err);
          this.error = err.error?.message || 'Failed to load attendance logs.';
          this.loading = false;
        },
      });
  }

  onApplyFilter() {
    this.loadAttendance();
  }

  onClearFilter() {
    this.filterFrom = '';
    this.filterTo = '';
    this.filterEmployeeId = '';
    this.filterRole = '';
    this.loadAttendance();
  }
}
