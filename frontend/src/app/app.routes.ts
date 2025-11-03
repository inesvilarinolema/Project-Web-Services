import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { PersonsPage } from './pages/persons/persons';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'persons', component: PersonsPage },
];
