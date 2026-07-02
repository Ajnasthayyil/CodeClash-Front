import { Component, OnInit, OnDestroy } from '@angular/core';

interface BracketMatch {
  id: number;
  stage: 'quarter' | 'semi' | 'final';
  status: 'completed' | 'live' | 'upcoming';
  p1: string;
  p1Score?: number;
  p2: string;
  p2Score?: number;
  liveLink?: boolean;
}

interface UpcomingMatch {
  id: number;
  timeUTC: string;
  p1: string;
  p2: string;
  timeRemainingSeconds: number;
}

@Component({
  selector: 'app-tournament',
  templateUrl: './tournament.component.html',
  styleUrls: ['./tournament.component.scss']
})
export class TournamentComponent implements OnInit, OnDestroy {
  // Active Tournament Metadata
  tournamentTitle = 'Violet Championship S3';
  tournamentDates = 'Jun 20–21, 2026';
  participantsCount = 256;
  rewards = 'Diamond Badge + 5,000 pts';
  
  isRegistered = false;
  selectedEvent = 'violet-s3';

  // Live Watch Simulation modal
  showLiveModal = false;
  liveMatchInfo = '';
  liveConsoleLogs: string[] = [];
  private liveSimInterval: any;

  // Bracket Grid Matches
  bracketMatches: BracketMatch[] = [
    // Quarter Finals
    { id: 1, stage: 'quarter', status: 'completed', p1: 'NexusGod', p1Score: 2, p2: 'AlgoKing99', p2Score: 1 },
    { id: 2, stage: 'quarter', status: 'live', p1: 'ByteWizard', p2: 'CodePhantom', liveLink: true },
    { id: 3, stage: 'quarter', status: 'upcoming', p1: 'NovaCoder', p2: 'QuantumDev' },
    { id: 4, stage: 'quarter', status: 'upcoming', p1: 'GhostCoder', p2: 'StarDev' },
    // Semi Finals
    { id: 5, stage: 'semi', status: 'upcoming', p1: 'NexusGod', p2: 'TBD' },
    { id: 6, stage: 'semi', status: 'upcoming', p1: 'TBD', p2: 'TBD' },
    // Final
    { id: 7, stage: 'final', status: 'upcoming', p1: 'TBD', p2: 'TBD' }
  ];

  // Right Column: Upcoming match schedules
  upcomingMatches: UpcomingMatch[] = [
    { id: 1, timeUTC: '14:30 UTC', p1: 'NovaCoder', p2: 'QuantumDev', timeRemainingSeconds: 2 * 3600 + 15 * 60 },
    { id: 2, timeUTC: '15:00 UTC', p1: 'GhostCoder', p2: 'StarDev', timeRemainingSeconds: 2 * 3600 + 45 * 60 },
    { id: 3, timeUTC: '16:00 UTC', p1: 'TBD', p2: 'TBD', timeRemainingSeconds: 3 * 3600 + 45 * 60 }
  ];

  private countdownInterval: any;

  constructor() {}

  ngOnInit(): void {
    // Start countdown timers
    this.countdownInterval = setInterval(() => {
      this.upcomingMatches.forEach(m => {
        if (m.timeRemainingSeconds > 0) {
          m.timeRemainingSeconds--;
        }
      });
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownInterval);
    clearInterval(this.liveSimInterval);
  }

  // Format countdowns to hh:mm:ss
  getDisplayTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // Handle Event selection changes
  onEventChange(eventKey: string): void {
    this.selectedEvent = eventKey;
    if (eventKey === 'violet-s3') {
      this.tournamentTitle = 'Violet Championship S3';
      this.tournamentDates = 'Jun 20–21, 2026';
      this.participantsCount = 256;
      this.rewards = 'Diamond Badge + 5,000 pts';
      this.isRegistered = false;
      this.bracketMatches = [
        { id: 1, stage: 'quarter', status: 'completed', p1: 'NexusGod', p1Score: 2, p2: 'AlgoKing99', p2Score: 1 },
        { id: 2, stage: 'quarter', status: 'live', p1: 'ByteWizard', p2: 'CodePhantom', liveLink: true },
        { id: 3, stage: 'quarter', status: 'upcoming', p1: 'NovaCoder', p2: 'QuantumDev' },
        { id: 4, stage: 'quarter', status: 'upcoming', p1: 'GhostCoder', p2: 'StarDev' },
        { id: 5, stage: 'semi', status: 'upcoming', p1: 'NexusGod', p2: 'TBD' },
        { id: 6, stage: 'semi', status: 'upcoming', p1: 'TBD', p2: 'TBD' },
        { id: 7, stage: 'final', status: 'upcoming', p1: 'TBD', p2: 'TBD' }
      ];
    } else if (eventKey === 'golden-s2') {
      this.tournamentTitle = 'Golden League S2';
      this.tournamentDates = 'May 14–15, 2026';
      this.participantsCount = 128;
      this.rewards = 'Golden Badge + 3,000 pts';
      this.isRegistered = true; // simulation: already completed/registered
      this.bracketMatches = [
        { id: 1, stage: 'quarter', status: 'completed', p1: 'NexusGod', p1Score: 2, p2: 'SyntaxError', p2Score: 0 },
        { id: 2, stage: 'quarter', status: 'completed', p1: 'ByteWizard', p1Score: 2, p2: 'CodeRaptor', p2Score: 1 },
        { id: 3, stage: 'quarter', status: 'completed', p1: 'NovaCoder', p1Score: 2, p2: 'QuantumDev', p2Score: 0 },
        { id: 4, stage: 'quarter', status: 'completed', p1: 'GhostCoder', p1Score: 1, p2: 'StarDev', p2Score: 2 },
        { id: 5, stage: 'semi', status: 'completed', p1: 'NexusGod', p1Score: 1, p2: 'ByteWizard', p2Score: 2 },
        { id: 6, stage: 'semi', status: 'completed', p1: 'NovaCoder', p1Score: 0, p2: 'StarDev', p2Score: 2 },
        { id: 7, stage: 'final', status: 'completed', p1: 'ByteWizard', p1Score: 3, p2: 'StarDev', p2Score: 1 }
      ];
    } else if (eventKey === 'amber-s1') {
      this.tournamentTitle = 'Amber Cup S1';
      this.tournamentDates = 'Apr 02–03, 2026';
      this.participantsCount = 64;
      this.rewards = 'Amber Badge + 1,500 pts';
      this.isRegistered = true;
      this.bracketMatches = [
        { id: 1, stage: 'quarter', status: 'completed', p1: 'AlgoKing99', p1Score: 2, p2: 'ArrayNinja', p2Score: 0 },
        { id: 2, stage: 'quarter', status: 'completed', p1: 'ByteWizard', p1Score: 1, p2: 'CodePhantom', p2Score: 2 },
        { id: 3, stage: 'quarter', status: 'completed', p1: 'NovaCoder', p1Score: 2, p2: 'StackOverflow', p2Score: 1 },
        { id: 4, stage: 'quarter', status: 'completed', p1: 'BinaryBeast', p1Score: 0, p2: 'StarDev', p2Score: 2 },
        { id: 5, stage: 'semi', status: 'completed', p1: 'AlgoKing99', p1Score: 0, p2: 'CodePhantom', p2Score: 2 },
        { id: 6, stage: 'semi', status: 'completed', p1: 'NovaCoder', p1Score: 1, p2: 'StarDev', p2Score: 2 },
        { id: 7, stage: 'final', status: 'completed', p1: 'CodePhantom', p1Score: 2, p2: 'StarDev', p2Score: 3 }
      ];
    }
  }

  // ─── Watch Match Live Simulation ───────────────────────────────────────────
  watchLiveMatch(match: BracketMatch): void {
    this.liveMatchInfo = `${match.p1} vs ${match.p2}`;
    this.liveConsoleLogs = [
      `[00:01] Match initiated between ${match.p1} and ${match.p2}.`,
      `[00:15] Problem loaded: "Longest Valid Parentheses".`,
      `[00:45] ${match.p1} is working on stack logic boilerplate.`,
      `[01:20] ${match.p2} has coded the core dynamic programming helper.`
    ];
    this.showLiveModal = true;

    // Simulate ticking live log outputs
    clearInterval(this.liveSimInterval);
    let counter = 1;
    this.liveSimInterval = setInterval(() => {
      counter++;
      const timeStamp = `[01:${18 + counter * 12}]`;
      const logs = [
        `${timeStamp} ${match.p1} runs compilation on test suite...`,
        `${timeStamp} ${match.p1} passed 4/10 sample tests.`,
        `${timeStamp} ${match.p2} submits solution for execution!`,
        `${timeStamp} ${match.p2} passed 7/10 tests. ELO performance trending upwards.`,
        `${timeStamp} ${match.p1} optimizes stack lookup loop speed...`,
        `${timeStamp} ${match.p1} passed 8/10 tests! Grid is tightening!`
      ];

      const logIndex = (counter - 2) % logs.length;
      this.liveConsoleLogs.push(logs[logIndex]);

      // Auto scroll simulator container
      setTimeout(() => {
        const el = document.getElementById('live-log-console');
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      }, 50);

      if (counter >= 12) {
        clearInterval(this.liveSimInterval);
        this.liveConsoleLogs.push(`[03:45] Sim ended. Watch live complete.`);
      }
    }, 2500);
  }
}
