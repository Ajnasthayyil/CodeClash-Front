import { Component, OnInit } from '@angular/core';
import { AdminDashboardService } from '../../../core/services/admin-dashboard.service';

interface SystemLog {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  service: string;
  message: string;
}

@Component({
  selector: 'app-dashboard-analytics',
  templateUrl: './dashboard-analytics.component.html',
  styleUrls: ['./dashboard-analytics.component.scss']
})
export class DashboardAnalyticsComponent implements OnInit {
  stats = [
    { label: 'Total Users', value: '...', change: '+0.0%', detail: 'from last week', icon: 'users', up: true },
    { label: 'Active Matches', value: '...', change: '+0.0%', detail: 'simultaneous duels', icon: 'lightning', up: true },
    { label: 'Submission Rate', value: '...', change: '0.0%', detail: 'pass/fail accuracy', icon: 'code', up: false },
    { label: 'System Load', value: '...', change: 'Normal', detail: 'sandbox average CPU', icon: 'server', up: true }
  ];

  systemLogs: SystemLog[] = [
    { timestamp: '16:05:22', level: 'INFO', service: 'AUTH', message: 'User NovaCoder logged in successfully.' },
    { timestamp: '16:04:10', level: 'INFO', service: 'ARENA', message: 'Matchmaking session created: CODE-CLASH-542.' },
    { timestamp: '16:02:45', level: 'INFO', service: 'SANDBOX', message: 'Test execution server spun up: Sandbox Node #3.' },
    { timestamp: '15:58:12', level: 'WARNING', service: 'SANDBOX', message: 'Memory spike detected on Sandbox Node #1 (88%).' },
    { timestamp: '15:55:01', level: 'INFO', service: 'ROUTER', message: 'New rated queue registered. Active pools: 12.' },
    { timestamp: '15:50:33', level: 'ERROR', service: 'DATABASE', message: 'Timeout reconnecting to Postgres master. Retrying...' }
  ];

  constructor(private dashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (res) => {
        if (res) {
          const data = res;
          
          this.stats = [
            { 
              label: 'Total Users', 
              value: data.totalUsers.toLocaleString(), 
              change: '+12.4%', // Placeholder for now
              detail: 'from last week', 
              icon: 'users', 
              up: true 
            },
            { 
              label: 'Active Matches', 
              value: data.activeMatches.toLocaleString(), 
              change: '+8.1%', 
              detail: 'simultaneous duels', 
              icon: 'lightning', 
              up: true 
            },
            { 
              label: 'Submission Rate', 
              value: `${data.submissionRate.toFixed(1)}%`, 
              change: '-0.3%', 
              detail: 'pass/fail accuracy', 
              icon: 'code', 
              up: false 
            },
            { 
              label: 'System Load', 
              value: `${data.systemLoad}%`, 
              change: 'Normal', 
              detail: 'sandbox average CPU', 
              icon: 'server', 
              up: true 
            }
          ];
        }
      },
      error: (err) => console.error('Failed to load dashboard stats', err)
    });
  }
}
