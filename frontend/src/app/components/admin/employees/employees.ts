import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  EmployeeItem,
  EmployeeService,
  UpdateEmployeeDto,
} from '../../../services/employee';

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
  page = 1;
  limit = 20;
  total = 0;

  editId = '';
  editForm: UpdateEmployeeDto & { name?: string } = {};

  constructor(private employeeService: EmployeeService, private router: Router) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading = true;
    this.error = '';

    this.employeeService
      .getEmployees({
        search: this.search,
        status: this.statusFilter,
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
    this.page = 1;
    this.loadEmployees();
  }

  startEdit(emp: EmployeeItem) {
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
      baseSalary: emp.baseSalary || 0,
    };
  }

  cancelEdit() {
    this.editId = '';
    this.editForm = {};
  }

  saveEdit() {
    if (!this.editId) return;

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

  deleteEmployee(emp: EmployeeItem) {
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
    this.router.navigate(['/register-employee']);
  }
}
