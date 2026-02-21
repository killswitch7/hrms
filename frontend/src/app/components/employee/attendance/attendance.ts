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
  calendarDate = new Date();
  calendarCells: Array<{
    date: Date;
    inMonth: boolean;
    isToday: boolean;
    status: 'Present' | 'WFH' | 'Absent' | '';
  }> = [];

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
    // Load my attendance list
    this.loading = true;
    this.error = '';
    this.success = '';

    this.attendanceService
      .getMyAttendance()
      .pipe(
        finalize(() => {
          // Always stop loading even if API fails
          this.loading = false;
        })
      )
      .subscribe({
        next: (res) => {
          this.records = res.data || [];
          const today = new Date();
          this.todayRecord =
            this.records.find((r) => r.date && this.isSameDay(r.date, today)) ||
            null;
          this.buildCalendar();
        },
        error: (err) => {
          console.error('Error loading attendance:', err);
          this.error = err.error?.message || 'Failed to load attendance.';
        },
      });
  }

  onCheckIn() {
    if (this.loading) return;

    this.error = '';
    this.success = '';
    this.loading = true;

    this.attendanceService
      .checkIn()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (res) => {
          this.success = res.message || 'Checked in successfully';
          this.loadAttendance();
        },
        error: (err) => {
          console.error('Check-in error:', err);
          this.error = err.error?.message || 'Failed to check in.';
        },
      });
  }

  onCheckOut() {
    if (this.loading) return;

    this.error = '';
    this.success = '';
    this.loading = true;

    this.attendanceService
      .checkOut()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (res) => {
          this.success = res.message || 'Checked out successfully';
          this.loadAttendance();
        },
        error: (err) => {
          console.error('Check-out error:', err);
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

  previousMonth() {
    // Go to previous month in calendar
    this.calendarDate = new Date(
      this.calendarDate.getFullYear(),
      this.calendarDate.getMonth() - 1,
      1
    );
    this.buildCalendar();
  }

  nextMonth() {
    // Go to next month in calendar
    this.calendarDate = new Date(
      this.calendarDate.getFullYear(),
      this.calendarDate.getMonth() + 1,
      1
    );
    this.buildCalendar();
  }

  private buildCalendar() {
    // Make 6x7 calendar cells for selected month
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());

    const today = new Date();
    const cells: Array<{
      date: Date;
      inMonth: boolean;
      isToday: boolean;
      status: 'Present' | 'WFH' | 'Absent' | '';
    }> = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);

      const rec = this.records.find((r) => r.date && this.isSameDay(r.date, date));
      const inMonth = date.getMonth() === month;
      const isToday = this.isSameDay(date, today);
      const isPastOrToday =
        new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() <=
        new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

      let status: 'Present' | 'WFH' | 'Absent' | '' = '';
      if (rec) {
        status = (rec.status as 'Present' | 'WFH') || 'Present';
      } else if (inMonth && isPastOrToday) {
        status = 'Absent';
      }

      cells.push({ date, inMonth, isToday, status });
    }

    this.calendarCells = cells;
  }
}
