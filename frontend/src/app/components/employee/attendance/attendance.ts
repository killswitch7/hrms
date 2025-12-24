// frontend/src/app/components/employee/attendance/attendance.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import {
  AttendanceService,
  AttendanceRecord,
} from '../../../services/attendance';

@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './attendance.html',
  styleUrls: ['./attendance.css'],
})
export class Attendance implements OnInit {
  loading = false;
  error = '';
  success = '';

  records: AttendanceRecord[] = [];
  todayRecord: AttendanceRecord | null = null;

  todayString: string = new Date().toDateString();

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit(): void {
    this.loadAttendance();
  }

  private isSameDay(a: string | Date, b: Date): boolean {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  loadAttendance() {
    console.log('[Attendance] Loading my attendance...');
    this.loading = true;
    this.error = '';
    this.success = '';

    this.attendanceService
      .getMyAttendance()
      .pipe(
        finalize(() => {
          // 🔑 ALWAYS run (success or error), so button never gets stuck
          this.loading = false;
          console.log('[Attendance] loadAttendance finalize, loading =', this.loading);
        })
      )
      .subscribe({
        next: (res) => {
          console.log('[Attendance] GET /attendance response:', res);
          this.records = res.data || [];
          const today = new Date();
          this.todayRecord =
            this.records.find((r) => r.date && this.isSameDay(r.date, today)) ||
            null;
        },
        error: (err) => {
          console.error('[Attendance] Error loading attendance:', err);
          this.error = err.error?.message || 'Failed to load attendance.';
        },
      });
  }

  onCheckIn() {
    console.log('[Attendance] Check In clicked, loading =', this.loading);
    if (this.loading) return;

    this.error = '';
    this.success = '';
    this.loading = true;

    this.attendanceService
      .checkIn()
      .pipe(
        finalize(() => {
          this.loading = false;
          console.log('[Attendance] check-in finalize, loading =', this.loading);
        })
      )
      .subscribe({
        next: (res) => {
          console.log('[Attendance] Check-in response:', res);
          this.success = res.message || 'Checked in successfully';
          this.loadAttendance();
        },
        error: (err) => {
          console.error('[Attendance] Check-in error:', err);
          this.error = err.error?.message || 'Failed to check in.';
        },
      });
  }

  onCheckOut() {
    console.log('[Attendance] Check Out clicked, loading =', this.loading);
    if (this.loading) return;

    this.error = '';
    this.success = '';
    this.loading = true;

    this.attendanceService
      .checkOut()
      .pipe(
        finalize(() => {
          this.loading = false;
          console.log('[Attendance] check-out finalize, loading =', this.loading);
        })
      )
      .subscribe({
        next: (res) => {
          console.log('[Attendance] Check-out response:', res);
          this.success = res.message || 'Checked out successfully';
          this.loadAttendance();
        },
        error: (err) => {
          console.error('[Attendance] Check-out error:', err);
          this.error = err.error?.message || 'Failed to check out.';
        },
      });
  }

  get hasCheckedInToday(): boolean {
    return !!this.todayRecord?.checkIn;
  }

  get hasCheckedOutToday(): boolean {
    return !!this.todayRecord?.checkOut;
  }
}
