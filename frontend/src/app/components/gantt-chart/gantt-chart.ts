
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Task } from '../../models/task';
import { Team } from '../../models/team';

//Interface defining the visual representation fo a bar in the chart
interface GanttBar {
	name: string;
	style: {
		left: string; //CSS position %
		width: string; //CSS width %
		backgroundColor: string; //Team color
	};
	tooltip: string; //Text shown
}

@Component({
	selector: 'gantt-chart',
	standalone: true,
	imports: [CommonModule, MatTooltipModule],
	templateUrl: './gantt-chart.html',
	styleUrls: ['./gantt-chart.css']
})

export class GanttChartComponent implements OnChanges {
	//Input properties
	@Input() tasks: Task[] = [];
	@Input() teams: Team[] = []; 

	bars: GanttBar[] = [];
	
	//Date range for the chart labels
	minDateDisplay: Date | null = null;
	maxDateDisplay: Date = new Date();

	//Ensures the chart redraws automatically when inputs change
	ngOnChanges(changes: SimpleChanges) {
		if (changes['tasks'] || changes['teams']) {
			this.calculateGantt();
		}
	}

	//Converts tasks dates into css percentages
	calculateGantt() {
		if (!this.tasks || this.tasks.length === 0) return;

		//End of chart is always now
		const endTimestamp = new Date().getTime();
		
		//Start of chart is the start date of the earliest task
		const startTimestamps = this.tasks.map(t => new Date(t.start_date).getTime());
		const startTimestamp = Math.min(...startTimestamps);
		
		const totalDuration = endTimestamp - startTimestamp;
		
		if (totalDuration <= 0) return;

		//Set display dates for the axis labels
		this.minDateDisplay = new Date(startTimestamp);
		this.maxDateDisplay = new Date(endTimestamp);

		//Map team colors
		const teamColors = new Map<number, string>();
		this.teams.forEach(t => {
			teamColors.set(t.id, t.color || '#ccc'); 
		});

		//Generate visual bars
		this.bars = this.tasks.map(task => {

			const tStart = new Date(task.start_date).getTime();

			//If the task has no end date -> its ongoing until now
			let tEnd = task.end_date ? new Date(task.end_date).getTime() : endTimestamp;

			if (tEnd > endTimestamp) tEnd = endTimestamp;

			//Calculate relative position
			const offset = tStart - startTimestamp; 
			const duration = tEnd - tStart;    
			
			//Convert percentages for CSS
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