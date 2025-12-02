import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { PersonsTableComponent } from '../../components/persons-table/persons-table';
import { EditPersonDialog } from '../../dialogs/edit-person/edit-person';
import { PersonsService } from '../../services/persons';
import { debounceTime } from 'rxjs';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'persons-page',
    imports: [MatButtonModule, MatInputModule, MatSelectModule, FormsModule, MatIconModule, ReactiveFormsModule, PersonsTableComponent],
    templateUrl: './persons.html',
    styleUrls: ['./persons.scss'],
    standalone: true
})
export class PersonsPage {
    filterControl = new FormControl('');
    user: User | null = null;
    
    constructor(private authService: AuthService, private personsService: PersonsService, private dialog: MatDialog) {
        this.authService.currentUser$.subscribe(user => { this.user = user });
        this.filterControl.valueChanges.
            pipe(debounceTime(200)).
            subscribe(value => {
                this.personsService.notifyReload();
            });
    }

    openDialog() {
        const dialogRef = this.dialog.open(EditPersonDialog, { // new person dialog
            width: '75%',
            data: { row: null }
        });
        dialogRef.afterClosed().subscribe(result => {
            if(!result) return;
            this.filterControl.patchValue(result + ' '); // display only record just added
        })
    }

    isInRole(roles: number[]) {
           return this.authService.isInRole(this.user, roles);
    }
}