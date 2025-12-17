import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance.html',
  styleUrls: ['./attendance.css'],
  providers: [DatePipe],
})
export class Attendance {
  today = new Date();

  todayAttendance = {
    status: 'Present',
    checkIn: new Date(this.today.setHours(9, 10)),
    checkOut: null as Date | null,
  };

  records = [
    {
      date: new Date(),
      status: 'Present',
      checkIn: '09:10',
      checkOut: '17:15',
    },
    {
      date: new Date(Date.now() - 86400000),
      status: 'Present',
      checkIn: '09:05',
      checkOut: '17:00',
    },
    {
      date: new Date(Date.now() - 2 * 86400000),
      status: 'Absent',
      checkIn: '-',
      checkOut: '-',
    },
  ];
}
