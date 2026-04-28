// frontend/src/app/components/admin/attendance/attendance.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // 👈 add this
import {
  AttendanceService,
  AttendanceRecord,
} from '../../../services/attendance';
import { AuthService } from '../../../services/auth';

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
  isManagerView = false;
  currentPage = 1;
  pageSize = 10;

  constructor(private attendanceService: AttendanceService, private authService: AuthService) {}

  ngOnInit(): void {
    this.isManagerView = this.authService.getRole() === 'manager';
    // Manager should not switch role in attendance page.
    if (this.isManagerView) {
      this.filterRole = 'employee';
    }
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
        this.isManagerView ? 'employee' : this.filterRole
      )
      .subscribe({
        next: (res) => {
          this.records = res.data || [];
          this.currentPage = 1; // reset page when data changes
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
    this.filterRole = this.isManagerView ? 'employee' : '';
    this.loadAttendance();
  }

  get totalPages(): number {
    const pages = Math.ceil(this.records.length / this.pageSize);
    return pages > 0 ? pages : 1;
  }

  get paginatedRecords(): AttendanceRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.records.slice(start, end);
  }

  goToPrevPage() {
    if (this.currentPage > 1) this.currentPage -= 1;
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) this.currentPage += 1;
  }

  onPageSizeChange() {
    this.currentPage = 1;
  }
}
