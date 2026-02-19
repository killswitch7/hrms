import { Component } from '@angular/core';
import { Leave as EmployeeLeave } from '../../employee/leave/leave';

@Component({
  selector: 'app-manager-leave',
  standalone: true,
  imports: [EmployeeLeave],
  templateUrl: './manager-leave.html',
  styleUrls: ['./manager-leave.css'],
})
export class ManagerLeave {}
