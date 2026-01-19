import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms'; // <--- Añade FormsModule
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select'; 
import { MatDialog } from '@angular/material/dialog';
import { debounceTime } from 'rxjs';

import { TasksTableComponent } from '../../components/tasks-table/tasks-table';
import { EditTaskDialog } from '../../dialogs/edit-task/edit-task';
import { TasksService } from '../../services/tasks';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth';
import { TeamsService } from '../../services/teams'; 
import { Team } from '../../models/team';

@Component({
    selector: 'tasks-page',
    imports: [
        CommonModule,
        TasksTableComponent,
        ReactiveFormsModule,
        FormsModule,      
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSelectModule    
    ],
    templateUrl: './tasks.html',
    styleUrls: ['./tasks.scss'],
    standalone: true
})

export class TasksPage {
    filterControl = new FormControl('');
    user: User | null = null;

    teams: Team[] = []; 
    selectedTeamIds: number[] = [];

    constructor(private authService: AuthService, private dialog: MatDialog, private tasksService: TasksService, private teamsService: TeamsService) {
        this.authService.currentUser$.subscribe(user => { this.user = user });

        this.filterControl.valueChanges
            .pipe(debounceTime(200))
            .subscribe(value => {
                this.tasksService.notifyReload();
            });
    }

    ngOnInit() {
        this.teamsService.getTeams().subscribe(teams => {
            this.teams = teams;
        });
    }

    openDialog() {
        const dialogRef = this.dialog.open(EditTaskDialog, {
            width: '75%',
            data: { row: null }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result) return;
            this.tasksService.notifyReload();
        });
    }

    isInRole(roles: number[]) {
        return this.authService.isInRole(this.user, roles);
    }
}
