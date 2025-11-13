import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

import { PersonsTableComponent } from '../../components/persons-table';
import { EditPersonDialog } from '../../dialogs/edit-person';
import { PersonsService } from '../../services/persons';

@Component({
    selector: 'persons-page',
    imports: [MatButtonModule, MatInputModule, MatIconModule, ReactiveFormsModule, PersonsTableComponent],
    templateUrl: './persons.html',
    styleUrls: ['./persons.scss'],
    standalone: true
})
export class PersonsPage {
    filterControl = new FormControl('');
    limitControl = new FormControl('10');

    constructor(private dialog: MatDialog, private personsService: PersonsService) {
        this.filterControl.valueChanges.
            pipe(debounceTime(200)).
            subscribe(value => {
                this.personsService.notifyReload();
            });
        this.limitControl.valueChanges.
            pipe(debounceTime(200)).
            subscribe(value => {
                this.personsService.notifyReload();
            });
    }

    openDialog() {
        const dialogRef = this.dialog.open(EditPersonDialog, {
            width: '75%',
            data: { row: null }
        });
    }
}
