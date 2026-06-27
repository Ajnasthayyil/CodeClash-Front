import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Competitor {
  name: string;
  initial: string;
  elo: number;
  isWinner: boolean;
  avatarBgColor?: string;
}

interface PerformanceMetric {
  label: string;
  youValue: string | number;
  opponentValue: string | number;
  isYouBetter: boolean;
}

@Component({
  selector: 'app-match-result',
  templateUrl: './match-result.component.html',
  styleUrls: ['./match-result.component.scss']
})
export class MatchResultComponent implements OnInit {
  // Contest metadata
  problemName = 'Two Sum';
  contestType = 'Rated Match';
  contestDate = 'June 20, 2026';

  // Competitor details
  you: Competitor = {
    name: 'NovaCoder',
    initial: 'N',
    elo: 1842,
    isWinner: true
  };

  opponent: Competitor = {
    name: 'ByteWizard',
    initial: 'B',
    elo: 1756,
    isWinner: false
  };

  // ELO Rating Change
  eloStart = 1842;
  eloEnd = 1860;
  eloDelta = 18;

  // Comparison metrics list
  metrics: PerformanceMetric[] = [
    { label: 'Lines of Code', youValue: 23, opponentValue: 31, isYouBetter: true },
    { label: 'Time Complexity', youValue: 'O(n)', opponentValue: 'O(n²)', isYouBetter: true },
    { label: 'Tests Passed', youValue: '10/10', opponentValue: '7/10', isYouBetter: true },
    { label: 'Submission Time', youValue: '8m 12s', opponentValue: '11m 45s', isYouBetter: true },
    { label: 'Code Quality', youValue: '94/100', opponentValue: '78/100', isYouBetter: true }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      this.you.name = parsed.name || this.you.name;
      this.you.elo = parsed.rating || this.you.elo;
      if (parsed.initials) {
        this.you.initial = parsed.initials.charAt(0);
      } else {
        this.you.initial = this.you.name.charAt(0).toUpperCase();
      }
      this.eloStart = this.you.elo;
      this.eloEnd = this.eloStart + this.eloDelta;
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  requestRematch(): void {
    this.router.navigate(['/arena']);
  }

  viewAiReview(): void {
    this.router.navigate(['/arena/analysis']);
  }
}
