import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';

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
  persons$!: Observable<Person[]>;

  constructor(private personsService: PersonsService) {}

  ngOnInit(): void {
    this.persons$ = this.personsService.getPersons();
  }
}
