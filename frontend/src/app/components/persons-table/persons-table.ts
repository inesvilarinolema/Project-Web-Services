import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, ViewChild, OnDestroy, Output, EventEmitter, OnInit} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { Person } from '../../models/person';
import { PersonsService } from '../../services/persons';
import { EditPersonDialog } from '../../dialogs/edit-person/edit-person';
import { ColorsService } from '../../services/colors';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth';
import { LockService } from '../../services/lock';

@Component({
	selector: 'persons-table',
	templateUrl: './persons-table.html',
	styleUrls: ['./persons-table.scss'],
	imports: [CommonModule, MatTableModule, MatSortModule, MatChipsModule, MatProgressSpinnerModule],
	standalone: true
})

export class PersonsTableComponent implements AfterViewInit, OnDestroy, OnInit{
	
	displayedColumns: string[] = ['id', 'firstname', 'lastname', 'birthdate', 'email', 'teams'];
	persons: Person[] = [];

	private observer?: IntersectionObserver;

	//Filtering logic
	private _filter: string = '';
	@Input()
	set filter(value: string) {
		//Reset and reaload table if the filter string changes
		if (value !== this._filter) {
			this._filter = value;
			this.resetAndLoad();
		}
	}

	//emits table stats
	@Output() countsChange = new EventEmitter<{ total: number, filtered: number, order: number }>();
	
	@ViewChild('tableContainer') tableContainer!: ElementRef<HTMLDivElement>;

	getContrastColor: (color: string) => string;
	user: User | null = null;

	//Pagination & state
	loading: boolean = false;
	allLoaded: boolean = false;
	offset: number = 0;
	limit: number = 10;
	order: number = 1;
	timestamp = Date.now();

	@ViewChild('loadMore') loadMore!: ElementRef;

	constructor(
		private authService: AuthService,
		private colorsService: ColorsService,
		private personsService: PersonsService,
		private dialog: MatDialog,
		private lockService: LockService 
	) {
		this.authService.currentUser$.subscribe(user => { this.user = user; });
		this.getContrastColor = this.colorsService.getContrastColor;
	}

	ngOnInit(): void {
		this.loadData();
		//Refresh table if a lock is release/acquired elsewhere
		this.lockService.lockUpdate$.subscribe(() => {this.resetAndLoad();});
	}
	ngAfterViewInit() {
		this.initObserver();
		window.addEventListener('focus', this.onWindowFocus);
	}

	ngOnDestroy() {
		this.observer?.disconnect();
		window.removeEventListener('focus', this.onWindowFocus);
	}

	private onWindowFocus = () => {
		if (!this.loading) {
			 this.resetAndLoad(); 
		}
	}

	//Opens the edit dialog
	openDialog(row: Person | null) {
		//Security check
		if (!this.isInRole([0])) return;

		if (!row) {
				this.launchDialog(null);
				return;
		}

		//Prepare data
		row.team_ids = row.team_objects?.map(team => team.id);

		//Try to acquire lock
		this.lockService.lock('person', row.id).subscribe({
				next: () => {
						this.launchDialog(row); //lock succesful -> open dialog
				},
				error: (err: any) => {
						//lock failed (conflict)
						if (err.lockedBy) {
							alert(`Cannot edit. Record is currently locked by: ${err.lockedBy}`);
						} 
						else {
							console.error('Lock error:', err);
						}
				}
		});
	}

	//Helper to actually open the material dialog
	private launchDialog(row: Person | null) {
		const scrollTop = this.tableContainer?.nativeElement.scrollTop || 0;
		
		const dialogRef = this.dialog.open(EditPersonDialog, {width: '75%',minWidth: '800px',data: { row }});

		dialogRef.afterClosed().subscribe(result => {
			//always unlock when dialog closes
			if (row) {
					this.lockService.unlock('person', row.id).subscribe();
			}

			if(result) {
				//if data changed, refresh table
				this.timestamp = Date.now();
				this.resetAndLoad();

				//restore scroll position
				setTimeout(() => {
						 if (this.tableContainer && this.tableContainer.nativeElement) {
								 this.tableContainer.nativeElement.scrollTop = scrollTop;
						 }
				}, 100); 
			}
		});
	}

	isInRole(roles: number[]) {
		return this.authService.isInRole(this.user, roles);
	}

	private resetAndLoad() {
		this.persons = [];
		this.offset = 0;
		this.allLoaded = false;
		this.loadData();
	}

	//Detect when the user scrolls to the bottom
	private initObserver() {
		if (!this.loadMore) return;
		this.observer?.disconnect();
		this.observer = new IntersectionObserver(entries => {
			if (entries[0].isIntersecting) {
				this.loadData();
			}
		});
		this.observer.observe(this.loadMore.nativeElement);
	}

	loadData() {
		if (this.loading || this.allLoaded) return;

		this.loading = true;

		this.personsService.getPersons(this._filter, this.limit, this.offset, this.order)
			.subscribe(response => {

				//Update parent with new total counts
				this.countsChange.emit({ total: response.total, filtered: response.filtered, order: this.order }); // send changed counters to parent
				const persons = response.persons;

				//If backend returns fewer items, we reached the end
				if (persons.length < this.limit) {
					this.allLoaded = true;
				}

				//Append new data 
				this.persons = [...this.persons, ...persons];
				this.offset += this.limit;
				this.loading = false;

				this.checkFillViewport();
			});
	}

	private checkFillViewport() {
		requestAnimationFrame(() => {
			if (!this.loadMore || this.allLoaded) return;
			const rect = this.loadMore.nativeElement.getBoundingClientRect();
			if (rect.top < window.innerHeight) {
				//sentinel still visible - read more records
				this.loadData();
			}
		});
	}
	
	//Handles column sorting events
	onSortChange(sort: Sort) {
		const columnNo = parseInt(sort.active);
		if(columnNo) {
			switch(sort.direction) {
				case 'asc':
					this.order = columnNo;
					this.resetAndLoad();
					break;
				case 'desc':
					this.order = -columnNo;
					this.resetAndLoad();
					break;
			}
		}
	}
}

