import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentsService, DocumentRequestItem } from '../../../services/documents';

@Component({
  selector: 'app-hrdocuments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hrdocuments.html',
  styleUrls: ['./hrdocuments.css'],
})
export class Hrdocuments {
  requests: DocumentRequestItem[] = [];
  loading = false;
  error = '';
  search = '';
  role = '';
  status = '';
  selectedHtml = '';
  selectedType = '';

  constructor(private documentsService: DocumentsService) {}

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.loading = true;
    this.error = '';
    this.documentsService
      .getAdminRequests({
        search: this.search,
        role: this.role,
        status: this.status,
      })
      .subscribe({
        next: (res) => {
          this.requests = res.data || [];
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to load requests.';
          this.loading = false;
        },
      });
  }

  approve(id: string) {
    this.documentsService.approveRequest(id).subscribe({
      next: () => this.loadRequests(),
      error: (err) => (this.error = err?.error?.message || 'Approve failed'),
    });
  }

  reject(id: string) {
    const reason = prompt('Reason for rejection?') || '';
    this.documentsService.rejectRequest(id, reason).subscribe({
      next: () => this.loadRequests(),
      error: (err) => (this.error = err?.error?.message || 'Reject failed'),
    });
  }

  viewDoc(id: string) {
    this.selectedHtml = '';
    this.selectedType = '';
    this.documentsService.viewApprovedDocument(id).subscribe({
      next: (res) => {
        this.selectedHtml = res.data?.html || '';
        this.selectedType = res.data?.type || 'Document';
      },
      error: (err) => (this.error = err?.error?.message || 'View failed'),
    });
  }

  closePreview() {
    this.selectedHtml = '';
    this.selectedType = '';
  }
}
