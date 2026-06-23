import { Component, OnInit } from '@angular/core';

interface Candidate {
  name: string;
  role: string;
  score: number;
  status: 'Hired' | 'Evaluating' | 'Rejected';
  completedAt: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  candidates: Candidate[] = [
    { name: 'Sarah Connor', role: 'Senior Go Engineer', score: 98, status: 'Hired', completedAt: '2 hours ago' },
    { name: 'Marcus Aurelius', role: 'Full Stack Developer', score: 85, status: 'Evaluating', completedAt: '5 hours ago' },
    { name: 'John Doe', role: 'Frontend Architect', score: 91, status: 'Hired', completedAt: '1 day ago' },
    { name: 'Ada Lovelace', role: 'Rust Specialist', score: 100, status: 'Hired', completedAt: '2 days ago' },
    { name: 'Bruce Wayne', role: 'DevOps Specialist', score: 45, status: 'Rejected', completedAt: '3 days ago' }
  ];

  activeChallenges = 12;
  avgCompletionRate = '92.4%';
  totalAssessments = 342;
  newMatches = 5;

  ngOnInit() {
    // Simulated live updates
    setInterval(() => {
      this.totalAssessments += Math.floor(Math.random() * 2);
    }, 10000);
  }
}
