import { Component } from '@angular/core';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent {
  stats = [
    { value: '500,000+', label: 'Battles Fought', desc: 'Real-time peer match-ups in multiplayer coding arenas.' },
    { value: '99.99%', label: 'Sandbox Uptime', desc: 'Highly secure, isolated containerized execution runtimes.' },
    { value: '45+', label: 'Languages Supported', desc: 'Full compilation support for frontend, backend, and DB engines.' },
    { value: '120ms', label: 'Average Compilation Latency', desc: 'Instant feedback loop for candidate grading and scorecards.' }
  ];
}
