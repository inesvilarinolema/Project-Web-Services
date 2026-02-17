import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet'; 

@Component({
	selector: 'app-map-page',
	standalone: true, 
	imports: [CommonModule],
	templateUrl: './map.html',
	styleUrls: ['./map.scss']
})
export class MapPageComponent implements OnInit {

	private map: any;
	teams: any[] = []; //store teams
	matrix: number[][] = []; //distances matrix

	constructor(private http: HttpClient) {}

	ngOnInit(): void {
		this.loadMapData();
	}

	loadMapData() {
		//Set GET request to backend to fetch teams and distance calculations
		this.http.get<any>('/api/map').subscribe({
			next: (res) => {
				//store the raw team data (coordinates, names)
				this.teams = res.teams;
				//store precalculates distance matrix sent from the server
				this.matrix = res.matrix;
				
				setTimeout(() => {
					this.initMap();
				}, 100);
			},
			error: (err) => console.error('Error cargando datos del mapa', err)
		});
	}

	private initMap(): void {
		if (this.teams.length === 0) return;

		const DefaultIcon = L.icon({
			iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
			shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34]
		});
		L.Marker.prototype.options.icon = DefaultIcon;

		const startLat = this.teams[0].latitude;
		const startLon = this.teams[0].longitude;

		if (startLat === undefined || startLon === undefined) {
			return;
		}

		//Create the map
		this.map = L.map('map').setView([startLat, startLon], 14);

		//The map is rendered using a tiling system, instead of loading a massive image, divide into pixed squares
		//z is zoom, x & y are coordinate grid of the specific tile
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '© OpenStreetMap'
		}).addTo(this.map);


		const bounds = L.latLngBounds([]); 
		
		//Iterates through all the teams
		this.teams.forEach(team => {
			if (team.latitude == null || team.longitude == null) return;

			//Places a marker in their specific coordinates
			const marker = L.marker([team.latitude, team.longitude]).addTo(this.map);

			//Adds a popuu message displaying the team's name
			marker.bindPopup(`<b>${team.name}</b><br>${team.longname || ''}`);
			bounds.extend([team.latitude, team.longitude]);
		});

		//Calculates a imaginary box that encompasses all the teams and automatically adjusts the map's zoom
		this.map.fitBounds(bounds, { padding: [50, 50] });
	}

	//Format distance for the matrix
	formatDistance(meters: number): string {
		if (meters === 0) return '0.0 km';
		if (meters < 1000) return Math.round(meters) + ' m';
		return (meters / 1000).toFixed(2) + ' km';
	}
}