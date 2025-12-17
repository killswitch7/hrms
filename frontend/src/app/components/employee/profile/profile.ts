import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile {
  profile = {
    name: 'Shuvam Sharma',
    email: 'employee@company.com',
    position: 'Software Engineer',
    department: 'IT',
    employeeId: 'EMP-001',
    joinDate: new Date('2023-01-10'),
    reportingManager: 'Admin User',
  };
}
