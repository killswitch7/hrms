import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Admin, DepartmentItem } from '../../../services/admin';

@Component({
  selector: 'app-admin-departments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './departments.html',
  styleUrls: ['./departments.css'],
})
export class AdminDepartments {
  departments: DepartmentItem[] = [];
  name = '';
  loading = false;
  error = '';

  constructor(private adminService: Admin) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments() {
    this.loading = true;
    this.error = '';
    this.adminService.getDepartments().subscribe({
      next: (res) => {
        this.departments = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load departments.';
        this.loading = false;
      },
    });
  }

  addDepartment() {
    if (!this.name.trim()) {
      this.error = 'Department name is required.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.adminService
      .createDepartment({
        name: this.name.trim(),
      })
      .subscribe({
        next: () => {
          this.name = '';
          this.loadDepartments();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to add department.';
          this.loading = false;
        },
      });
  }
}
