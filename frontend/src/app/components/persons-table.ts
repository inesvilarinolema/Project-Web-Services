import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';

import { Person } from '../models/person'
import { PersonsService } from '../services/persons';

@Component({
  selector: 'app-persons-table',
  templateUrl: './persons-table.html',
  styleUrls: ['./persons-table.scss'],
  imports: [CommonModule, MatTableModule],
  standalone: true
})
export class PersonsTableComponent {
  displayedColumns: string[] = ['id', 'name'];
  persons: Person[] = [];
  private sub?: Subscription;

  constructor(private personsService: PersonsService) {}

  ngOnInit() {
    this.loadData();
    this.sub = this.personsService.reload$.subscribe(() => this.loadData());
  }

  loadData() {
    this.personsService.getPersons().subscribe({
      next: (data) => (this.persons = data),
      error: (err) => console.error(err),
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
