import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { Person } from '../models/person'

@Component({
  selector: 'person-form',
  templateUrl: './person-form.html',
  styleUrls: ['./person-form.scss'],
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatInputModule, MatButtonModule],
  standalone: true
})
export class PersonFormComponent {
  @Input() row!: Person;
  @Output() validChange = new EventEmitter<boolean>();
  
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required]
    });

    this.form.statusChanges.subscribe(() => {
      this.validChange.emit(this.form.valid);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['row'] && this.row) {
      this.form.patchValue(this.row);
      this.validChange.emit(this.form.valid);
    }
  }

  ngAfterViewInit() {
    this.form.markAllAsTouched();
  }
}
