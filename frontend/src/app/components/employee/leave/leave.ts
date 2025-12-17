import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-leave',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave.html',
  styleUrls: ['./leave.css'],
})
export class Leave {
  leaveBalance = 10;

  newRequest = {
    type: 'Annual',
    from: '',
    to: '',
    reason: '',
  };

  requests = [
    {
      type: 'Sick',
      from: new Date(Date.now() - 5 * 86400000),
      to: new Date(Date.now() - 4 * 86400000),
      status: 'Approved',
    },
    {
      type: 'Annual',
      from: new Date(Date.now() + 7 * 86400000),
      to: new Date(Date.now() + 9 * 86400000),
      status: 'Pending',
    },
  ];

  submitRequest() {
    if (!this.newRequest.from || !this.newRequest.to || !this.newRequest.reason) {
      alert('Please fill all fields');
      return;
    }

    this.requests.unshift({
      type: this.newRequest.type,
      from: new Date(this.newRequest.from),
      to: new Date(this.newRequest.to),
      status: 'Pending',
    });

    this.newRequest = {
      type: 'Annual',
      from: '',
      to: '',
      reason: '',
    };
  }
}
