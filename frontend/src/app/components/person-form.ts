import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { Person } from '../models/person'
import { PersonsService } from '../services/persons';

@Component({
  selector: 'app-person-form',
  templateUrl: './person-form.html',
  styleUrls: ['./person-form.scss'],
  imports: [CommonModule, FormsModule, MatCardModule, MatInputModule, MatButtonModule],
  standalone: true
})
export class PersonFormComponent {
  person$!: Observable<Person>;
  name: string = '';

  constructor(private personsService: PersonsService) {}

  onSubmit(name: string): void {
    const newPerson: Person = { id: 0, name }; // id will be set by the server
    this.personsService.newPerson(newPerson).subscribe(person => {
      console.log('New person added:', person);
      this.personsService.notifyReload(); // notify other components to reload the list
      this.name = ''; // Clear the input field
    });
  }
}
