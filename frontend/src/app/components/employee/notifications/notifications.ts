import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css'],
})
export class Notifications {
  notifications = [
    {
      title: 'New HR Policy',
      message: 'Please review the updated HR policies.',
      type: 'info',
      createdAt: new Date(),
      read: false,
    },
    {
      title: 'Holiday Notice',
      message: 'Office will be closed on 25th Dec.',
      type: 'info',
      createdAt: new Date(),
      read: true,
    },
    {
      title: 'System Maintenance',
      message: 'System maintenance is scheduled for Saturday 2–4 AM.',
      type: 'warning',
      createdAt: new Date(),
      read: false,
    },
  ];

  markAllRead() {
    this.notifications.forEach(n => (n.read = true));
  }
}
