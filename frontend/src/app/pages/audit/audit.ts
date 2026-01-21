import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table'; 
import { MatCardModule } from '@angular/material/card'; 
import { Audit } from '../../services/audit';
import { AuditLog } from '../../models/audit-log';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule],
  templateUrl: './audit.html',
  styleUrls: ['./audit.scss']
})

export class AuditComponent implements OnInit {
  logs: AuditLog[] = [];

  displayedColumns: string[] = ['timestamp', 'user', 'action', 'target', 'details'];

  constructor(private auditService: Audit ) {}

  ngOnInit() {
    this.auditService.getLogs().subscribe({
      next: (data) => {
        this.logs = data;
      },
      error: (err) => console.error('Error uploading logs:', err)
    });
  }

  getActionColor(action: string): string {
    switch(action) {
      case 'CREATE': return 'green';
      case 'DELETE': return 'red';
      case 'UPDATE': return 'orange';
      default: return 'black';
    }
  }
}