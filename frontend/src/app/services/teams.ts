import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

import { Team } from '../models/team';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  private apiUrl = '/api/teams';
  
  // Subject to notify components to reload the teams list
  private reloadSubject = new BehaviorSubject<void>(undefined);
  // Observable that components can subscribe to
  reload$ = this.reloadSubject.asObservable();

  constructor(private http: HttpClient) {}

  getTeams(filter: string = '', limit = ''): Observable<Team[]> {
    const params = new HttpParams().set('filter', filter).set('limit', limit);
    return this.http.get<Team[]>(this.apiUrl, { params });
  }

  newTeam(team: Team): Observable<Team> {
    return this.http.post<Team>(this.apiUrl, team);
  }

  modifyTeam(team: Team): Observable<Team> {
    return this.http.put<Team>(this.apiUrl, team);
  }

  deleteTeam(id: number): Observable<Team> {
    const params = new HttpParams().set('id', id);
    return this.http.delete<Team>(this.apiUrl, { params });
  }

  // Method to notify subscribers to reload the teams list
  notifyReload() {
    this.reloadSubject.next();
  }
}
