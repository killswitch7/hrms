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

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private baseUrl = 'http://localhost:5001/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = localStorage.getItem('token');
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
}
