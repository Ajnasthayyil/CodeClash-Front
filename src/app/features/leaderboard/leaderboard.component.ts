import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { LeaderboardService } from '../../core/services/leaderboard.service';

interface LeaderboardEntry {
  rank: number;
  name: string;
  elo: number;
  wl: string;
  battles: number;
  streak: number;
  lang: string;
  initial: string;
  avatarColor: string;
  isCurrentUser?: boolean;
  country: string;
}

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit, AfterViewInit {
  @ViewChild('eloSparkline') eloSparkline!: ElementRef<HTMLCanvasElement>;

  activeTab = 'Global';
  tabs = ['Global', 'Friends', 'This Week', 'By Language'];

  selectedCountry = 'All';
  selectedLanguage = 'All';
  selectedTimePeriod = 'All';

  countries = [
    { code: 'All', name: 'All Countries' },
    { code: 'US', name: 'United States' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'IN', name: 'India' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' }
  ];

  languages = ['All', 'Python', 'Go', 'Rust', 'Java', 'C++', 'JavaScript', 'TypeScript'];
  timePeriods = ['All', 'This Week', 'This Month'];

  // ELO History for NovaCoder (You)
  eloHistory = [
    { day: 1, elo: 1710 },
    { day: 5, elo: 1735 },
    { day: 10, elo: 1720 },
    { day: 15, elo: 1765 },
    { day: 20, elo: 1750 },
    { day: 25, elo: 1810 },
    { day: 30, elo: 1842 }
  ];

  // Raw database
  private allPlayers: LeaderboardEntry[] = [];
  isLoading = false;

  // Filtered view data
  filteredPlayers: LeaderboardEntry[] = [];
  topThree: LeaderboardEntry[] = [];
  remainingPlayers: LeaderboardEntry[] = [];

  constructor(private leaderboardService: LeaderboardService) {}

  ngOnInit() {
    this.fetchLeaderboard();
  }

  fetchLeaderboard() {
    this.isLoading = true;
    this.leaderboardService.getLeaderboard().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success && res.data) {
          // Map DB users to leaderboard entries
          // Rank is assigned sequentially since the backend already sorts them alphabetically
          this.allPlayers = res.data.map((user, index) => {
            const initial = user.username ? user.username.charAt(0).toUpperCase() : '?';
            
            // Assign deterministic color based on username
            const colors = ['#22c55e', '#3b82f6', '#a855f7', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];
            let colorIndex = 0;
            if (user.username) {
              colorIndex = user.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
            }
            
            return {
              rank: index + 1,
              name: user.username,
              elo: 0, // 0 points for now
              wl: '0/0',
              battles: 0,
              streak: 0,
              lang: 'Any',
              initial: initial,
              avatarColor: colors[colorIndex],
              country: user.country || 'US'
            };
          });
          this.applyFilters();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to fetch leaderboard', err);
        this.allPlayers = [];
        this.applyFilters();
      }
    });
  }

  ngAfterViewInit() {
    // Redraw sparkline when canvas is rendered
    setTimeout(() => this.drawEloSparkline(), 50);
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.allPlayers];

    // Filter by Tab
    if (this.activeTab === 'Friends') {
      // Mock friends subset
      result = result.filter(p => ['NexusGod', 'AlgoKing99', 'NovaCoder', 'CodeGeek'].includes(p.name));
    } else if (this.activeTab === 'This Week') {
      // Shuffled/slightly different ELO scores for week activity simulation
      result = result.map(p => ({
        ...p,
        elo: p.elo - Math.floor(Math.random() * 20)
      })).sort((a, b) => b.elo - a.elo);
    } else if (this.activeTab === 'By Language') {
      // Grouped by current filter, or default list sorted by matching main language
      if (this.selectedLanguage !== 'All') {
        result = result.filter(p => p.lang === this.selectedLanguage);
      }
    }

    // Filter by dropdown selectors
    if (this.selectedCountry !== 'All') {
      result = result.filter(p => p.country === this.selectedCountry);
    }

    if (this.selectedLanguage !== 'All' && this.activeTab !== 'By Language') {
      result = result.filter(p => p.lang === this.selectedLanguage);
    }

    // Re-rank items according to filters
    result = result.sort((a, b) => b.elo - a.elo);
    result.forEach((p, idx) => {
      p.rank = idx + 1;
    });

    this.filteredPlayers = result;
    this.topThree = result.slice(0, 3);
    this.remainingPlayers = result.slice(3);
  }

  drawEloSparkline(): void {
    const canvas = this.eloSparkline?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.offsetWidth || 260;
    const H = 70;
    canvas.width = W;
    canvas.height = H;

    const data = this.eloHistory;
    const minElo = Math.min(...data.map(d => d.elo)) - 10;
    const maxElo = Math.max(...data.map(d => d.elo)) + 10;
    const padL = 5, padR = 5, padT = 10, padB = 10;

    // Draw grid/background line
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(249,115,22,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    // Map points to canvas dimensions
    const points = data.map((d, index) => {
      const x = padL + (index / (data.length - 1)) * (W - padL - padR);
      const y = H - padB - ((d.elo - minElo) / (maxElo - minElo)) * (H - padT - padB);
      return { x, y, elo: d.elo };
    });

    // Create gradient fill below sparkline
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(249,115,22,0.2)');
    grad.addColorStop(1, 'rgba(249,115,22,0.0)');

    // Fill area under sparkline
    ctx.beginPath();
    ctx.moveTo(points[0].x, H);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw main line path
    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = '#f97316'; // CodeClash orange ELO line
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw dots for each point
    points.forEach((p, idx) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = idx === points.length - 1 ? '#ffffff' : '#f97316';
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    });
  }
}
