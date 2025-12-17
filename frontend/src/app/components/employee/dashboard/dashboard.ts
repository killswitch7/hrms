import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [DatePipe],
})
export class Dashboard {
  userProfile = {
    name: 'Shuvam Sharma',
    position: 'Software Engineer',
    leaveBalance: 10,
  };

  stats = {
    leaveBalance: 10,
    attendance: 20,
    notifications: 3,
  };

  todayAttendance = {
    checkIn: new Date(),
    checkOut: null,
  };

  announcements = [
    {
      id: 1,
      title: 'New HR Policy',
      content: 'Please review the updated HR policies.',
      createdAt: new Date(),
    },
    {
      id: 2,
      title: 'Holiday Notice',
      content: 'Office will be closed on 25th Dec.',
      createdAt: new Date(),
    },
    {
      id: 3,
      title: 'Maintenance',
      content: 'System maintenance on Saturday.',
      createdAt: new Date(),
    },
  ];

  // routes match what we configured above
  quickActions = [
    { icon: '⏱️', label: 'My Attendance', page: '/employee-attendance' },
    { icon: '🎉', label: 'Holidays', page: '/employee-holidays' },
    { icon: '📝', label: 'Leave', page: '/employee-leave' },
    { icon: '💰', label: 'Payslip', page: '/employee-payslip' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  navigateTo(page: string) {
    this.router.navigate([page]);
  }

  onLogout() {
    console.log('Logout clicked, clearing session and redirecting to login');
    this.authService.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
