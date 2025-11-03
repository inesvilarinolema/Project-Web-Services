import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { PersonsTableComponent } from '../../components/persons-table';
import { EditPersonDialog } from '../../dialogs/edit-person';

@Component({
    selector: 'persons-page',
    imports: [MatButtonModule, PersonsTableComponent],
    templateUrl: './persons.html',
    styleUrls: ['./persons.scss'],
    standalone: true
})
export class PersonsPage {

    constructor(private dialog: MatDialog) {}

    openDialog() {
        const dialogRef = this.dialog.open(EditPersonDialog, {
            width: '75%',
            data: { row: null }
        });
    }
}
