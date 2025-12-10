// src/app/app.routes.ts
import { Routes } from '@angular/router';

// Components (adjust paths if needed)
import { Login } from './components/auth/login/login';
import { AdminDashboard } from './components/admin/admin-dashboard/admindashboard';
import { Dashboard } from './components/employee/dashboard/dashboard';

// Guards
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    canActivate: [loginGuard], // already logged in? -> redirect to dashboard
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [authGuard], // must be logged in
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard], // must be logged in
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
