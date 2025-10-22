import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { PersonsTableComponent } from '../components/persons-table';
import { EditPersonDialog } from '../dialogs/edit-person';

@Component({
    selector: 'main-page',
    imports: [MatButtonModule, PersonsTableComponent],
    templateUrl: './main.html',
    styleUrls: ['./main.scss'],
    standalone: true
})
export class MainPage {

    constructor(private dialog: MatDialog) {}

    protected title = 'PWS 2025';

    openDialog() {
        const dialogRef = this.dialog.open(EditPersonDialog, {
            width: '75%',
            data: { row: null }
        });
    }
}
