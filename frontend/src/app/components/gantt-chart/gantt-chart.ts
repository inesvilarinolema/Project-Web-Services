
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Task } from '../../models/task';
import { Team } from '../../models/team';

interface GanttBar {
  name: string;
  style: {
    left: string;
    width: string;
    backgroundColor: string;
  };
  tooltip: string;
}

@Component({
  selector: 'gantt-chart',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './gantt-chart.html',
  styleUrls: ['./gantt-chart.css']
})

export class GanttChartComponent implements OnChanges {
  @Input() tasks: Task[] = [];
  @Input() teams: Team[] = []; 

  bars: GanttBar[] = [];
  
  minDateDisplay: Date | null = null;
  maxDateDisplay: Date = new Date();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tasks'] || changes['teams']) {
      this.calculateGantt();
    }
  }

  calculateGantt() {
    if (!this.tasks || this.tasks.length === 0) return;

    const endTimestamp = new Date().getTime();
    
    const startTimestamps = this.tasks.map(t => new Date(t.start_date).getTime());
    const startTimestamp = Math.min(...startTimestamps);
    
    const totalDuration = endTimestamp - startTimestamp;
    
    if (totalDuration <= 0) return;

    this.minDateDisplay = new Date(startTimestamp);
    this.maxDateDisplay = new Date(endTimestamp);

    const teamColors = new Map<number, string>();
    this.teams.forEach(t => {
      teamColors.set(t.id, t.color || '#ccc'); 
    });

    // 3. Generar las barras
    this.bars = this.tasks.map(task => {
      const tStart = new Date(task.start_date).getTime();
      let tEnd = task.end_date ? new Date(task.end_date).getTime() : endTimestamp;

      if (tEnd > endTimestamp) tEnd = endTimestamp;
      if (tStart < startTimestamp) { 
      }

      const offset = tStart - startTimestamp; 
      const duration = tEnd - tStart;        
      const leftPercent = (offset / totalDuration) * 100;
      const widthPercent = (duration / totalDuration) * 100;
      const color = teamColors.get(task.team_id) || '#888';

      return {
        name: task.name,
        style: {
          left: `${leftPercent}%`,
          width: `${widthPercent}%`, 
          backgroundColor: color
        },
        tooltip: `${task.name} (${new Date(tStart).toLocaleDateString()} - ${task.end_date ? new Date(task.end_date).toLocaleDateString() : 'Present'})`
      };
    });
  }
}