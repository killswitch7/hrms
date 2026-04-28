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
  // Keep validation regex in one place
  private readonly dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  private readonly reasonRegex = /^[A-Za-z0-9][A-Za-z0-9\s.,'()&-]{2,249}$/;

  // Leave form model
  leaveType: string = 'Annual';
  leaveFromDate: string = '';
  leaveToDate: string = '';
  leaveOneDay: boolean = false;
  leaveReason: string = '';

  leaveRequests: LeaveRequest[] = [];
  loadingLeave: boolean = false;
  errorLeave: string = '';
  warningLeave: string = '';
  successLeave: string = '';

  // WFH form model
  wfhFromDate: string = '';
  wfhToDate: string = '';
  wfhOneDay: boolean = false;
  wfhReason: string = '';

  wfhRequests: WfhRequest[] = [];
  loadingWfh: boolean = false;
  errorWfh: string = '';
  warningWfh: string = '';
  successWfh: string = '';

  constructor(private leaveService: LeaveService) {}

  ngOnInit() {
    this.loadMyLeaveRequests();
    this.loadMyWfhRequests();
  }

  // Load my leave requests
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

  // Load my WFH requests
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

  // Submit leave form
  submitLeave() {
    this.errorLeave = '';
    this.warningLeave = '';
    this.successLeave = '';

    if (!this.leaveFromDate) {
      this.warningLeave = 'Please select from date for leave.';
      return;
    }
    if (!this.dateRegex.test(this.leaveFromDate)) {
      this.warningLeave = 'From date format is invalid.';
      return;
    }
    if (!['Annual', 'Sick', 'Casual', 'Other'].includes(this.leaveType)) {
      this.warningLeave = 'Please select a valid leave type.';
      return;
    }
    const finalLeaveToDate = this.leaveOneDay ? this.leaveFromDate : this.leaveToDate;
    if (!this.leaveOneDay && !this.leaveToDate) {
      this.warningLeave = 'Please select to date for leave.';
      return;
    }
    if (!this.dateRegex.test(finalLeaveToDate)) {
      this.warningLeave = 'To date format is invalid.';
      return;
    }
    if (finalLeaveToDate < this.leaveFromDate) {
      this.warningLeave = 'Leave "To Date" cannot be before "From Date".';
      return;
    }
    if (!(this.leaveReason || '').trim()) {
      this.warningLeave = 'Please enter reason for leave.';
      return;
    }
    if ((this.leaveReason || '').trim().length < 3) {
      this.warningLeave = 'Leave reason must be at least 3 characters.';
      return;
    }
    if ((this.leaveReason || '').trim().length > 250) {
      this.warningLeave = 'Leave reason is too long. Please keep it under 250 characters.';
      return;
    }
    if (!this.reasonRegex.test((this.leaveReason || '').trim())) {
      this.warningLeave = 'Reason must use letters/numbers and basic punctuation only.';
      return;
    }

    this.loadingLeave = true;

    this.leaveService
      .createLeave({
        from: this.leaveFromDate,
        to: finalLeaveToDate,
        type: this.leaveType,
        reason: this.leaveReason.trim(),
      })
      .subscribe({
        next: (res) => {
          this.loadingLeave = false;
          this.successLeave = res.message || 'Leave request submitted';

          // Clear form after success
          this.leaveFromDate = '';
          this.leaveToDate = '';
          this.leaveOneDay = false;
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

  // Submit WFH form
  submitWfh() {
    this.errorWfh = '';
    this.warningWfh = '';
    this.successWfh = '';

    if (!this.wfhFromDate) {
      this.warningWfh = 'Please select from date for WFH.';
      return;
    }
    if (!this.dateRegex.test(this.wfhFromDate)) {
      this.warningWfh = 'From date format is invalid.';
      return;
    }
    const finalWfhToDate = this.wfhOneDay ? this.wfhFromDate : this.wfhToDate;
    if (!this.wfhOneDay && !this.wfhToDate) {
      this.warningWfh = 'Please select to date for WFH.';
      return;
    }
    if (!this.dateRegex.test(finalWfhToDate)) {
      this.warningWfh = 'To date format is invalid.';
      return;
    }
    if (finalWfhToDate < this.wfhFromDate) {
      this.warningWfh = 'WFH "To Date" cannot be before "From Date".';
      return;
    }
    if (!(this.wfhReason || '').trim()) {
      this.warningWfh = 'Please enter reason for WFH.';
      return;
    }
    if ((this.wfhReason || '').trim().length < 3) {
      this.warningWfh = 'WFH reason must be at least 3 characters.';
      return;
    }
    if ((this.wfhReason || '').trim().length > 250) {
      this.warningWfh = 'WFH reason is too long. Please keep it under 250 characters.';
      return;
    }
    if (!this.reasonRegex.test((this.wfhReason || '').trim())) {
      this.warningWfh = 'Reason must use letters/numbers and basic punctuation only.';
      return;
    }

    this.loadingWfh = true;

    this.leaveService
      .createWfh({
        from: this.wfhFromDate,
        to: finalWfhToDate,
        reason: this.wfhReason.trim(),
      })
      .subscribe({
        next: (res) => {
          this.loadingWfh = false;
          this.successWfh = res.message || 'WFH request submitted';

          // Clear form after success
          this.wfhFromDate = '';
          this.wfhToDate = '';
          this.wfhOneDay = false;
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

  onLeaveOneDayChange() {
    if (this.leaveOneDay) {
      this.leaveToDate = this.leaveFromDate;
    }
  }

  onWfhOneDayChange() {
    if (this.wfhOneDay) {
      this.wfhToDate = this.wfhFromDate;
    }
  }
}
