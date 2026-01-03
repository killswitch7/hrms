// frontend/src/app/components/admin/register-employee/register-employee.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EmployeeService } from '../../../services/employee';

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
  department = '';
  position = '';

  error = '';
  success = '';
  loading = false;

  constructor(
    private employeeService: EmployeeService,
    public router: Router
  ) {}

  onSubmit() {
    this.error = '';
    this.success = '';

    if (!this.name || !this.email || !this.password) {
      this.error = 'Name, email and password are required.';
      return;
    }

    this.loading = true;

    this.employeeService
      .createEmployee({
        name: this.name,
        email: this.email,
        password: this.password,
        department: this.department,
        position: this.position,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.success = 'Employee registered successfully.';

          // Clear form
          this.name = '';
          this.email = '';
          this.password = '';
          this.department = '';
          this.position = '';
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
