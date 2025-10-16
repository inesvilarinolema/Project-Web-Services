import { Component } from '@angular/core';
import { PersonsTableComponent } from './components/persons-table';

@Component({
  selector: 'app-root',
  imports: [PersonsTableComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true
})
export class App {
  protected title = 'PWS 2025';
}
