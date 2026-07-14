import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { LeaderboardService, MyStatsDto } from '../../core/services/leaderboard.service';
import { AuthService } from '../../core/services/auth.service';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  points: number;
  rating: number;
  wl: string;
  battles: number;
  streak: number;
  lang: string;
  initial: string;
  avatarColor: string;
  isCurrentUser?: boolean;
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

  selectedLanguage = 'All';
  languages = ['All', 'Python', 'JavaScript', 'C#', 'Java', 'C++'];

  private allPlayers: LeaderboardEntry[] = [];
  isLoading = false;

  filteredPlayers: LeaderboardEntry[] = [];
  topThree: LeaderboardEntry[] = [];
  remainingPlayers: LeaderboardEntry[] = [];

  // Current user sidebar stats
  myStats: MyStatsDto | null = null;
  currentUserRank: number | null = null;
  totalPlayers: number = 0;

  Math = Math;

  constructor(
    private leaderboardService: LeaderboardService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.fetchLeaderboard();
    this.fetchMyStats();
  }

  fetchMyStats() {
    this.leaderboardService.getMyStats().subscribe({
      next: (stats) => {
        this.myStats = stats;
        this.currentUserRank = stats.rank;
        this.totalPlayers = stats.totalPlayers;
      },
      error: () => {
        // Not logged in or error — ignore silently
      }
    });
  }

  fetchLeaderboard(language?: string, scope?: string) {
    this.isLoading = true;
    this.leaderboardService.getLeaderboard(language, scope).subscribe({
      next: (res) => {
        this.isLoading = false;
        const currentUserId = this.authService.getCurrentUser()?.id;
        this.allPlayers = this.mapToEntries(res, currentUserId);
        this.buildView(this.allPlayers);
      },
      error: () => {
        this.isLoading = false;
        this.allPlayers = [];
        this.buildView([]);
      }
    });
  }

  fetchFriends() {
    this.isLoading = true;
    this.leaderboardService.getFriends().subscribe({
      next: (res) => {
        this.isLoading = false;
        const currentUserId = this.authService.getCurrentUser()?.id;
        const entries = this.mapToEntries(res, currentUserId);
        this.buildView(entries);
      },
      error: () => {
        this.isLoading = false;
        this.buildView([]);
      }
    });
  }

  private mapToEntries(res: any[], currentUserId?: string): LeaderboardEntry[] {
    const colors = ['#22c55e', '#3b82f6', '#a855f7', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];
    return res.map((user, index) => {
      const colorIndex = user.username
        ? user.username.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % colors.length
        : 0;
      return {
        rank: index + 1,
        id: user.id,
        name: user.username,
        points: user.totalPoints ?? 0,
        rating: user.rating ?? 1500,
        wl: `${user.wins ?? 0}/${user.losses ?? 0}`,
        battles: user.battles ?? 0,
        streak: 0,
        lang: user.favLanguage && user.favLanguage !== 'N/A' ? user.favLanguage : '—',
        initial: user.username ? user.username.charAt(0).toUpperCase() : '?',
        avatarColor: colors[colorIndex],
        isCurrentUser: !!currentUserId && user.id === currentUserId
      };
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.drawEloSparkline(), 50);
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.selectedLanguage = 'All';

    if (tab === 'Global') {
      this.fetchLeaderboard();
    } else if (tab === 'This Week') {
      this.fetchLeaderboard(undefined, 'weekly');
    } else if (tab === 'Friends') {
      this.fetchFriends();
    } else if (tab === 'By Language') {
      this.fetchLeaderboard(this.selectedLanguage !== 'All' ? this.selectedLanguage : undefined);
    }
  }

  onLanguageChange() {
    if (this.activeTab === 'By Language') {
      this.fetchLeaderboard(this.selectedLanguage !== 'All' ? this.selectedLanguage : undefined);
    }
  }

  private buildView(entries: LeaderboardEntry[]) {
    // Re-rank
    entries.forEach((p, idx) => p.rank = idx + 1);
    this.filteredPlayers = entries;
    if (!this.myStats) {
      // Fallback: count from list
      const currentUserId = this.authService.getCurrentUser()?.id;
      const found = entries.find(p => p.isCurrentUser);
      this.currentUserRank = found ? found.rank : null;
      this.totalPlayers = entries.length;
    }
    this.topThree = entries.slice(0, 3);
    this.remainingPlayers = entries.slice(3);
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

    // Build sparkline from myStats language breakdown (just use counts as proxy)
    let data: { day: number; elo: number }[];
    if (this.myStats && this.myStats.totalPoints > 0) {
      // Simple synthetic trend based on rating
      const base = Math.max(0, this.myStats.rating - 150);
      data = [0, 5, 10, 15, 20, 25, 30].map((day, i) => ({
        day,
        elo: base + Math.round((this.myStats!.rating - base) * (i / 6))
      }));
    } else {
      data = [
        { day: 0, elo: 1500 }, { day: 5, elo: 1510 }, { day: 10, elo: 1505 },
        { day: 15, elo: 1520 }, { day: 20, elo: 1515 }, { day: 25, elo: 1530 }, { day: 30, elo: 1500 }
      ];
    }

    const minElo = Math.min(...data.map(d => d.elo)) - 10;
    const maxElo = Math.max(...data.map(d => d.elo)) + 10;
    const padL = 5, padR = 5, padT = 10, padB = 10;

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(249,115,22,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    const points = data.map((d, index) => ({
      x: padL + (index / (data.length - 1)) * (W - padL - padR),
      y: H - padB - ((d.elo - minElo) / (maxElo - minElo)) * (H - padT - padB),
      elo: d.elo
    }));

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(249,115,22,0.2)');
    grad.addColorStop(1, 'rgba(249,115,22,0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, H);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    points.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.stroke();

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

