import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      //If the server says "401 Unauthorized" 
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('user'); 
        sessionStorage.clear();

        window.location.href = '/';
      }
      return throwError(() => error);
    })
  );
};