import { Route } from '@angular/router';
import { HomePage } from './pages/home/home';
import { PersonsPage } from './pages/persons/persons';

export interface AppRoute extends Route {
  icon?: string;
  roles?: number[];
}

export const routes: AppRoute[] = [
  { path: '', component: HomePage, title: 'Home', icon: 'home' },
  { path: 'persons', component: PersonsPage, title: 'Persons', icon: 'people', roles: [0,1] }
];
