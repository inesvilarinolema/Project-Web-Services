import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, throwError, Subject } from 'rxjs';
import { WebsocketService } from './websocket'; 

@Injectable({
  providedIn: 'root'
})
export class LockService {

  public lockUpdate$ = new Subject<void>();

  constructor(private http: HttpClient, private wsService: WebsocketService) { 
    this.wsService.messages$.subscribe(msg => {
          if (msg.type === 'lockUpdate') {
              console.log('Lock liberado por otro usuario. Recargando...');
              this.lockUpdate$.next();
          }
      
    });
  }

  lock(type: string, id: number): Observable<boolean> {
    return this.http.post<any>(`/api/locks/${type}/${id}`, {}).pipe(map(() => true), 
      catchError((err: HttpErrorResponse) => {
        
        if (err.status === 409) {
          return throwError(() => err.error); 
        }
        return throwError(() => err);
      })
    );
  }

  
  unlock(type: string, id: number): Observable<boolean> {
    return this.http.delete<any>(`/api/locks/${type}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false)) 
    );
  }
}