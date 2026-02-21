import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface DocumentRequestItem {
  _id: string;
  type: string;
  purpose?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedByRole?: 'employee' | 'manager';
  rejectionReason?: string;
  createdAt: string;
  employee?: {
    _id?: string;
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    department?: string;
    designation?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiRoot = 'http://localhost:5001/api';

  private getSelfBase() {
    return this.auth.getRole() === 'manager'
      ? `${this.apiRoot}/manager/documents`
      : `${this.apiRoot}/employee/documents`;
  }

  private getAdminBase() {
    return `${this.apiRoot}/admin/document-requests`;
  }

  createMyRequest(payload: { type: string; purpose?: string }) {
    return this.http.post<{ message: string; data: DocumentRequestItem }>(this.getSelfBase(), payload);
  }

  getMyRequests(): Observable<{ data: DocumentRequestItem[] }> {
    return this.http.get<{ data: DocumentRequestItem[] }>(this.getSelfBase());
  }

  viewMyApprovedDocument(id: string) {
    return this.http.get<{ data: { html: string; type: string } }>(`${this.getSelfBase()}/${id}/view`);
  }

  getAdminRequests(params?: { status?: string; role?: string; search?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.role) qs.set('role', params.role);
    if (params?.search) qs.set('search', params.search);
    const url = `${this.getAdminBase()}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return this.http.get<{ data: DocumentRequestItem[] }>(url);
  }

  approveRequest(id: string) {
    return this.http.patch<{ message: string }>(`${this.getAdminBase()}/${id}/approve`, {});
  }

  rejectRequest(id: string, reason: string) {
    return this.http.patch<{ message: string }>(`${this.getAdminBase()}/${id}/reject`, { reason });
  }

  viewApprovedDocument(id: string) {
    return this.http.get<{ data: { html: string; type: string } }>(`${this.getAdminBase()}/${id}/view`);
  }
}
