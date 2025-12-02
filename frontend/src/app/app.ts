import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { APP_VERSION } from '../../../src/shared/version';
import { routes } from './app.routes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  title: string = APP_VERSION;
  routes = routes;
}
