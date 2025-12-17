import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-payslip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payslip.html',
  styleUrls: ['./payslip.css'],
})
export class Payslip {
  payslips = [
    { month: 'Jan 2025', basic: 50000, allowance: 5000, deductions: 2000, net: 53000 },
    { month: 'Dec 2024', basic: 50000, allowance: 5000, deductions: 3000, net: 52000 },
  ];
}
