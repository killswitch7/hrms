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
    this.success = '';
    this.loading = true;
    this.documentsService
      .createMyRequest({ type: this.type, purpose: this.purpose })
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

  closePreview() {
    this.selectedHtml = '';
    this.selectedType = '';
  }
}
