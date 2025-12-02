import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

import { TeamsTableComponent } from '../../components/teams-table/teams-table';
import { EditTeamDialog } from '../../dialogs/edit-team/edit-team';
import { TeamsService } from '../../services/teams';

@Component({
    selector: 'teams-page',
    imports: [MatButtonModule, MatInputModule, MatIconModule, ReactiveFormsModule, TeamsTableComponent],
    templateUrl: './teams.html',
    styleUrls: ['./teams.scss'],
    standalone: true
})
export class TeamsPage {
    filterControl = new FormControl('');
    limitControl = new FormControl('10');

    constructor(private dialog: MatDialog, private teamsService: TeamsService) {
        this.filterControl.valueChanges.
            pipe(debounceTime(200)).
            subscribe(value => {
                this.teamsService.notifyReload();
            });
        this.limitControl.valueChanges.
            pipe(debounceTime(200)).
            subscribe(value => {
                this.teamsService.notifyReload();
            });
    }

    openDialog() {
        const dialogRef = this.dialog.open(EditTeamDialog, {
            width: '75%',
            data: { row: null }
        });
    }
}
