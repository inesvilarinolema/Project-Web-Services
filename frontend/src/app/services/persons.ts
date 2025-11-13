import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

import { Person } from '../models/person';

@Injectable({
  providedIn: 'root'
})
export class PersonsService {
  private apiUrl = '/api/persons';
  
  // Subject to notify components to reload the persons list
  private reloadSubject = new BehaviorSubject<void>(undefined);
  // Observable that components can subscribe to
  reload$ = this.reloadSubject.asObservable();

  constructor(private http: HttpClient) {}

  getPersons(filter: string = '', limit = ''): Observable<Person[]> {
    const params = new HttpParams().set('filter', filter).set('limit', limit);
    return this.http.get<Person[]>(this.apiUrl, { params });
  }

  newPerson(person: Person): Observable<Person> {
    return this.http.post<Person>(this.apiUrl, person);
  }

  modifyPerson(person: Person): Observable<Person> {
    return this.http.put<Person>(this.apiUrl, person);
  }

  deletePerson(id: number): Observable<Person> {
    const params = new HttpParams().set('id', id);
    return this.http.delete<Person>(this.apiUrl, { params });
  }

  // Method to notify subscribers to reload the persons list
  notifyReload() {
    this.reloadSubject.next();
  }
}
