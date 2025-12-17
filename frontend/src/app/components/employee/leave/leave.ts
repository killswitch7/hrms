// frontend/src/app/components/employee/leave/leave.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { LeaveService, LeaveRequest, WfhRequest } from '../../../services/leave';

@Component({
  selector: 'app-employee-leave',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  providers: [DatePipe],
  templateUrl: './leave.html',
  styleUrls: ['./leave.css'],
})
export class Leave implements OnInit {
  // ---------- LEAVE FORM ----------
  leaveType: string = 'Annual';
  leaveFromDate: string = '';
  leaveToDate: string = '';
  leaveReason: string = '';

  leaveRequests: LeaveRequest[] = [];
  loadingLeave: boolean = false;
  errorLeave: string = '';
  successLeave: string = '';

  // ---------- WFH FORM ----------
  wfhFromDate: string = '';
  wfhToDate: string = '';
  wfhReason: string = '';

  wfhRequests: WfhRequest[] = [];
  loadingWfh: boolean = false;
  errorWfh: string = '';
  successWfh: string = '';

  constructor(private leaveService: LeaveService) {}

  ngOnInit() {
    this.loadMyLeaveRequests();
    this.loadMyWfhRequests();
  }

  // ---------- LOADERS ----------

  loadMyLeaveRequests() {
    this.loadingLeave = true;
    this.errorLeave = '';

    this.leaveService.getMyLeaveRequests().subscribe({
      next: (res) => {
        this.leaveRequests = res.data || [];
        this.loadingLeave = false;
      },
      error: (err) => {
        console.error('Error loading leave requests:', err);
        this.errorLeave = err.error?.message || 'Failed to load leave requests.';
        this.loadingLeave = false;
      },
    });
  }

  loadMyWfhRequests() {
    this.loadingWfh = true;
    this.errorWfh = '';

    this.leaveService.getMyWfhRequests().subscribe({
      next: (res) => {
        this.wfhRequests = res.data || [];
        this.loadingWfh = false;
      },
      error: (err) => {
        console.error('Error loading WFH requests:', err);
        this.errorWfh = err.error?.message || 'Failed to load WFH requests.';
        this.loadingWfh = false;
      },
    });
  }

  // ---------- SUBMIT LEAVE ----------

  submitLeave() {
    this.errorLeave = '';
    this.successLeave = '';

    if (!this.leaveFromDate || !this.leaveToDate) {
      this.errorLeave = 'Please select both from and to dates for leave.';
      return;
    }

    this.loadingLeave = true;

    this.leaveService
      .createLeave({
        from: this.leaveFromDate,
        to: this.leaveToDate,
        type: this.leaveType,
        reason: this.leaveReason,
      })
      .subscribe({
        next: (res) => {
          this.loadingLeave = false;
          this.successLeave = res.message || 'Leave request submitted';

          // Reset form
          this.leaveFromDate = '';
          this.leaveToDate = '';
          this.leaveReason = '';
          this.leaveType = 'Annual';

          // Reload list
          this.loadMyLeaveRequests();
        },
        error: (err) => {
          this.loadingLeave = false;
          console.error('Error submitting leave:', err);
          this.errorLeave = err.error?.message || 'Failed to submit leave request.';
        },
      });
  }

  // ---------- SUBMIT WFH ----------

  submitWfh() {
    this.errorWfh = '';
    this.successWfh = '';

    if (!this.wfhFromDate || !this.wfhToDate) {
      this.errorWfh = 'Please select both from and to dates for WFH.';
      return;
    }

    this.loadingWfh = true;

    this.leaveService
      .createWfh({
        from: this.wfhFromDate,
        to: this.wfhToDate,
        reason: this.wfhReason,
      })
      .subscribe({
        next: (res) => {
          this.loadingWfh = false;
          this.successWfh = res.message || 'WFH request submitted';

          // Reset form
          this.wfhFromDate = '';
          this.wfhToDate = '';
          this.wfhReason = '';

          // Reload list
          this.loadMyWfhRequests();
        },
        error: (err) => {
          this.loadingWfh = false;
          console.error('Error submitting WFH:', err);
          this.errorWfh = err.error?.message || 'Failed to submit WFH request.';
        },
      });
  }
}
