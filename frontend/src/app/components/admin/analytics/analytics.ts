import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.css'],
})
export class Analytics {
  metrics = [
    { name: 'Attendance Rate', value: '84%' },
    { name: 'Leave Approval Rate', value: '80%' },
    { name: 'Average Tenure', value: '2.4 years' },
  ];
}
