// src/app/app.ts
import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <header class="global-header" *ngIf="showHeader">
      <div class="header-inner">
        <div class="identity">
          <div class="avatar">{{ initials }}</div>
          <div>
            <h1>{{ title }}</h1>
            <p>{{ subtitle }}</p>
          </div>
        </div>

        <div class="actions">
          <button class="btn ghost" (click)="refreshPage()">Refresh</button>
          <button class="btn ghost" (click)="goToProfile()">Profile</button>
          <button class="btn ghost" (click)="goToMain()"> {{ mainLabel }} </button>
          <button class="btn primary" (click)="logout()">Logout</button>
        </div>
      </div>
    </header>

    <router-outlet></router-outlet>
  `,
  styleUrls: ['./app.css'],
})
export class App {
  showHeader = false;
  role: 'admin' | 'employee' | null = null;
  email = '';
  title = 'Control Center';
  subtitle = '';
  initials = 'U';
  mainLabel = 'Dashboard';

  constructor(private router: Router, private auth: AuthService) {
    this.syncHeaderState();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.syncHeaderState());
  }

  private syncHeaderState() {
    const url = this.router.url || '';
    this.role = this.auth.getRole();
    this.email = this.auth.getEmail() || '';
    this.showHeader = this.auth.isLoggedIn() && !url.startsWith('/login');

    const namePart = this.email.split('@')[0] || 'user';
    this.initials = namePart.slice(0, 1).toUpperCase();
    this.subtitle = `${this.role === 'admin' ? 'Admin' : 'Employee'} \u2022 ${this.email}`;
    this.mainLabel = this.role === 'admin' ? 'Employees' : 'Dashboard';
  }

  refreshPage() {
    window.location.reload();
  }

  goToProfile() {
    this.router.navigate([this.role === 'admin' ? '/admin-profile' : '/employee-profile']);
  }

  goToMain() {
    this.router.navigate([this.role === 'admin' ? '/employees' : '/dashboard']);
  }

  logout() {
    this.auth.logoutToLogin();
  }
}
