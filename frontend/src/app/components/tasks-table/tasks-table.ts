import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, OnInit, AfterViewInit, OnDestroy } from '@angular/core'; 
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { Task } from '../../models/task';
import { TasksService } from '../../services/tasks';
import { EditTaskDialog } from '../../dialogs/edit-task/edit-task';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth';

import { GanttChartComponent } from '../gantt-chart/gantt-chart'; 
import { Team } from '../../models/team';
import { LockService } from '../../services/lock';

@Component({
	selector: 'tasks-table',
	templateUrl: './tasks-table.html',
	styleUrls: ['./tasks-table.scss'],
	imports: [CommonModule, MatTableModule, MatSortModule, MatProgressSpinnerModule, GanttChartComponent],
	standalone: true
})

export class TasksTableComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy{
	
	displayedColumns: string[] = ['id', 'name', 'team', 'person', 'start_date', 'end_date'];
	tasks: Task[] = [];

	loading = false;
	order = 0;

	//Filtering criteria
	@Input() filter !: string;
	@Input() teamIds: number[] = [];

	@Input() teams: Team[] = [];
	user: User | null = null;

	//Pagination settings
	offset: number = 0;
	limit: number = 100;
	timestamp = Date.now();

	constructor(
		private authService: AuthService,
		private tasksService: TasksService,
		private dialog: MatDialog,
		private lockService: LockService 
	) {
		this.authService.currentUser$.subscribe(user => { this.user = user; });
	}

	ngOnInit() {
		this.loadTasks();

		//Suscribe to external events to refresh
		this.tasksService.reload$.subscribe(() => this.loadTasks());
		this.lockService.lockUpdate$.subscribe(() => {this.loadTasks();});
	}

	//Reacts to changes in filters
	ngOnChanges(changes: SimpleChanges) {
		if (changes['filter'] || changes['teamIds']) {
			this.loadTasks();
		}
	}

	ngAfterViewInit() {
		window.addEventListener('focus', this.onWindowFocus);
	}

	ngOnDestroy() {
		window.removeEventListener('focus', this.onWindowFocus);
	}

	private onWindowFocus = () => {
		if (!this.loading) {
			this.loadTasks(); 
		}
	}

	loadTasks() {
		this.loading = true;
		
		this.tasksService.getTasks(
			this.filter,   
			this.limit,    
			this.offset, 
			this.order,   
			this.teamIds  
		).subscribe({
			next: tasks => {this.tasks = tasks;
				this.loading = false;
			},
			error: () => this.loading = false
		});
	}

	//Converts column name to column index 
	onSortChange(sort: Sort) {
		const col = parseInt(sort.active);    
		if (!sort.active || sort.direction === '') {
			this.order = 0;
		} 
		else {
			const numericCol = parseInt(sort.active, 10); 
			if (!isNaN(numericCol)) {
				this.order = sort.direction === 'asc' ? numericCol : -numericCol;
			}
		}

		this.loadTasks();
	}

	//Opens edit/create dialog
	openDialog(row: Task | null) {

		//Check permission
		if (!this.isInRole([0])) return;

		if (!row) {
			this.launchDialog(null);
			return;
		}

		//When we want to edit task -> lock
		this.lockService.lock('task', row.id).subscribe({
				next: () => {
					this.launchDialog(row); //Lock acquired -> open dialog
				},
				error: (err: any) => {
					//Lock failed -> alert
					if (err.lockedBy) {
						alert(`Cannot edit. Task is currently locked by: ${err.lockedBy}`);
					} 
					else {
						console.error('Lock error:', err);
					}
				}
		});
	}

	//Helper to open the dialog, ensures the lock is released when the dialog closes
	private launchDialog(row: Task | null) {
		const dialogRef = this.dialog.open(EditTaskDialog, {width: '75%', minWidth: '800px', data: { row }});

		dialogRef.afterClosed().subscribe(result => {
			//always unlock the resource when done
			if (row) {
				this.lockService.unlock('task', row.id).subscribe();
			}

			//if saved, refresh data
			if (result) {
				this.loadTasks();
			}
		});
	}

	isInRole(roles: number[]) {
		return this.authService.isInRole(this.user, roles);
	}
}
