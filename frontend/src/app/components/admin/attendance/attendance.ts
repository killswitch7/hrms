import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance.html',
  styleUrls: ['./attendance.css'],
})
export class AdminAttendance {
  records = [
    { name: 'John Doe', date: new Date(), status: 'Present', checkIn: '09:05', checkOut: '17:15' },
    { name: 'Jane Smith', date: new Date(), status: 'Absent', checkIn: '-', checkOut: '-' },
  ];
}
