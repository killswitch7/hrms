import { Component } from '@angular/core';
import { Attendance as EmployeeAttendance } from '../../employee/attendance/attendance';

// Manager attendance page uses same UI as employee attendance.
@Component({
  selector: 'app-manager-attendance',
  standalone: true,
  imports: [EmployeeAttendance],
  templateUrl: './manager-attendance.html',
  styleUrls: ['./manager-attendance.css'],
})
export class ManagerAttendance {}
