import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  EmployeeItem,
  EmployeeProfileResponse,
  EmployeeService,
  UpdateEmployeeDto,
} from '../../../services/employee';
import { AuthService } from '../../../services/auth';
import { Admin, DepartmentItem } from '../../../services/admin';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees.html',
  styleUrls: ['./employees.css'],
})
export class Employees {
  employees: EmployeeItem[] = [];
  loading = false;
  error = '';
  success = '';

  search = '';
  statusFilter: '' | 'active' | 'inactive' = '';
  roleFilter: '' | 'employee' | 'manager' = '';
  departmentFilter = '';
  page = 1;
  limit = 20;
  total = 0;
  departments: DepartmentItem[] = [];

  isManager = false;

  editId = '';
  editForm: UpdateEmployeeDto & { name?: string } = {};
  profileLoading = false;
  selectedProfile: EmployeeProfileResponse['data'] | null = null;

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private authService: AuthService,
    private adminService: Admin
  ) {}

  ngOnInit(): void {
    this.isManager = this.authService.getRole() === 'manager';
    if (!this.isManager) this.loadDepartments();
    this.loadEmployees();
  }

  loadDepartments() {
    this.adminService.getDepartments().subscribe({
      next: (res) => {
        this.departments = res.data || [];
      },
      error: () => {
        this.departments = [];
      },
    });
  }

  loadEmployees() {
    this.loading = true;
    this.error = '';

    this.employeeService
      .getEmployees({
        search: this.search,
        status: this.statusFilter,
        role: this.roleFilter,
        department: this.departmentFilter,
        page: this.page,
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.employees = res.data || [];
          this.total = res.pagination?.total || 0;
          this.page = res.pagination?.page || 1;
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to load employees.';
          this.loading = false;
        },
      });
  }

  applyFilters() {
    this.page = 1;
    this.loadEmployees();
  }

  clearFilters() {
    this.search = '';
    this.statusFilter = '';
    this.roleFilter = '';
    this.departmentFilter = '';
    this.page = 1;
    this.loadEmployees();
  }

  startEdit(emp: EmployeeItem) {
    if (this.isManager) return;
    this.success = '';
    this.error = '';
    this.editId = emp._id;
    this.editForm = {
      name: [emp.firstName, emp.lastName].filter(Boolean).join(' ').trim(),
      email: emp.email,
      phone: emp.phone || '',
      department: emp.department || '',
      designation: emp.designation || '',
      status: emp.status,
      role: (emp.user?.role as 'employee' | 'manager') || 'employee',
      annualSalary: emp.annualSalary || 0,
      filingStatus: emp.filingStatus || 'unmarried',
    };
  }

  cancelEdit() {
    this.editId = '';
    this.editForm = {};
  }

  saveEdit() {
    if (this.isManager) return;
    if (!this.editId) return;
    if (this.editForm.role === 'manager' && !String(this.editForm.department || '').trim()) {
      this.error = 'Manager must have a department.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.employeeService.updateEmployee(this.editId, this.editForm).subscribe({
      next: () => {
        this.success = 'Employee updated successfully.';
        this.cancelEdit();
        this.loadEmployees();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to update employee.';
        this.loading = false;
      },
    });
  }

  viewProfile(emp: EmployeeItem) {
    this.profileLoading = true;
    this.error = '';
    this.selectedProfile = null;

    this.employeeService.getEmployeeProfile(emp._id).subscribe({
      next: (res) => {
        this.selectedProfile = res.data;
        this.profileLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load employee profile.';
        this.profileLoading = false;
      },
    });
  }

  closeProfile() {
    this.selectedProfile = null;
  }

  deleteEmployee(emp: EmployeeItem) {
    if (this.isManager) return;
    const fullName = [emp.firstName, emp.lastName].filter(Boolean).join(' ');
    const ok = window.confirm(`Delete ${fullName || emp.email}? This action cannot be undone.`);
    if (!ok) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.employeeService.deleteEmployee(emp._id).subscribe({
      next: () => {
        this.success = 'Employee deleted successfully.';
        if (this.employees.length === 1 && this.page > 1) {
          this.page -= 1;
        }
        this.loadEmployees();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to delete employee.';
        this.loading = false;
      },
    });
  }

  nextPage() {
    if (this.page * this.limit >= this.total) return;
    this.page += 1;
    this.loadEmployees();
  }

  prevPage() {
    if (this.page <= 1) return;
    this.page -= 1;
    this.loadEmployees();
  }

  goToRegister() {
    if (this.isManager) return;
    this.router.navigate(['/register-employee']);
  }
}
