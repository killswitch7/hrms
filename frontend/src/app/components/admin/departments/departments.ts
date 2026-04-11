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
  warning = '';
  success = '';

  constructor(private adminService: Admin) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments() {
    this.loading = true;
    this.error = '';
    this.warning = '';
    this.success = '';
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
    const cleanName = this.name.trim();
    if (!cleanName) {
      this.warning = 'Department name is required.';
      return;
    }
    if (cleanName.length < 2) {
      this.warning = 'Department name must be at least 2 characters.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.warning = '';
    this.success = '';
    this.adminService
      .createDepartment({
        name: cleanName,
      })
      .subscribe({
        next: () => {
          this.name = '';
          this.success = 'Department added successfully.';
          this.loadDepartments();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to add department.';
          this.loading = false;
        },
      });
  }

  deleteDepartment(id: string, name: string) {
    const ok = window.confirm(
      `Delete department "${name}"?\nEmployees in this department will NOT be deleted.`
    );
    if (!ok) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.adminService.deleteDepartment(id).subscribe({
      next: (res) => {
        this.success = res?.message || 'Department deleted successfully.';
        this.loadDepartments();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to delete department.';
        this.loading = false;
      },
    });
  }
}
