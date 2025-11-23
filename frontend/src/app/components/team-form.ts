import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

import { Team } from '../models/team';
import { TeamsService } from '../services/teams';

@Component({
  selector: 'team-form',
  templateUrl: './team-form.html',
  styleUrls: ['./team-form.scss'],
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatInputModule, MatButtonModule, MatSelectModule, MatOptionModule],
  standalone: true
})
export class TeamFormComponent {
  @Input() row!: Team;
  @Output() validChange = new EventEmitter<boolean>();
  
  form: FormGroup;
  teams: Team[] = [];
  colors: String[] = [
    "AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque",
    "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood",
    "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk",
    "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray",
    "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen",
    "DarkOrange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen",
    "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise",
    "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue",
    "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro",
    "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "Green", "GreenYellow",
    "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender",
    "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral",
    "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen",
    "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray",
    "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen",
    "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue",
    "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue",
    "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue",
    "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace",
    "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod",
    "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff",
    "Peru", "Pink", "Plum", "PowderBlue", "Purple", "RebeccaPurple", "Red",
    "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen",
    "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray",
    "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle",
    "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow",
    "YellowGreen"
  ];

  constructor(private fb: FormBuilder, private teamsService: TeamsService) {
    this.form = this.fb.group({
      shortname: ['', Validators.required],
      fullname: ['', Validators.required],
      color: ['', Validators.required]
    });

    this.form.statusChanges.subscribe(() => {
      this.validChange.emit(this.form.valid);
    });
  }

  ngOnInit() {
    this.teamsService.getTeams().subscribe(teams => {
      this.teams = teams;
    })
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
