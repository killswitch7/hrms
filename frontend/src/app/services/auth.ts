import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    role: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5001/api/auth';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password });
  }

  register(email: string, password: string, role: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, {
      email,
      password,
      role,
    });
  }

  // Safe localStorage access (prevents getItem not a function error)
  private getStorage(): Storage | null {
    const ls = (globalThis as any).localStorage;
    if (!ls || typeof ls.getItem !== 'function' || typeof ls.setItem !== 'function') {
      return null;
    }
    return ls as Storage;
  }

  saveSession(token: string, role: string, email: string) {
    const storage = this.getStorage();
    if (!storage) return;

    storage.setItem('token', token);
    storage.setItem('role', role);
    storage.setItem('email', email);
  }

  clearSession() {
    const storage = this.getStorage();
    if (!storage) return;

    storage.removeItem('token');
    storage.removeItem('role');
    storage.removeItem('email');
  }

  getToken(): string | null {
    const storage = this.getStorage();
    if (!storage) return null;
    return storage.getItem('token');
  }

  getRole(): string | null {
    const storage = this.getStorage();
    if (!storage) return null;
    return storage.getItem('role');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
