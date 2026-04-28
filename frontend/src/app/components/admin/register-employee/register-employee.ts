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
  phone = '';
  role: 'employee' | 'manager' = 'employee';
  department = '';
  position = '';
  annualSalary = 0;
  filingStatus: 'unmarried' | 'married' = 'unmarried';
  departments: DepartmentItem[] = [];

  error = '';
  warning = '';
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
    this.warning = '';
    this.success = '';

    const name = this.name.trim();
    const email = this.email.trim().toLowerCase();
    const password = this.password;
    const phone = this.phone.trim();

    if (!name || !email || !password) {
      this.warning = 'Name, email and password are required.';
      return;
    }
    const nameRegex = /^[A-Za-z][A-Za-z\s.'-]{1,79}$/;
    if (!nameRegex.test(name)) {
      this.warning = 'Please enter a valid full name.';
      return;
    }
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;
    if (!strongPassword.test(password)) {
      this.warning = 'Password must be 8+ chars with uppercase, lowercase and number.';
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.warning = 'Please enter a valid email address.';
      return;
    }
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (phone && !phoneRegex.test(phone)) {
      this.warning = 'Please enter a valid phone number.';
      return;
    }
    if (!this.department) {
      this.warning = 'Please select a department.';
      return;
    }
    const salary = Number(this.annualSalary);
    if (!Number.isFinite(salary) || salary <= 0) {
      this.warning = 'Please enter valid annual salary greater than 0.';
      return;
    }

    this.loading = true;

    this.employeeService
      .createEmployee({
        name: this.name,
        email,
        password,
        phone,
        role: this.role,
        department: this.department,
        position: this.position,
        annualSalary: salary,
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
          this.phone = '';
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
