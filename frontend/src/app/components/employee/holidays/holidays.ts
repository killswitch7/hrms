import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-holidays',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './holidays.html',
  styleUrls: ['./holidays.css'],
})
export class Holidays {
  holidays = [
    { name: 'New Year', date: new Date('2025-01-01'), type: 'Public Holiday' },
    { name: 'Republic Day', date: new Date('2025-01-26'), type: 'Public Holiday' },
    { name: 'Good Friday', date: new Date('2025-04-18'), type: 'Company Holiday' },
    { name: 'Diwali', date: new Date('2025-10-20'), type: 'Festival' },
  ];
}
