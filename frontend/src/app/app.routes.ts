// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';

// Login and main dashboard pages
import { Login } from './components/auth/login/login';
import { AdminDashboard } from './components/admin/admin-dashboard/admindashboard';
import { Dashboard } from './components/employee/dashboard/dashboard';

// Admin pages
import { Employees } from './components/admin/employees/employees';
import { AdminAttendance } from './components/admin/attendance/attendance';
import { LeaveApprovals as AdminLeave } from './components/admin/leave/leave';
import { Payroll } from './components/admin/payroll/payroll';
import { Announcements } from './components/admin/announcements/announcements';
import { Analytics } from './components/admin/analytics/analytics';
import { RegisterEmployee } from './components/admin/register-employee/register-employee';
import { AdminProfile } from './components/admin/profile/profile';
import { AdminHolidays } from './components/admin/holidays/holidays';
import { AdminDepartments } from './components/admin/departments/departments';
import { ManagerDashboard } from './components/manager/dashboard/dashboard';
import { ManagerAttendance } from './components/manager/attendance/attendance';
import { ManagerLeave } from './components/manager/leave/leave';

// Employee pages
import { Attendance } from './components/employee/attendance/attendance';
import { Holidays } from './components/employee/holidays/holidays';
import { Leave as EmployeeLeave } from './components/employee/leave/leave';
import { Payslip } from './components/employee/payslip/payslip';
import { Profile } from './components/employee/profile/profile';
import { Notifications } from './components/employee/notifications/notifications';

import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  // Login page
  {
    path: 'login',
    component: Login,
    canActivate: [loginGuard],
  },

  // Dashboard pages by role
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [authGuard, roleGuard(['admin'])],
  },
  {
    path: 'manager-dashboard',
    component: ManagerDashboard,
    canActivate: [authGuard, roleGuard(['manager'])],
  },
  {
    path: 'dashboard', // employee dashboard
    component: Dashboard,
    canActivate: [authGuard, roleGuard(['employee'])],
  },

  // Admin + manager management pages
  {
    path: 'employees',
    component: Employees,
    canActivate: [authGuard, roleGuard(['admin', 'manager'])],
  },
  {
    path: 'attendance',
    component: AdminAttendance,
    canActivate: [authGuard, roleGuard(['admin', 'manager'])],
  },
  {
    path: 'leave-approvals',
    component: AdminLeave,
    canActivate: [authGuard, roleGuard(['admin', 'manager'])],
  },
  {
    path: 'payroll',
    component: Payroll,
    canActivate: [authGuard, roleGuard(['admin'])],
  },
  {
    path: 'announcements',
    component: Announcements,
    canActivate: [authGuard, roleGuard(['admin'])],
  },
  {
    path: 'holidays',
    component: AdminHolidays,
    canActivate: [authGuard, roleGuard(['admin'])],
  },
  {
    path: 'analytics',
    component: Analytics,
    canActivate: [authGuard, roleGuard(['admin'])],
  },
  {
    path: 'departments',
    component: AdminDepartments,
    canActivate: [authGuard, roleGuard(['admin'])],
  },

  // Register page (admin only)
  {
    path: 'register-employee',
    component: RegisterEmployee,
    canActivate: [authGuard, roleGuard(['admin'])],
  },
  {
    path: 'admin-profile',
    component: AdminProfile,
    canActivate: [authGuard, roleGuard(['admin', 'manager'])],
  },

  // Manager personal pages
  {
    path: 'manager-attendance',
    component: ManagerAttendance,
    canActivate: [authGuard, roleGuard(['manager'])],
  },
  {
    path: 'manager-leave',
    component: ManagerLeave,
    canActivate: [authGuard, roleGuard(['manager'])],
  },

  // Employee pages
  {
    path: 'employee-attendance',
    component: Attendance,
    canActivate: [authGuard, roleGuard(['employee'])],
  },
  {
    path: 'employee-holidays',
    component: Holidays,
    canActivate: [authGuard, roleGuard(['employee'])],
  },
  {
    path: 'employee-leave',
    component: EmployeeLeave,
    canActivate: [authGuard, roleGuard(['employee'])],
  },
  {
    path: 'employee-payslip',
    component: Payslip,
    canActivate: [authGuard, roleGuard(['employee'])],
  },
  {
    path: 'employee-profile',
    component: Profile,
    canActivate: [authGuard, roleGuard(['employee'])],
  },
  {
    path: 'employee-notifications',
    component: Notifications,
    canActivate: [authGuard, roleGuard(['employee'])],
  },

  // Default route
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
