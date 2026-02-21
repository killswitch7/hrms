import { Component } from '@angular/core';
import { AdminDashboard } from '../../admin/admin-dashboard/admindashboard';

// We reuse admin dashboard component for manager dashboard UI.
@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [AdminDashboard],
  templateUrl: './manager-dashboard.html',
  styleUrls: ['./manager-dashboard.css'],
})
export class ManagerDashboard {}
