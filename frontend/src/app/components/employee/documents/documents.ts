import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentsService, DocumentRequestItem } from '../../../services/documents';

@Component({
  selector: 'app-employee-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents.html',
  styleUrls: ['./documents.css'],
})
export class EmployeeDocuments {
  requests: DocumentRequestItem[] = [];
  loading = false;
  error = '';
  warning = '';
  success = '';
  selectedHtml = '';
  selectedType = '';

  type = 'Experience Letter';
  purpose = '';

  types = [
    'Experience Letter',
    'Salary Certificate',
    'Employment Verification',
    'No Objection Certificate',
  ];

  constructor(private documentsService: DocumentsService) {}

  ngOnInit() {
    this.loadMyRequests();
  }

  loadMyRequests() {
    this.loading = true;
    this.error = '';
    this.documentsService.getMyRequests().subscribe({
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

  submitRequest() {
    this.error = '';
    this.warning = '';
    this.success = '';
    const cleanType = String(this.type || '').trim();
    const cleanPurpose = String(this.purpose || '').trim();
    if (!cleanType) {
      this.warning = 'Please select a document type.';
      return;
    }
    if (cleanPurpose.length > 180) {
      this.warning = 'Purpose is too long. Please keep it under 180 characters.';
      return;
    }
    this.loading = true;
    this.documentsService
      .createMyRequest({ type: cleanType, purpose: cleanPurpose })
      .subscribe({
        next: (res) => {
          this.success = res.message || 'Request submitted';
          this.purpose = '';
          this.loadMyRequests();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to submit request.';
          this.loading = false;
        },
      });
  }

  viewDoc(id: string) {
    this.error = '';
    this.selectedHtml = '';
    this.selectedType = '';
    this.documentsService.viewMyApprovedDocument(id).subscribe({
      next: (res) => {
        this.selectedHtml = res.data?.html || '';
        this.selectedType = res.data?.type || 'Document';
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to open document.';
      },
    });
  }

  downloadDoc(id: string) {
    this.error = '';
    this.documentsService.downloadMyApprovedDocument(id).subscribe({
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
      error: (err) => {
        this.error = err?.error?.message || 'Failed to download document.';
      },
    });
  }

  closePreview() {
    this.selectedHtml = '';
    this.selectedType = '';
  }
}
