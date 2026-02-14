// frontend/src/app/services/employee.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface CreateEmployeeDto {
  name: string;
  email: string;
  password: string;
  department?: string;
  position?: string;
}

export interface EmployeeItem {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  status: 'active' | 'inactive';
  baseSalary?: number;
  joinDate?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface EmployeeListResponse {
  data: EmployeeItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UpdateEmployeeDto {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  status?: 'active' | 'inactive';
  baseSalary?: number;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private baseUrl = 'http://localhost:5001/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token =
      (typeof window !== 'undefined' && window.sessionStorage.getItem('token')) ||
      (typeof window !== 'undefined' && window.localStorage.getItem('token'));
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  createEmployee(data: CreateEmployeeDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/employees`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  getEmployees(params?: {
    search?: string;
    status?: 'active' | 'inactive' | '';
    page?: number;
    limit?: number;
  }): Observable<EmployeeListResponse> {
    return this.http.get<EmployeeListResponse>(`${this.baseUrl}/admin/employees`, {
      headers: this.getAuthHeaders(),
      params: {
        search: params?.search ?? '',
        status: params?.status ?? '',
        page: String(params?.page ?? 1),
        limit: String(params?.limit ?? 20),
      },
    });
  }

  updateEmployee(id: string, data: UpdateEmployeeDto): Observable<{ message: string; data: EmployeeItem }> {
    return this.http.patch<{ message: string; data: EmployeeItem }>(
      `${this.baseUrl}/admin/employees/${id}`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteEmployee(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/admin/employees/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
}
