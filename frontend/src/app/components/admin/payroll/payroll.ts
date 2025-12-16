import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payroll.html',
  styleUrls: ['./payroll.css'],
})
export class Payroll {
  payrolls = [
    { employee: 'John Doe', month: 'Jan 2025', basic: 50000, allowance: 5000, net: 55000 },
    { employee: 'Jane Smith', month: 'Jan 2025', basic: 48000, allowance: 4000, net: 52000 },
  ];
}
