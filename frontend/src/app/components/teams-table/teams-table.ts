import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Team } from '../../models/team'
import { TeamsService } from '../../services/teams';
import { EditTeamDialog } from '../../dialogs/edit-team/edit-team';
import { ColorsService } from '../../services/colors';

@Component({
  selector: 'teams-table',
  templateUrl: './teams-table.html',
  styleUrls: ['./teams-table.scss'],
  imports: [CommonModule, MatTableModule, MatChipsModule],
  standalone: true
})
export class TeamsTableComponent {
  displayedColumns: string[] = ['id', 'name', 'longname', 'avatar', 'member_count'];
  teams: Team[] = [];
  private sub?: Subscription;
  getContrastColor: (color: string) => string;

  @Input() filter: string = '';
  @Input() limit: string = '';

  constructor(private colorsService: ColorsService, private teamsService: TeamsService, private dialog: MatDialog, private snackBar: MatSnackBar) {
    this.getContrastColor = this.colorsService.getContrastColor;    
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
      const dialogRef = this.dialog.open(EditTeamDialog, {
        width: '75%',
        data: { row }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
