import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, NgZone, OnChanges, SimpleChanges, Input, Output, EventEmitter, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { GeoPoint } from '../../models/geopoint';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

@Component({
	selector: 'location',
	templateUrl: './location.html',
	styleUrls: ['./location.scss'],
	imports: [],
	standalone: true
})


export class LocationComponent implements AfterViewInit, OnDestroy, OnChanges{
	constructor(private zone: NgZone) {}

	//Reference the div where the map will be rendered
	@ViewChild('mapContainer', { static: true })
	mapContainer!: ElementRef<HTMLDivElement>;

	//Current coordinates
	@Input() location?: GeoPoint;

	//Emits when the user changes de the location
	@Output() locationChange = new EventEmitter<GeoPoint>();
	
	private map!: L.Map;
	private marker?: L.Marker;
	private resizeObserver!: ResizeObserver;
	private resizeScheduled = false;

	//Updates the marker position if the parent component changes
	ngOnChanges(changes: SimpleChanges) {
		if (changes['location'] && this.location && this.map) {
			this.updateMarkerVisuals(this.location);
		}
	}
	
	//Initializes the leaflet map
	private initMap() {

		delete (L.Icon.Default.prototype as any)._getIconUrl;
		L.Icon.Default.mergeOptions({
			iconRetinaUrl: markerIcon2x,
			iconUrl: markerIcon,
			shadowUrl: markerShadow,
		});

		//Create map instance centerd on a default location
		this.map = L.map(this.mapContainer.nativeElement).setView(
			[51.759248, 19.455983],
			12
		);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap contributors'
		}).addTo(this.map);

		//Event -> move marker to clicked location
		this.map.on('click', (e: L.LeafletMouseEvent) => {
			const newPos = { latitude: e.latlng.lat, longitude: e.latlng.lng };
			this.updateMarkerVisuals(newPos);
			this.locationChange.emit(newPos); //Notify parent
		});

		//Set initial marker if location exists
		if (this.location) {
			this.setMarker(this.location);
			this.updateMarkerVisuals(this.location);
			this.map.setView([this.location.latitude, this.location.longitude], 12);
		}

		//Force redraw
		setTimeout(() => this.map.invalidateSize(), 0);
	}

	//Setup logic, handles creation, position updates
	private setMarker(location: GeoPoint) {
		this.updateMarkerVisuals(location);
		this.locationChange.emit(location);
	}

	
	//Prevent the map from looking gray or incomplete when the map's size change
	private initResizeObserver(): void {
		this.resizeObserver = new ResizeObserver(() => {
			if (this.resizeScheduled || !this.map) {
				return;
			}

			this.resizeScheduled = true;

			this.zone.runOutsideAngular(() => {
				requestAnimationFrame(() => {
					this.map.invalidateSize();
					this.resizeScheduled = false;
				});
			});
		});

		this.resizeObserver.observe(this.mapContainer.nativeElement);
	}

	ngAfterViewInit() {
		this.initMap();
		this.initResizeObserver();  
	}

	ngOnDestroy() {
		this.resizeObserver?.disconnect();
		this.map?.remove();
	}

	//Helper to update o create the marker without reemitting the event inmmediately
	private updateMarkerVisuals(location: GeoPoint) {
		//Marker already exist -> just move it
		if (this.marker) {
			this.marker.setLatLng([location.latitude, location.longitude]);
			return;
		}

		//Marker doesn't exist -> Create it
		this.marker = L.marker([location.latitude, location.longitude], { draggable: true })
		.addTo(this.map);

		//Attach drag event listener strictly once upon creation
		this.marker.on('dragend', () => {
			const pos = this.marker!.getLatLng();
			this.locationChange.emit({ latitude: pos.lat, longitude: pos.lng });
		});
	}
	
}
