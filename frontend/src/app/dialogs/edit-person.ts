import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PersonFormComponent } from '../components/person-form';
import { Person } from '../models/person';

@Component({
  selector: 'app-edit-person',
  standalone: true,
  imports: [ MatDialogModule, PersonFormComponent ],
  templateUrl: './edit-person.html',
  styleUrl: './edit-person.scss'
})
export class EditPersonDialog {

    constructor(
        private dialogRef: MatDialogRef<EditPersonDialog>,
        @Inject(MAT_DIALOG_DATA) public data: { row: Person }
    ) {}

    close() {
        this.dialogRef.close();
    }
}
