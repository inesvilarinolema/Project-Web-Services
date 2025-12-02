import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { Person } from '../../models/person'
import { PersonsService } from '../../services/persons';
import { EditPersonDialog } from '../../dialogs/edit-person/edit-person';
import { ColorsService } from '../../services/colors';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'persons-table',
  templateUrl: './persons-table.html',
  styleUrls: ['./persons-table.scss'],
  imports: [CommonModule, MatTableModule, MatChipsModule, MatProgressSpinner],
  standalone: true
})
export class PersonsTableComponent {
  displayedColumns: string[] = ['id', 'firstname', 'lastname', 'birthdate', 'teams'];
  persons: Person[] = [];
  private sub?: Subscription;
  @Input() filter: string = '';
  @Input() limit: number = 10;
  getContrastColor: (color: string) => string;
  user: User | null = null;
  loading: boolean = false;

  constructor(private authService: AuthService, private colorsService: ColorsService, private personsService: PersonsService, private dialog: MatDialog, private snackBar: MatSnackBar) {
    this.authService.currentUser$.subscribe(user => { this.user = user });
    this.getContrastColor = this.colorsService.getContrastColor;
  }

  ngOnInit() {
    this.sub = this.personsService.reload$.subscribe(() => this.loadData());
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.personsService.getPersons(this.filter, this.limit).subscribe({
      next: (data) => { 
        this.loading = false;
        this.persons = data
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err?.error?.message ?? err?.message ?? 'Unknown error', 'Close', {
            duration: 5000,
            panelClass: ['snackbar-error']
        });
      },
    });
  }

  openDialog(row: Person | null) {
      if (!this.isInRole([0])) return;
      row!.team_ids = row?.team_objects?.map(team => team.id);
      const dialogRef = this.dialog.open(EditPersonDialog, {
        width: '75%',
        data: { row }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  isInRole(roles: number[]) {
    return this.authService.isInRole(this.user, roles);
  }
}
