import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { Team } from '../../models/team';
import { Person } from '../../models/person'; // Importa tu interfaz Person
import { TeamsService } from '../../services/teams';

@Component({
  selector: 'task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './task-form.html',
  styleUrls: ['./task-form.scss']
})
export class TaskFormComponent implements OnInit, OnChanges {
  
  @Input() task: any;
  @Output() validChange = new EventEmitter<boolean>();

  form: FormGroup;
  teams: Team[] = [];
  people: Person[] = []; 

  today = new Date();

  constructor(private teamsService: TeamsService) {
    this.form = new FormGroup({
      name: new FormControl('', Validators.required),
      team_id: new FormControl(null, Validators.required),
      person_id: new FormControl(null),
      start_date: new FormControl(null, Validators.required),
      end_date: new FormControl(null)
    }, { validators: dateRangeValidator });;

    this.form.statusChanges.subscribe(status => {
      const isValid = status === 'VALID';

      if (!isValid) {
      console.warn('❌ BLOQUEADO. El formulario tiene estos errores:');
      
      // 1. Errores globales (Fechas cruzadas, etc)
      if (this.form.errors) console.log('   -> Error Global:', this.form.errors);

      // 2. Errores campo a campo
      Object.keys(this.form.controls).forEach(key => {
          const control = this.form.get(key);
          if (control && control.errors) {
              console.log(`   -> Campo [${key}]:`, control.errors);
              console.log(`      Valor actual:`, control.value);
          }
      });
  }
    this.validChange.emit(isValid);
    });

    this.form.get('team_id')!.valueChanges.subscribe(teamId => {
      if (teamId) {
        this.loadPeople(teamId);
      } else {
        this.people = []; 
        this.form.get('person_id')!.setValue(null);
      }
    });

    this.form.statusChanges.subscribe(() => this.validChange.emit(this.form.valid));
  }

  ngOnInit() {
    this.teamsService.getTeams().subscribe(t => this.teams = t);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['task'] && this.task) {
      
      const safeTeamId = this.task.team_id ? Number(this.task.team_id) : null;
      const safePersonId = this.task.person_id ? Number(this.task.person_id) : null;

      const formValues = {
          name: this.task.name,
          team_id: safeTeamId,
          person_id: safePersonId,
          start_date: this.task.start_date ? new Date(this.task.start_date) : null,
          end_date: this.task.end_date ? new Date(this.task.end_date) : null
      };

      this.form.patchValue(formValues, { emitEvent: false });

      if (safeTeamId) {
        this.loadPeople(safeTeamId);
      }
      
      setTimeout(() => {
          this.form.updateValueAndValidity(); // Esto dispara statusChanges automáticamente
          
          this.validChange.emit(this.form.valid);
      }, 100);
    }
  }

  loadPeople(teamId: number) {
    this.teamsService.getMembers(teamId).subscribe(members => {
      this.people = members;
      
      const currentPersonId = this.form.get('person_id')!.value;
      if (currentPersonId) {
         const exists = this.people.some(p => p.id === currentPersonId);
         if (!exists) {
           this.form.get('person_id')!.setValue(null);
         }
      }
    });
  }

}

export const dateRangeValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const startCtrl = group.get('start_date');
  const endCtrl = group.get('end_date');
  if (!startCtrl?.value || !endCtrl?.value) {
    return null;
  }
  const start = new Date(startCtrl.value);
  const end = new Date(endCtrl.value);

  if (end < start) {
    endCtrl.setErrors({ ...endCtrl.errors, endBeforeStart: true });
    return { endBeforeStart: true };
  } 
    if (endCtrl.hasError('endBeforeStart')) {
    const { endBeforeStart, ...otherErrors } = endCtrl.errors || {};
    endCtrl.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
  }

  return null;
};

