import { Routes } from '@angular/router';

// Auth + dashboards
import { Login } from './components/auth/login/login';
import { AdminDashboard } from './components/admin/admin-dashboard/admindashboard';
import { Dashboard } from './components/employee/dashboard/dashboard';

// Admin feature pages
import { Employees } from './components/admin/employees/employees';
import { AdminAttendance } from './components/admin/attendance/attendance';
// NOTE: folder is "leave", not "leave-approvals"
import { Leave } from './components/admin/leave/leave';
import { Payroll } from './components/admin/payroll/payroll';

// If you generated these with CLI: ng g c components/admin/announcements --standalone
// class name will be AnnouncementsComponent, file *.component.ts
import { Announcements } from './components/admin/announcements/announcements';
import { Analytics } from './components/admin/analytics/analytics';

import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    canActivate: [loginGuard],
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
  },

  // Admin feature routes
  {
    path: 'employees',
    component: Employees,
    canActivate: [authGuard],
  },
  {
    path: 'attendance',
    component: AdminAttendance,
    canActivate: [authGuard],
  },
  {
    path: 'leave-approvals',          // URL path
    component: Leave,                 // component in src/app/components/admin/leave/leave.ts
    canActivate: [authGuard],
  },
  {
    path: 'payroll',
    component: Payroll,
    canActivate: [authGuard],
  },
  {
    path: 'announcements',
    component: Announcements,
    canActivate: [authGuard],
  },
  {
    path: 'analytics',
    component: Analytics,
    canActivate: [authGuard],
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
