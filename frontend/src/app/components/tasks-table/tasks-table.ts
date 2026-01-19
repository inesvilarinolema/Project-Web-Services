import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core'; // <--- AÑADIDO OnChanges, SimpleChanges
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

@Component({
  selector: 'tasks-table',
  templateUrl: './tasks-table.html',
  styleUrls: ['./tasks-table.scss'],
  imports: [CommonModule, MatTableModule, MatSortModule, MatProgressSpinnerModule, GanttChartComponent],
  standalone: true
})

export class TasksTableComponent implements OnInit, OnChanges{
  displayedColumns: string[] = ['id', 'name', 'team', 'person', 'start_date', 'end_date'];
  tasks: Task[] = [];

  loading = false;
  order = 0;

  @Input() filter !: string;
  @Input() teamIds: number[] = [];

  @Input() teams: Team[] = [];
  user: User | null = null;

  offset: number = 0;
  limit: number = 100;
  timestamp = Date.now();

  constructor(
    private authService: AuthService,
    private tasksService: TasksService,
    private dialog: MatDialog
  ) {
    this.authService.currentUser$.subscribe(user => { this.user = user; });
  }

  ngOnInit() {
    this.loadTasks();
    this.tasksService.reload$.subscribe(() => this.loadTasks());
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['filter'] || changes['teamIds']) {
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

  onSortChange(sort: Sort) {
    const col = parseInt(sort.active);    
    if (!sort.active || sort.direction === '') {
       this.order = 0;
    } else {
       const numericCol = parseInt(sort.active, 10); 
       if (!isNaN(numericCol)) {
         this.order = sort.direction === 'asc' ? numericCol : -numericCol;
       }
    }
    this.loadTasks();
  }

  openDialog(row: Task | null) {
    if (!this.isInRole([0])) return;

    const dialogRef = this.dialog.open(EditTaskDialog, {
      width: '75%',
      minWidth: '800px',
      data: { row }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks();
      }
    });
  }

  isInRole(roles: number[]) {
    return this.authService.isInRole(this.user, roles);
  }
}
