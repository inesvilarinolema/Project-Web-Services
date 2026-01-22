import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActiveUser } from '../models/active-user';

@Injectable({ providedIn: 'root' })
export class ActiveUsers {
    
  private apiUrl = '/api/active-users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<ActiveUser[]> {
    return this.http.get<ActiveUser[]>(this.apiUrl);
  }

  kickUser(token: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${token}`);
  }
}