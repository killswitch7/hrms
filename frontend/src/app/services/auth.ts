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

  constructor() {
    // One-time cleanup: old persistent auth tokens caused auto-login across rebuilds.
    this.clearLegacyLocalStorage();
  }


  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private hasSessionStorage(): boolean {
    try {
      return (
        this.isBrowser() &&
        !!window.sessionStorage &&
        typeof window.sessionStorage.getItem === 'function'
      );
    } catch {
      return false;
    }
  }

  private clearLegacyLocalStorage(): void {
    if (!this.isBrowser()) return;
    try {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('role');
      window.localStorage.removeItem('email');
    } catch {
      // Ignore storage errors
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
    if (!this.hasSessionStorage()) return;
    window.sessionStorage.setItem('token', token);
    window.sessionStorage.setItem('role', role);
    window.sessionStorage.setItem('email', email);
  }

  clearSession() {
    if (!this.hasSessionStorage()) return;
    window.sessionStorage.removeItem('token');
    window.sessionStorage.removeItem('role');
    window.sessionStorage.removeItem('email');
  }

  getToken(): string | null {
    if (!this.hasSessionStorage()) return null;
    return window.sessionStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const payload = this.decodeToken();
    const exp = payload?.exp;
    if (!exp) return true;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const isValid = exp > nowSeconds;
    if (!isValid) {
      this.clearSession();
    }
    return isValid;
  }

  getStoredRole(): string | null {
    if (!this.hasSessionStorage()) return null;
    return window.sessionStorage.getItem('role');
  }

  getStoredEmail(): string | null {
    if (!this.hasSessionStorage()) return null;
    return window.sessionStorage.getItem('email');
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
