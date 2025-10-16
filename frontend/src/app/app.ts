import { Component } from '@angular/core';
import { PersonsTableComponent } from './components/persons-table';
import { PersonFormComponent } from './components/person-form';

@Component({
  selector: 'app-root',
  imports: [PersonsTableComponent, PersonFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true
})
export class App {
  protected title = 'PWS 2025';
}
