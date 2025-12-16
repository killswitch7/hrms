import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employees.html',
  styleUrls: ['./employees.css'],
})
export class Employees {
  employees = [
    { name: 'John Doe', position: 'Developer', department: 'IT', status: 'active' },
    { name: 'Jane Smith', position: 'Designer', department: 'UI/UX', status: 'active' },
  ];
}
