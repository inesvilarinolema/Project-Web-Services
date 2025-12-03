import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';

import { Person } from '../../models/person'
import { Team } from '../../models/team';
import { TeamsService } from '../../services/teams';
import { ColorsService } from '../../services/colors';

@Component({
  selector: 'person-form',
  templateUrl: './person-form.html',
  styleUrls: ['./person-form.scss'],
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatInputModule, MatButtonModule, MatDatepickerModule, MatSelectModule],
  standalone: true
})
export class PersonFormComponent {
  @Input() row!: Person;
  @Output() validChange = new EventEmitter<boolean>();
  
  getContrastColor: (color: string) => string;
  form: FormGroup;
  teams: Team[] = [];
  teamsMap: Record<number, Team> = {};

  constructor(private fb: FormBuilder, private teamsService: TeamsService, private colorsService: ColorsService) {
    this.form = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      birthdate: [null, Validators.required],
      email: [null, Validators.required],
      team_ids: [[], null]
    });

    this.form.statusChanges.subscribe(() => {
      this.validChange.emit(this.form.valid);
    });

    this.getContrastColor = this.colorsService.getContrastColor;
  }

  ngOnInit() {
    this.teamsService.getTeams().subscribe(teams => {
      this.teams = teams;
      this.teamsMap = Object.fromEntries(this.teams.map(t => [t.id, t]));
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['row'] && this.row) {
      this.form.patchValue(this.row);
      this.form.patchValue({
        birthdate: new Date(this.row.birthdate)
      });
      this.validChange.emit(this.form.valid);
    }
  }

  ngAfterViewInit() {
    this.form.markAllAsTouched();
  }
}
