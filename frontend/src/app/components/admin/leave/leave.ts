import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-leave-approvals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leave.html',
  styleUrls: ['./leave.css'],
})
export class Leave {
  requests = [
    { employee: 'John Doe', type: 'Annual', from: new Date(), to: new Date(), status: 'Pending' },
    { employee: 'Jane Smith', type: 'Sick', from: new Date(), to: new Date(), status: 'Approved' },
  ];
}
