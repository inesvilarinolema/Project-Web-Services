import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog } from '../models/audit-log';

@Injectable({
  providedIn: 'root'
})

export class Audit {
  private apiUrl = '/api/audit'; 

  constructor(private http: HttpClient) {}

  getLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(this.apiUrl);
  }
}