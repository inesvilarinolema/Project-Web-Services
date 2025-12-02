import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PersonsTableComponent } from '../../components/persons-table/persons-table';
import { EditPersonDialog } from '../../dialogs/edit-person/edit-person';
import { PersonsService } from '../../services/persons';
import { debounceTime } from 'rxjs';

@Component({
    selector: 'persons-page',
    imports: [MatButtonModule, MatInputModule, MatSelectModule, FormsModule, ReactiveFormsModule, PersonsTableComponent],
    templateUrl: './persons.html',
    styleUrls: ['./persons.scss'],
    standalone: true
})
export class PersonsPage {
    filterControl = new FormControl('');
    limitControl = new FormControl(10);

    constructor(private personsService: PersonsService, private dialog: MatDialog) {
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
