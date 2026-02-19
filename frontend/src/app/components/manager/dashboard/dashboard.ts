import { Component } from '@angular/core';
import { AdminDashboard } from '../../admin/admin-dashboard/admindashboard';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [AdminDashboard],
  templateUrl: './manager-dashboard.html',
  styleUrls: ['./manager-dashboard.css'],
})
export class ManagerDashboard {}
