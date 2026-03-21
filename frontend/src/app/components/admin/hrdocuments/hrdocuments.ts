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

  downloadDoc(id: string) {
    this.error = '';
    this.documentsService.downloadApprovedDocument(id).subscribe({
      next: (res) => {
        const blob = res.body;
        if (!blob) return;
        const header = res.headers.get('content-disposition') || '';
        const match = header.match(/filename="([^"]+)"/i);
        const filename = match?.[1] || 'document.pdf';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => (this.error = err?.error?.message || 'Download failed'),
    });
  }

  closePreview() {
    this.selectedHtml = '';
    this.selectedType = '';
  }
}
