import { Component, OnInit } from '@angular/core';

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
    { label: 'Total Users', value: '1,248', change: '+12.4%', detail: 'from last week', icon: 'users', up: true },
    { label: 'Active Matches', value: '42', change: '+8.1%', detail: 'simultaneous duels', icon: 'lightning', up: true },
    { label: 'Submission Rate', value: '88.5%', change: '-0.3%', detail: 'pass/fail accuracy', icon: 'code', up: false },
    { label: 'System Load', value: '38%', change: 'Normal', detail: 'sandbox average CPU', icon: 'server', up: true }
  ];

  systemLogs: SystemLog[] = [
    { timestamp: '16:05:22', level: 'INFO', service: 'AUTH', message: 'User NovaCoder logged in successfully.' },
    { timestamp: '16:04:10', level: 'INFO', service: 'ARENA', message: 'Matchmaking session created: CODE-CLASH-542.' },
    { timestamp: '16:02:45', level: 'INFO', service: 'SANDBOX', message: 'Test execution server spun up: Sandbox Node #3.' },
    { timestamp: '15:58:12', level: 'WARNING', service: 'SANDBOX', message: 'Memory spike detected on Sandbox Node #1 (88%).' },
    { timestamp: '15:55:01', level: 'INFO', service: 'ROUTER', message: 'New rated queue registered. Active pools: 12.' },
    { timestamp: '15:50:33', level: 'ERROR', service: 'DATABASE', message: 'Timeout reconnecting to Postgres master. Retrying...' }
  ];

  ngOnInit(): void {}
}
