import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';

import { Team } from '../../models/team';
import { COLORS } from '../../../../../src/shared/colors';
import { LocationComponent } from "../location/location";
import { GeoPoint } from '../../models/geopoint';

@Component({
	selector: 'team-form',
	templateUrl: './team-form.html',
	styleUrls: ['./team-form.scss'],
	imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatInputModule, MatButtonModule, MatSelectModule, MatOptionModule, MatIcon, LocationComponent],
	standalone: true
})


export class TeamFormComponent {
	@Input() row!: Team | null;
	@Output() validChange = new EventEmitter<boolean>();
	
	form: FormGroup;
	colors: String[] = COLORS;

	selectedFile?: File;
	avatarPreview: string | null = null;

	timestamp = Date.now();

	constructor(private fb: FormBuilder) {
		this.form = this.fb.group({
			name: ['', Validators.required],
			longname: ['', Validators.required],
			color: ['', Validators.required],
			avatar: [''],
			location: this.fb.control<GeoPoint | null>(null) //stores coordinates object
		});

		//notify parent whenever form validity changes
		this.form.statusChanges.subscribe(() => {
			this.validChange.emit(this.form.valid);
		});
	}

	//Data normalization logic
 	ngOnChanges(changes: SimpleChanges) {
		if (changes['row'] && this.row) {
			
			let finalLocation = null;

			//Data already has a location object
			if (this.row.location) {
				finalLocation = this.row.location;
			} 
			//Data has separate lat/lon fields
			else if (this.row.latitude != null && this.row.longitude != null) {
				finalLocation = { latitude: this.row.latitude, longitude: this.row.longitude };
			}

			//Populate form
			this.form.patchValue({
				...this.row,
				location: finalLocation
			});

			this.validChange.emit(this.form.valid);
		}
	}


	ngAfterViewInit() {
		this.form.markAllAsTouched();
	}

	//Generates a local preview without uploading (avatar)
	onFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return;

		const file = input.files[0];
		this.selectedFile = file;

		const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
		this.form.patchValue({ avatar: safeName });

		const reader = new FileReader();
		reader.onload = () => {
			this.avatarPreview = reader.result as string;
		};
		reader.readAsDataURL(file);
	}

	//Clears the file selected in the current version
	clearSelectedAvatar() {
		this.selectedFile = undefined;
		this.avatarPreview = null;
		this.form.patchValue({ avatar: '' });
	}

	//Marks the existing db avatar for deletion
	clearExistingAvatar() {
		if(this.row) {
			this.row.has_avatar = false;
		}
	}

	onLocationChange(newLocation: GeoPoint) {
		//console.log('Mapa movido. Nuevas coordenadas:', newLocation);
		
		this.form.patchValue({ location: newLocation });
		this.form.markAsDirty();
	}

	//Uses browser's geolocation to find the user
	//Updates the map and form with the current coordinates
	locateMe() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition((position) => {
				const coords = { 
					latitude: position.coords.latitude, 
					longitude: position.coords.longitude 
				};

				//Update the form
				this.onLocationChange(coords);
			});
		} else {
			alert("Browser geolocation not supported");
		}
	}
}
