import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, ViewChild, NgZone, OnInit, OnDestroy } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { Person } from '../../models/person';
import { PersonsService } from '../../services/persons';
import { EditPersonDialog } from '../../dialogs/edit-person/edit-person';
import { ColorsService } from '../../services/colors';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'persons-table',
  templateUrl: './persons-table.html',
  styleUrls: ['./persons-table.scss'],
  imports: [CommonModule, MatTableModule, MatChipsModule, MatProgressSpinnerModule],
  standalone: true
})
export class PersonsTableComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['id', 'firstname', 'lastname', 'birthdate', 'teams'];
  persons: Person[] = [];
  private sub?: Subscription;
  private observer?: IntersectionObserver;

  private _filter: string = '';
  @Input()
  set filter(value: string) {
    if (value !== this._filter) {
      this._filter = value;
      this.resetAndLoad();
    }
  }
  get filter(): string {
    return this._filter;
  }

  getContrastColor: (color: string) => string;
  user: User | null = null;
  loading: boolean = false;
  allLoaded: boolean = false;
  offset: number = 0;
  limit: number = 20;

  @ViewChild('loadMore', { static: false }) loadMore!: ElementRef;

  constructor(
    private authService: AuthService,
    private colorsService: ColorsService,
    private personsService: PersonsService,
    private dialog: MatDialog,
    private ngZone: NgZone
  ) {
    this.authService.currentUser$.subscribe(user => { this.user = user; });
    this.getContrastColor = this.colorsService.getContrastColor;
  }

  ngOnInit() {
    this.sub = this.personsService.reload$.subscribe(() => {
      this.resetAndLoad();
    });
  }

  ngAfterViewInit() {
    this.initObserver();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.observer?.disconnect();
  }

  openDialog(row: Person | null) {
    if (!this.isInRole([0])) return;
    row!.team_ids = row?.team_objects?.map(team => team.id);

    // remeber scroll position
    const tableContainer = document.querySelector('.persons-table-container') as HTMLElement;
    const scrollTop = tableContainer?.scrollTop || 0;

    const dialogRef = this.dialog.open(EditPersonDialog, {
      width: '75%',
      data: { row }
    });

    dialogRef.afterClosed().subscribe(() => {
    // restore scroll position
      setTimeout(() => {
        if (tableContainer) tableContainer.scrollTop = scrollTop;
      }, 0);
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

    setTimeout(() => this.initObserver(), 0);
  }

  private initObserver() {
    if (!this.loadMore) return;

    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        this.ngZone.run(() => this.loadData());
      }
    });

    this.observer.observe(this.loadMore.nativeElement);
  }

  loadData() {
    if (this.loading || this.allLoaded) return;

    this.loading = true;

    this.personsService.getPersons(this._filter, this.limit, this.offset)
      .subscribe(res => {
        if (res.length < this.limit) {
          this.allLoaded = true;
        }

        this.persons = [...this.persons, ...res];
        this.offset += this.limit;
        this.loading = false;
      });
  }
}
