import { Component, Inject, Sanitizer, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PersonFormComponent } from '../components/person-form';
import { Person } from '../models/person';
import { PersonsService } from '../services/persons';

@Component({
  selector: 'edit-person',
  standalone: true,
  imports: [ MatDialogModule, PersonFormComponent ],
  templateUrl: './edit-person.html',
  styleUrls: ['./edit-person.scss']
})
export class EditPersonDialog {

    @ViewChild(PersonFormComponent) personForm!: PersonFormComponent;

    formValid: boolean = false;

    constructor(
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<EditPersonDialog>,
        private personsService: PersonsService,
        @Inject(MAT_DIALOG_DATA) public data: { row: Person }
    ) {}

    onAdd(): void {
        if (this.personForm.form.valid) {
            const newPerson: Person = this.personForm.form.value;
            this.personsService.newPerson(newPerson).subscribe({
                next: person => {
                    this.personsService.notifyReload(); // notify other components to reload the list
                },
                error: err => {
                    this.snackBar.open(err?.error?.message ?? err?.message ?? 'Unknown error', 'Close', {
                        duration: 5000,
                        panelClass: ['snackbar-error']
                    });
                }
            });
            this.dialogRef.close();
        }
    }

    onModify(): void {
        if (this.personForm.form.valid) {
            const updatedPerson: Person = this.personForm.form.value;
            updatedPerson.id = this.data.row.id;
            this.personsService.modifyPerson(updatedPerson).subscribe({
                next: person => {
                    this.personsService.notifyReload(); // notify
                    this.snackBar.open(`Person ${person.id} modified`, 'Close', {
                        duration: 5000,
                        panelClass: ['snackbar-success']
                    });
                },
                error: err => {
                    this.snackBar.open(err?.error?.message ?? err?.message ?? 'Unknown error', 'Close', {
                        duration: 5000,
                        panelClass: ['snackbar-error']
                    });
                }
            });
            this.dialogRef.close();
        }
    }

    onFormValidChange(valid: boolean) {
        this.formValid = valid;
    }
}