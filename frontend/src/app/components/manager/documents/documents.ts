import { Component } from '@angular/core';
import { EmployeeDocuments } from '../../employee/documents/documents';

@Component({
  selector: 'app-manager-documents',
  standalone: true,
  imports: [EmployeeDocuments],
  templateUrl: './manager-documents.html',
  styleUrls: ['./manager-documents.css'],
})
export class ManagerDocuments {}

