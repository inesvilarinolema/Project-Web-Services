import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet'; // Importamos todo Leaflet como 'L'

@Component({
  selector: 'app-map-page',
  standalone: true, // Si usas standalone components
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrls: ['./map.scss']
})
export class MapPageComponent implements OnInit {

  private map: any;
  teams: any[] = [];
  matrix: number[][] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMapData();
  }

  loadMapData() {
    this.http.get<any>('/api/map').subscribe({
      next: (res) => {
        this.teams = res.teams;
        this.matrix = res.matrix;
        
        // Esperamos un pelín para asegurar que el HTML existe antes de pintar el mapa
        setTimeout(() => {
          this.initMap();
        }, 100);
      },
      error: (err) => console.error('Error cargando datos del mapa', err)
    });
  }

  private initMap(): void {
    if (this.teams.length === 0) return;

    // 1. Configuramos el icono por defecto (FIX para Angular)
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    // 2. Centramos el mapa en el primer equipo
    const startLat = this.teams[0].lat;
    const startLon = this.teams[0].lon;

    this.map = L.map('map').setView([startLat, startLon], 14);

    // 3. Añadimos la capa visual (los dibujos de las calles)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // 4. Ponemos las chinchetas 📍
    const bounds = L.latLngBounds([]); // Para auto-ajustar el zoom
    
    this.teams.forEach(team => {
      const marker = L.marker([team.lat, team.lon]).addTo(this.map);
      marker.bindPopup(`<b>${team.name}</b><br>${team.longname || ''}`);
      bounds.extend([team.lat, team.lon]);
    });

    // 5. Ajustar zoom para que quepan todos
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  // Helper para poner bonito los metros/km
  formatDistance(meters: number): string {
    if (meters === 0) return '-';
    if (meters < 1000) return Math.round(meters) + ' m';
    return (meters / 1000).toFixed(2) + ' km';
  }
}