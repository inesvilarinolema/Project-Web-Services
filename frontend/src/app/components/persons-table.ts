import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Person } from '../models/person'
import { PersonsService } from '../services/persons';
import { EditPersonDialog } from '../dialogs/edit-person';
import { User } from '../models/user';
import { AuthService } from '../services/auth';

@Component({
  selector: 'persons-table',
  templateUrl: './persons-table.html',
  styleUrls: ['./persons-table.scss'],
  imports: [CommonModule, MatTableModule, MatChipsModule],
  standalone: true
})
export class PersonsTableComponent {
  displayedColumns: string[] = ['id', 'firstname', 'lastname', 'birthdate', 'team'];
  persons: Person[] = [];
  private sub?: Subscription;
  user: User | null = null;

  @Input() filter: string = '';
  @Input() limit: string = '';

  constructor(private personsService: PersonsService, private dialog: MatDialog, private snackBar: MatSnackBar, private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => { this.user = user});
  }

  ngOnInit() {
    this.sub = this.personsService.reload$.subscribe(() => this.loadData());
  }

  loadData() {
    this.personsService.getPersons(this.filter, this.limit).subscribe({
      next: (data) => (this.persons = data),
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? err?.message ?? 'Unknown error', 'Close', {
                        duration: 5000,
                        panelClass: ['snackbar-error']
                    });
      },
    });
  }

  openDialog(row: Person | null) {
      if(!this.isInRole([0])) return;
      const dialogRef = this.dialog.open(EditPersonDialog, {
        width: '75%',
        data: { row }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  formatDate(date: any) {
    return new Date(date).toLocaleDateString()
  }

  isInRole(roles: number[]) {
    return this.authService.isInRole(this.user, roles);
  }
}
