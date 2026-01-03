// frontend/src/app/services/auth.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'employee';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = 'http://localhost:5001/api';


  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private hasLocalStorage(): boolean {
    try {
      return (
        this.isBrowser() &&
        !!window.localStorage &&
        typeof window.localStorage.getItem === 'function'
      );
    } catch {
      return false;
    }
  }

  // ---------- AUTH API CALLS ----------

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          this.saveSession(res.token, res.user.role, res.user.email);
        })
      );
  }

  register(body: {
    email: string;
    password: string;
    role?: 'admin' | 'employee';
    firstName?: string;
    lastName?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, body)
      .pipe(
        tap((res) => {
          this.saveSession(res.token, res.user.role, res.user.email);
        })
      );
  }

  // ---------- SESSION HELPERS (JWT + role + email) ----------

  saveSession(token: string, role: string, email: string) {
    if (!this.hasLocalStorage()) return;
    window.localStorage.setItem('token', token);
    window.localStorage.setItem('role', role);
    window.localStorage.setItem('email', email);
  }

  clearSession() {
    if (!this.hasLocalStorage()) return;
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('role');
    window.localStorage.removeItem('email');
  }

  getToken(): string | null {
    if (!this.hasLocalStorage()) return null;
    return window.localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getStoredRole(): string | null {
    if (!this.hasLocalStorage()) return null;
    return window.localStorage.getItem('role');
  }

  getStoredEmail(): string | null {
    if (!this.hasLocalStorage()) return null;
    return window.localStorage.getItem('email');
  }

  // ---------- OPTIONAL: decode token as fallback ----------

  private decodeToken(): any | null {
    const token = this.getToken();
    if (!token || !this.isBrowser()) return null;

    try {
      const [, payloadBase64] = token.split('.');
      const payloadJson = atob(payloadBase64);
      return JSON.parse(payloadJson);
    } catch (e) {
      console.error('Error decoding token', e);
      return null;
    }
  }

  getRole(): 'admin' | 'employee' | null {
    const stored = this.getStoredRole();
    if (stored === 'admin' || stored === 'employee') return stored as any;

    const payload = this.decodeToken();
    return payload?.role ?? null;
  }

  getEmail(): string | null {
    const stored = this.getStoredEmail();
    if (stored) return stored;

    const payload = this.decodeToken();
    return payload?.email ?? null;
  }

  // ---------- LOGOUT ----------

  logoutToLogin() {
    this.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
