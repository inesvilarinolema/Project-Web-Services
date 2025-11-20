import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';

import { Person } from '../models/person'
import { PersonsService } from '../services/persons';
import { EditPersonDialog } from '../dialogs/edit-person';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';

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

  @Input() filter: string = '';
  @Input() limit: string = '';

  constructor(private personsService: PersonsService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadData();
    this.sub = this.personsService.reload$.subscribe(() => this.loadData());
  }

  loadData() {
    this.personsService.getPersons(this.filter, this.limit).subscribe({
      next: (data) => (this.persons = data),
      error: (err) => console.error(err),
    });
  }

  openDialog(row: Person | null) {
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
}
