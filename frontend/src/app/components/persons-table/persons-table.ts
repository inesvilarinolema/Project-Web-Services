import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { Person } from '../../models/person'
import { PersonsService } from '../../services/persons';
import { EditPersonDialog } from '../../dialogs/edit-person/edit-person';
import { ColorsService } from '../../services/colors';

@Component({
  selector: 'persons-table',
  templateUrl: './persons-table.html',
  styleUrls: ['./persons-table.scss'],
  imports: [CommonModule, MatTableModule, MatChipsModule],
  standalone: true
})
export class PersonsTableComponent {
  displayedColumns: string[] = ['id', 'firstname', 'lastname', 'birthdate', 'teams'];
  persons: Person[] = [];
  private sub?: Subscription;
  @Input() filter: string = '';
  @Input() limit: number = 10;
  getContrastColor: (color: string) => string;

  constructor(private colorsService: ColorsService, private personsService: PersonsService, private dialog: MatDialog) {
    this.getContrastColor = this.colorsService.getContrastColor;
  }

  ngOnInit() {
    this.sub = this.personsService.reload$.subscribe(() => this.loadData());
    this.loadData();
  }

  loadData() {
    this.personsService.getPersons(this.filter, this.limit).subscribe({
      next: (data) => ( this.persons = data ),
      error: (err) => console.error(err),
    });
  }

  openDialog(row: Person | null) {
      row!.team_ids = row?.team_objects?.map(team => team.id);
      const dialogRef = this.dialog.open(EditPersonDialog, {
        width: '75%',
        data: { row }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
