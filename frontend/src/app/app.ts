// src/app/app.ts
import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth';
import { AvatarService } from './services/avatar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <header class="global-header" *ngIf="showHeader">
      <div class="header-inner">
        <div class="identity">
          <div class="avatar">
            <img *ngIf="avatarUrl; else initialsFallback" [src]="avatarUrl" alt="Profile photo" />
            <ng-template #initialsFallback>{{ initials }}</ng-template>
          </div>
          <div>
            <h1>{{ title }}</h1>
            <p>{{ subtitle }}</p>
          </div>
        </div>

        <div class="actions">
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
  role: 'admin' | 'manager' | 'employee' | null = null;
  email = '';
  title = 'Control Center';
  subtitle = '';
  initials = 'U';
  avatarUrl: string | null = null;
  mainLabel = 'Dashboard';

  constructor(
    private router: Router,
    private auth: AuthService,
    private avatarService: AvatarService
  ) {
    this.syncHeaderState();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.syncHeaderState());

    if (typeof window !== 'undefined') {
      window.addEventListener('hrms-avatar-updated', () => this.syncHeaderState());
    }
  }

  private syncHeaderState() {
    const url = this.router.url || '';
    this.role = this.auth.getRole();
    this.email = this.auth.getEmail() || '';
    this.showHeader = this.auth.isLoggedIn() && !url.startsWith('/login');

    const namePart = this.email.split('@')[0] || 'user';
    this.initials = namePart.slice(0, 1).toUpperCase();
    const roleName =
      this.role === 'admin' ? 'Admin' : this.role === 'manager' ? 'Manager' : 'Employee';
    this.subtitle = `${roleName} \u2022 ${this.email}`;
    this.mainLabel =
      this.role === 'admin' ? 'Employees' : this.role === 'manager' ? 'Team' : 'Dashboard';
    this.avatarUrl = this.role ? this.avatarService.get(this.role, this.email) : null;
  }

  refreshPage() {
    window.location.reload();
  }

  goToProfile() {
    this.router.navigate([this.role === 'admin' || this.role === 'manager' ? '/admin-profile' : '/employee-profile']);
  }

  goToMain() {
    if (this.role === 'admin') return this.router.navigate(['/employees']);
    if (this.role === 'manager') return this.router.navigate(['/manager-dashboard']);
    return this.router.navigate(['/dashboard']);
  }

  logout() {
    this.auth.logoutToLogin();
  }
}
