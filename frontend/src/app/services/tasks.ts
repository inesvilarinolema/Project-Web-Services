import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';

import { Task } from '../models/task';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private apiUrl = '/api/tasks';
  
  //Subject to notify components to reload the tasks list
  private reloadSubject = new BehaviorSubject<void>(undefined);
  reload$ = this.reloadSubject.asObservable();

  constructor(private http: HttpClient) {}

  //Get tasks with filtering, pagination, and sorting.
  getTasks(
    filter: string = '', 
    limit: number = 100, 
    offset: number = 0, 
    sortColumn: number = 0,
    teamIds: number[] = []
  ): Observable<Task[]> {
    
    let params: any = {
      q: filter,
      limit: limit,
      offset: offset,
      order: sortColumn
    };

    //If we receive team IDs, we convert them to the string "1,2,5".
    if (teamIds && teamIds.length > 0) {
      params.team_ids = teamIds.join(','); 
    }

    //We sent the request with the params.
    return this.http.get<{ tasks: Task[] }>(this.apiUrl, { params })
      .pipe(
        map(response => response.tasks) 
      );
  }

  addTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(this.apiUrl, task);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(this.apiUrl, { 
      params: { id: id.toString() } 
    });  }

  notifyReload() {
    this.reloadSubject.next();
  }
}
