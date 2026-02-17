// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';

// Auth + dashboards
import { Login } from './components/auth/login/login';
import { AdminDashboard } from './components/admin/admin-dashboard/admindashboard';
import { Dashboard } from './components/employee/dashboard/dashboard';

// Admin feature pages
import { Employees } from './components/admin/employees/employees';
import { AdminAttendance } from './components/admin/attendance/attendance';
import { LeaveApprovals as AdminLeave } from './components/admin/leave/leave';
import { Payroll } from './components/admin/payroll/payroll';
import { Announcements } from './components/admin/announcements/announcements';
import { Analytics } from './components/admin/analytics/analytics';
import { RegisterEmployee } from './components/admin/register-employee/register-employee';
import { AdminProfile } from './components/admin/profile/profile';
import { AdminHolidays } from './components/admin/holidays/holidays';

// Employee feature pages
import { Attendance } from './components/employee/attendance/attendance';
import { Holidays } from './components/employee/holidays/holidays';
import { Leave as EmployeeLeave } from './components/employee/leave/leave';
import { Payslip } from './components/employee/payslip/payslip';
import { Profile } from './components/employee/profile/profile';
import { Notifications } from './components/employee/notifications/notifications';

import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';

export const routes: Routes = [
  // Auth
  {
    path: 'login',
    component: Login,
    canActivate: [loginGuard],
  },

  // Dashboards
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard', // employee dashboard
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
    path: 'leave-approvals',
    component: AdminLeave,
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
    path: 'holidays',
    component: AdminHolidays,
    canActivate: [authGuard],
  },
  {
    path: 'analytics',
    component: Analytics,
    canActivate: [authGuard],
  },

  // NEW: Admin Register Employee
  {
    path: 'register-employee',
    component: RegisterEmployee,
    canActivate: [authGuard],
  },
  {
    path: 'admin-profile',
    component: AdminProfile,
    canActivate: [authGuard],
  },

  // Employee feature routes
  {
    path: 'employee-attendance',
    component: Attendance,
    canActivate: [authGuard],
  },
  {
    path: 'employee-holidays',
    component: Holidays,
    canActivate: [authGuard],
  },
  {
    path: 'employee-leave',
    component: EmployeeLeave,
    canActivate: [authGuard],
  },
  {
    path: 'employee-payslip',
    component: Payslip,
    canActivate: [authGuard],
  },
  {
    path: 'employee-profile',
    component: Profile,
    canActivate: [authGuard],
  },
  {
    path: 'employee-notifications',
    component: Notifications,
    canActivate: [authGuard],
  },

  // Defaults
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
