import { Component, ViewChild, HostListener, OnInit, OnDestroy } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import 'chart.js/auto';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth';
import { TeamsService } from '../../services/teams';
import { User } from '../../models/user';

@Component({
  selector: 'home-page',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  standalone: true
})
export class HomePage implements OnInit, OnDestroy {

  user: User | null = null;
  private subs: Subscription = new Subscription(); // Para gestionar varias suscripciones

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  @HostListener('window:resize')
  onResize() {
    this.chart?.chart?.resize();
  }
  
  chartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Number of members',
        data: [],
        backgroundColor: [],
      }
    ]
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      y: {
        title: { display: true, text: 'Number of members' },
        beginAtZero: true,
        ticks: { precision: 0 }
      }
    },
    plugins: {
      title: { display: true, text: 'Teams chart', font: { size: 24 }, },
      legend: { display: false }
    }
  };

  constructor(
    private authService: AuthService, 
    private teamsService: TeamsService
  ) {}

  ngOnInit(): void {
    // 1. Obtener usuario y cargar datos INICIALES
    const authSub = this.authService.currentUser$.subscribe(user => { 
      this.user = user;
      this.loadChartData(); 
    });
    this.subs.add(authSub);

    // 2. Suscribirse a CAMBIOS por WebSocket (vía TeamsService)
    // Cuando alguien cambie miembros en otro lado, esto se dispara.
    const wsSub = this.teamsService.reloadMemberShips$.subscribe(() => {
        console.log('Gráfico: Detectado cambio en miembros. Actualizando...');
        this.loadChartData(); 
    });
    this.subs.add(wsSub);
  }

  loadChartData() {
    if (this.isInRole([0,1])) {
        this.teamsService.getTeams("", 3).subscribe(teams => {
            this.chartData.labels = teams.map(team => (team.name));
            this.chartData.datasets[0].data = teams.map(team => (team.member_count ?? 0));
            this.chartData.datasets[0].backgroundColor = teams.map(team => (team.color ?? '#ccc'));
            
            this.chart?.update(); 
        });
    }
  }

  isInRole(roles: number[]) {
    return this.authService.isInRole(this.user, roles);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe(); 
  }
}