import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; 
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActiveUsers } from '../../services/active-users';
import { ActiveUser } from '../../models/active-user';
import { finalize } from 'rxjs'; 

@Component({
  selector: 'app-active-users',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './active-users.html',
  styleUrls: ['./active-users.scss']
})

export class ActiveUsersComponent implements OnInit {

  users: ActiveUser[] = [];
  displayedColumns: string[] = ['username', 'expires', 'actions'];
  isLoading = false;

  constructor(private service: ActiveUsers) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.service.getUsers()
      .pipe(finalize(() => this.isLoading = false)) 
      .subscribe(data => this.users = data);
  }

  kick(user: ActiveUser) {
    if(confirm(`Are you sure you want to kick ${user.username}?`)) {
      this.isLoading = true; 
      this.service.kickUser(user.token).subscribe(() => {
        this.load(); 
      });
    }
  }
}