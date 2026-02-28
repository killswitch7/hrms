// frontend/src/app/components/admin/register-employee/register-employee.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EmployeeService } from '../../../services/employee';
import { Admin, DepartmentItem } from '../../../services/admin';

@Component({
  selector: 'app-register-employee',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register-employee.html',
  styleUrls: ['./register-employee.css'],
})
export class RegisterEmployee {
  name = '';
  email = '';
  password = '';
  role: 'employee' | 'manager' = 'employee';
  department = '';
  position = '';
  annualSalary = 0;
  filingStatus: 'unmarried' | 'married' = 'unmarried';
  departments: DepartmentItem[] = [];

  error = '';
  success = '';
  loading = false;

  constructor(
    private employeeService: EmployeeService,
    private adminService: Admin,
    public router: Router
  ) {}

  ngOnInit() {
    this.loadDepartments();
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

  onSubmit() {
    this.error = '';
    this.success = '';

    if (!this.name || !this.email || !this.password) {
      this.error = 'Name, email and password are required.';
      return;
    }
    if (!this.department) {
      this.error = 'Please select a department.';
      return;
    }
    if (!Number(this.annualSalary)) {
      this.error = 'Please enter annual salary.';
      return;
    }

    this.loading = true;

    this.employeeService
      .createEmployee({
        name: this.name,
        email: this.email,
        password: this.password,
        role: this.role,
        department: this.department,
        position: this.position,
        annualSalary: this.annualSalary,
        filingStatus: this.filingStatus,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.success = `User registered successfully as ${res?.user?.role || this.role}.`;

          // Clear form
          this.name = '';
          this.email = '';
          this.password = '';
          this.role = 'employee';
          this.department = '';
          this.position = '';
          this.annualSalary = 0;
          this.filingStatus = 'unmarried';
        },
        error: (err) => {
          this.loading = false;
          this.error =
            err?.error?.message ||
            'Failed to register employee. Please try again.';
          console.error('Register employee error:', err);
        },
      });
  }
}
