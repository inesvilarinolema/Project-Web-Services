import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Team } from '../models/team'
import { TeamsService } from '../services/teams';
import { EditTeamDialog } from '../dialogs/edit-team';
import { User } from '../models/user';
import { AuthService } from '../services/auth';

@Component({
  selector: 'teams-table',
  templateUrl: './teams-table.html',
  styleUrls: ['./teams-table.scss'],
  imports: [CommonModule, MatTableModule, MatChipsModule],
  standalone: true
})
export class TeamsTableComponent {
  displayedColumns: string[] = ['id', 'fullname', 'color'];
  teams: Team[] = [];
  private sub?: Subscription;
  user: User | null = null;

  @Input() filter: string = '';
  @Input() limit: string = '';

  constructor(private teamsService: TeamsService, private dialog: MatDialog, private snackBar: MatSnackBar, private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => { this.user = user});
  }

  ngOnInit() {
    this.sub = this.teamsService.reload$.subscribe(() => this.loadData());
  }

  loadData() {
    this.teamsService.getTeams(this.filter, this.limit).subscribe({
      next: (data) => (this.teams = data),
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? err?.message ?? 'Unknown error', 'Close', {
                        duration: 5000,
                        panelClass: ['snackbar-error']
                    });
      },
    });
  }

  openDialog(row: Team | null) {
      if(!this.isInRole([0])) return;
      const dialogRef = this.dialog.open(EditTeamDialog, {
        width: '75%',
        data: { row }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  isInRole(roles: number[]) {
    return this.authService.isInRole(this.user, roles);
  }
}
