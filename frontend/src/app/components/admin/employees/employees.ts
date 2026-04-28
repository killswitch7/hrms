import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  EmployeeItem,
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
  statusFilter: '' | 'active' | 'inactive' | 'layoff' = '';
  roleFilter: '' | 'employee' | 'manager' = '';
  departmentFilter = '';
  page = 1;
  limit = 5;
  total = 0;
  pages = 1;
  departments: DepartmentItem[] = [];

  isManager = false;

  editId = '';
  editForm: UpdateEmployeeDto & { name?: string } = {};
  terminationAction: Record<string, '' | 'layoff' | 'fire'> = {};
  openTerminationId = '';

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
          this.pages = res.pagination?.pages || 1;
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

    const name = String(this.editForm.name || '').trim();
    const email = String(this.editForm.email || '').trim().toLowerCase();
    const phone = String(this.editForm.phone || '').trim();
    const salary = Number(this.editForm.annualSalary);

    const nameRegex = /^[A-Za-z][A-Za-z\s.'-]{1,79}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{7,15}$/;

    if (!nameRegex.test(name)) {
      this.error = 'Please enter a valid full name.';
      return;
    }
    if (!emailRegex.test(email)) {
      this.error = 'Please enter a valid email.';
      return;
    }
    if (phone && !phoneRegex.test(phone)) {
      this.error = 'Please enter a valid phone number.';
      return;
    }
    if (!Number.isFinite(salary) || salary <= 0) {
      this.error = 'Annual salary must be greater than 0.';
      return;
    }

    this.editForm.name = name;
    this.editForm.email = email;
    this.editForm.phone = phone;
    this.editForm.annualSalary = salary;

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
    this.router.navigate(['/admin-employee-profile', emp._id]);
  }

  openTerminationMenu(emp: EmployeeItem) {
    if (this.isManager) return;
    this.error = '';
    this.success = '';
    this.openTerminationId = emp._id;
    if (!this.terminationAction[emp._id]) {
      this.terminationAction[emp._id] = '';
    }
  }

  closeTerminationMenu(empId: string) {
    this.openTerminationId = '';
    this.terminationAction[empId] = '';
  }

  deleteEmployee(emp: EmployeeItem) {
    if (this.isManager) return;
    const fullName = [emp.firstName, emp.lastName].filter(Boolean).join(' ') || emp.email;
    const action = this.terminationAction[emp._id];
    if (!action) {
      this.error = 'Please select action: layoff or fire.';
      return;
    }

    if (action === 'fire') {
      const confirmFire = window.confirm(`Confirm FIRE for ${fullName}? This will permanently delete this user.`);
      if (!confirmFire) return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.employeeService.deleteEmployee(emp._id, action).subscribe({
      next: () => {
        this.success = action === 'layoff'
          ? 'Employee marked as laid off and email sent.'
          : 'Employee fired, deleted, and email sent.';
        delete this.terminationAction[emp._id];
        this.openTerminationId = '';
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
    if (this.page >= this.pages) return;
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
