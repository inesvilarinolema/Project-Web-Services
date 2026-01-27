import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';

import { Team } from '../../models/team'
import { TeamsService } from '../../services/teams';
import { EditTeamDialog } from '../../dialogs/edit-team/edit-team';
import { ColorsService } from '../../services/colors';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth';
import { LockService } from '../../services/lock';

@Component({
	selector: 'teams-table',
	templateUrl: './teams-table.html',
	styleUrls: ['./teams-table.scss'],
	imports: [CommonModule, MatSortModule, MatTableModule, MatChipsModule, MatProgressSpinnerModule],
	standalone: true
})

export class TeamsTableComponent implements OnInit, OnDestroy, OnChanges {
	displayedColumns: string[] = ['id', 'name', 'avatar', 'longname', 'member_count'];
	teams: Team[] = [];
	private sub?: Subscription;

	getContrastColor: (color: string) => string;
	user: User | null = null;
	loading: boolean = false;
	timestamp = Date.now();
	order: number = 1;

	@Input() filter: string = '';
	
	constructor(private authService: AuthService, private colorsService: ColorsService, private teamsService: TeamsService, private dialog: MatDialog, private snackBar: MatSnackBar, private lockService: LockService) {
		this.authService.currentUser$.subscribe(user => { this.user = user });
		this.getContrastColor = this.colorsService.getContrastColor;
	}
	
	ngOnInit() {
		this.loadData();

		//Suscribe to reload request from the service
		this.sub = this.teamsService.reload$.subscribe(() => this.loadData());
		
		//Suscribe to lock updates
		this.lockService.lockUpdate$.subscribe(() => { this.loadData(); });
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['filter']) {
			this.loadData();
		}
  	}

	loadData() {
		this.loading = true;
		this.teamsService.getTeams(this.filter, this.order).subscribe({
			next: (data) => {
				this.loading = false;
				this.teams = data;
			},
			error: (err) => {
				this.loading = false;
				this.snackBar.open(err?.error?.message ?? err?.message ?? 'Unknown error', 'Close', {
												duration: 5000,
												panelClass: ['snackbar-error']
										});
			},
		});
	}

	//Implements lock to prevent concurrent edits
	openDialog(row: Team | null) {
		//Security Check, only admin
		if (!this.isInRole([0])) return;

		//If create new Team  -> no lock needed
		if (!row) {
			this.launchDialog(null);
			return;
		}

		//Edit existing Team -> attempt to lock first
		this.lockService.lock('team', row.id).subscribe({
			next: () => {
				//Lock acquired successfully -> Open Dialog
				this.launchDialog(row);
			},
			error: (err: any) => {
				//Lock failed
				if (err.lockedBy) {
					alert(`Cannot edit. Team is currently locked by: ${err.lockedBy}`);
				} else {
					//console.error('Lock error:', err);
					this.snackBar.open('Error acquiring lock', 'Close', { duration: 3000 });
				}
			}
		});
	}

	//Helper to open the dialog and handle the result, ensures the lock is released when dialog closes
	private launchDialog(row: Team | null) {
		const dialogRef = this.dialog.open(EditTeamDialog, {
			width: '100%',
			maxWidth: '75vw',
			data: { row }
		});

		dialogRef.afterClosed().subscribe(result => {
			//Always unlock when finished
			if (row) {
				this.lockService.unlock('team', row.id).subscribe();
			}

			//If changes were saved, refresh
			if(result) {
				this.timestamp = Date.now();
				this.loadData();
			}
		});
	}

	ngOnDestroy() {
		this.sub?.unsubscribe();
	}

	isInRole(roles: number[]) {
		return this.authService.isInRole(this.user, roles);
	}

	//Handles column sorting
	onSortChange(sort: Sort) {
		const columnNo = parseInt(sort.active);
		if(columnNo) {
			switch(sort.direction) {
				case 'asc':
					this.order = columnNo;
					this.loadData();
					break;
				case 'desc':
					this.order = -columnNo;
					this.loadData();
					break;
			}
		}
	}
}
