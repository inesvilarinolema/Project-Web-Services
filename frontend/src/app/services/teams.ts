import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {  Observable } from 'rxjs';

import { Team } from '../models/team';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  private apiUrl = '/api/teams';
  
  constructor(private http: HttpClient) {}
  
  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(this.apiUrl);
  }
}
