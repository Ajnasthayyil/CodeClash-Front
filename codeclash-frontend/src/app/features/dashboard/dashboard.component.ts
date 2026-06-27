import { Component, OnInit, OnDestroy } from '@angular/core';

interface Candidate {
  name: string;
  role: string;
  score: number;
  status: 'Hired' | 'Evaluating' | 'Rejected';
  completedAt: string;
  language: string;
  avatar: string;
}

interface Lobby {
  id: string;
  title: string;
  players: number;
  maxPlayers: number;
  status: 'In Progress' | 'Open Lobby' | 'Completed';
  languages: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface SkillMetric {
  skill: string;
  percentage: number;
  color: string;
}

interface ActivityItem {
  icon: string;
  message: string;
  time: string;
  type: 'hire' | 'join' | 'complete' | 'challenge';
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private intervalId: any;

  activeTab: 'all' | 'hired' | 'evaluating' | 'rejected' = 'all';

  candidates: Candidate[] = [
    { name: 'Sarah Connor', role: 'Senior Go Engineer', score: 98, status: 'Hired', completedAt: '2 hours ago', language: 'Go', avatar: 'SC' },
    { name: 'Marcus Aurelius', role: 'Full Stack Developer', score: 85, status: 'Evaluating', completedAt: '5 hours ago', language: 'TypeScript', avatar: 'MA' },
    { name: 'John Doe', role: 'Frontend Architect', score: 91, status: 'Hired', completedAt: '1 day ago', language: 'JavaScript', avatar: 'JD' },
    { name: 'Ada Lovelace', role: 'Rust Specialist', score: 100, status: 'Hired', completedAt: '2 days ago', language: 'Rust', avatar: 'AL' },
    { name: 'Bruce Wayne', role: 'DevOps Specialist', score: 45, status: 'Rejected', completedAt: '3 days ago', language: 'Python', avatar: 'BW' },
    { name: 'Lena Fischer', role: 'Backend Engineer', score: 79, status: 'Evaluating', completedAt: '4 days ago', language: 'Java', avatar: 'LF' },
  ];

  lobbies: Lobby[] = [
    { id: 'CODE-CLASH-542', title: 'Algorithm Duel: Binary Search', players: 8, maxPlayers: 8, status: 'In Progress', languages: ['Python', 'C++'], difficulty: 'Hard' },
    { id: 'CODE-CLASH-981', title: 'Dynamic Programming Blitz', players: 3, maxPlayers: 12, status: 'Open Lobby', languages: ['JavaScript', 'Go'], difficulty: 'Medium' },
    { id: 'CODE-CLASH-112', title: 'Weekly Speed Coding Challenge', players: 14, maxPlayers: 50, status: 'Open Lobby', languages: ['All'], difficulty: 'Easy' },
  ];

  skillMetrics: SkillMetric[] = [
    { skill: 'Algorithms', percentage: 87, color: '#f97316' },
    { skill: 'Data Structures', percentage: 74, color: '#fb923c' },
    { skill: 'System Design', percentage: 61, color: '#fdba74' },
    { skill: 'Frontend Dev', percentage: 55, color: '#fed7aa' },
  ];

  activityFeed: ActivityItem[] = [
    { icon: '🏆', message: 'Ada Lovelace scored 100/100 on Rust Challenge', time: '2m ago', type: 'hire' },
    { icon: '⚔️', message: 'New lobby CODE-CLASH-990 opened', time: '8m ago', type: 'join' },
    { icon: '✅', message: 'Sarah Connor hired for Go Engineer role', time: '15m ago', type: 'hire' },
    { icon: '🎯', message: 'John Doe completed Frontend Architect test', time: '1h ago', type: 'complete' },
    { icon: '🚀', message: 'Weekly Speed Coding Challenge started', time: '2h ago', type: 'challenge' },
  ];

  activeChallenges = 12;
  avgCompletionRate = '92.4%';
  totalAssessments = 342;
  newMatches = 5;
  passRate = 78;
  weeklyGrowth = 23;

  get filteredCandidates(): Candidate[] {
    if (this.activeTab === 'all') return this.candidates;
    const map: Record<string, string> = { hired: 'Hired', evaluating: 'Evaluating', rejected: 'Rejected' };
    return this.candidates.filter(c => c.status === map[this.activeTab]);
  }

  getLobbyFill(lobby: Lobby): number {
    return Math.round((lobby.players / lobby.maxPlayers) * 100);
  }

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.totalAssessments += Math.floor(Math.random() * 2);
      if (Math.random() > 0.7) {
        this.activeChallenges += 1;
      }
    }, 10000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
