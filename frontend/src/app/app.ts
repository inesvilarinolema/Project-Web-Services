import { Component } from '@angular/core';
import { MainPage } from './pages/main'

@Component({
  selector: 'app-root',
  imports: [MainPage],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true
})
export class App {
  // nothing for now
}
