import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AppRoute, routes } from './app.routes';
import { AuthService } from './services/auth';
import { User } from './models/user';
import { LoginDialog } from './dialogs/login';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  title: string = 'PWS 2025';
  user: User | null = null;
  routes = routes;
  generalError: string = '';
  
  constructor (private router: Router, private authService: AuthService, private dialog: MatDialog) {
    this.authService.currentUser$.subscribe(u => (this.user = u));
  }

  ngOnInit() {
    this.authService.whoami().subscribe({
      error: err => {
        console.error('Error fetching user:', err);
        this.generalError = 'Failed to connect to the backend server';
      }
    });
  }

  onLogin() {
    const dialogRef = this.dialog.open(LoginDialog, {
      width: '33%'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'submitted') {
        this.router.navigate(['/']);
      }
    });
  }

  onLogout() {
    this.authService.logout().subscribe();
    this.router.navigate(['/']);
  }
  
  isRouteAvailable(route: AppRoute): boolean {
    return this.authService.isRouteAvailable(this.user!, route);
  }
}
