// frontend/src/app/components/admin/leave-approvals/leave-approvals.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveService, LeaveRequest, WfhRequest } from '../../../services/leave';

@Component({
  selector: 'app-leave-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave.html',
  styleUrls: ['./leave.css'],
})
export class LeaveApprovals implements OnInit {
  activeTab: 'leave' | 'wfh' = 'leave';
  statusFilter: '' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' = 'Pending';
  searchTerm = '';

  // Leave
  leaveRequests: LeaveRequest[] = [];
  loadingLeave = false;
  errorLeave = '';

  // WFH
  wfhRequests: WfhRequest[] = [];
  loadingWfh = false;
  errorWfh = '';

  constructor(private leaveService: LeaveService) {}

  ngOnInit(): void {
    this.loadLeaveRequests();
    this.loadWfhRequests();
  }

  setTab(tab: 'leave' | 'wfh') {
    this.activeTab = tab;
  }

  // ---------- LOADERS ----------

  loadLeaveRequests(status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | '' = this.statusFilter) {
    this.loadingLeave = true;
    this.errorLeave = '';

    this.leaveService.getAllLeaveRequests(status || undefined, this.searchTerm.trim() || undefined).subscribe({
      next: (res) => {
        this.leaveRequests = res.data || [];
        this.loadingLeave = false;
      },
      error: (err) => {
        console.error('Error loading leave requests (admin):', err);
        this.errorLeave = err.error?.message || 'Failed to load leave requests.';
        this.loadingLeave = false;
      },
    });
  }

  loadWfhRequests(status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | '' = this.statusFilter) {
    this.loadingWfh = true;
    this.errorWfh = '';

    this.leaveService.getAllWfhRequests(status || undefined, this.searchTerm.trim() || undefined).subscribe({
      next: (res) => {
        this.wfhRequests = res.data || [];
        this.loadingWfh = false;
      },
      error: (err) => {
        console.error('Error loading WFH requests (admin):', err);
        this.errorWfh = err.error?.message || 'Failed to load WFH requests.';
        this.loadingWfh = false;
      },
    });
  }

  // ---------- ACTIONS ----------

  applyFilters() {
    this.loadLeaveRequests(this.statusFilter);
    this.loadWfhRequests(this.statusFilter);
  }

  clearFilters() {
    this.statusFilter = 'Pending';
    this.searchTerm = '';
    this.applyFilters();
  }

  approveLeave(req: LeaveRequest) {
    if (!req._id) return;
    this.leaveService.approveLeave(req._id).subscribe({
      next: () => this.loadLeaveRequests('Pending'),
      error: (err) => {
        console.error('Error approving leave:', err);
        this.errorLeave = err.error?.message || 'Failed to approve leave.';
      },
    });
  }

  rejectLeave(req: LeaveRequest) {
    if (!req._id) return;
    this.leaveService.rejectLeave(req._id).subscribe({
      next: () => this.loadLeaveRequests('Pending'),
      error: (err) => {
        console.error('Error rejecting leave:', err);
        this.errorLeave = err.error?.message || 'Failed to reject leave.';
      },
    });
  }

  approveWfh(req: WfhRequest) {
    if (!req._id) return;
    this.leaveService.approveWfh(req._id).subscribe({
      next: () => this.loadWfhRequests('Pending'),
      error: (err) => {
        console.error('Error approving WFH:', err);
        this.errorWfh = err.error?.message || 'Failed to approve WFH.';
      },
    });
  }

  rejectWfh(req: WfhRequest) {
    if (!req._id) return;
    this.leaveService.rejectWfh(req._id).subscribe({
      next: () => this.loadWfhRequests('Pending'),
      error: (err) => {
        console.error('Error rejecting WFH:', err);
        this.errorWfh = err.error?.message || 'Failed to reject WFH.';
      },
    });
  }
}
