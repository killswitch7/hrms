import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './announcements.html',
  styleUrls: ['./announcements.css'],
})
export class Announcements {
  announcements = [
    { title: 'New Office Timing', content: 'Office timing updated to 9:30 AM - 6:30 PM', createdAt: new Date() },
    { title: 'Maintenance', content: 'Server maintenance on Sunday 2 AM - 4 AM', createdAt: new Date() },
  ];
}
