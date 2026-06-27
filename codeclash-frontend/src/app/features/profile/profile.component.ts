import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

type Tab = 'overview' | 'history' | 'achievements' | 'stats';

interface MatchRecord {
  opponent: string;
  problem: string;
  result: 'Win' | 'Loss';
  score: number;
  language: string;
  duration: string;
  date: string;
  eloChange: number;
}

interface Achievement {
  icon: string;
  title: string;
  desc: string;
  earned: boolean;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

interface StatBar {
  label: string;
  value: number;
  max: number;
  color: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, AfterViewInit {
  @ViewChild('eloCanvas') eloCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas') donutCanvas!: ElementRef<HTMLCanvasElement>;

  activeTab: Tab = 'overview';

  // ─── User ────────────────────────────────────────────────────────────────
  user = {
    initials: 'NC',
    name: 'NovaCoder',
    email: 'nova.coder@codeclash.com',
    designation: 'Senior Software Engineer',
    bio: 'Full-stack dev by day, algo grinder by night',
    location: 'United States',
    joined: 'Jan 2025',
    handle: 'novacoder',
    tier: 'Plat',
    eloRating: 1544,
    eloRatingDisplay: '1,544'
  };

  isEditModalOpen = false;
  editUser = { name: '', email: '', designation: '' };

  // ─── Stats ───────────────────────────────────────────────────────────────
  stats = [
    { value: '196',     label: 'Battles',        accent: false },
    { value: '134',     label: 'Wins',            accent: false },
    { value: '68%',     label: 'Win Rate',        accent: false },
    { value: '214',     label: 'Problems Solved', accent: true  },
    { value: '21 days', label: 'Best Streak',     accent: false }
  ];

  // ─── Language Preference (donut) ─────────────────────────────────────────
  languages = [
    { name: 'Python',     pct: 52, color: '#7c3aed' },
    { name: 'JavaScript', pct: 28, color: '#10b981' },
    { name: 'Java',       pct: 12, color: '#6366f1' },
    { name: 'C++',        pct:  8, color: '#f59e0b' }
  ];

  // ─── ELO History (line chart data) ───────────────────────────────────────
  eloHistory = [
    { month: 'Feb', elo: 1180 },
    { month: 'Mar', elo: 1240 },
    { month: 'Apr', elo: 1310 },
    { month: 'May', elo: 1430 },
    { month: 'Jun', elo: 1544 }
  ];

  // ─── Match History ───────────────────────────────────────────────────────
  matchHistory: MatchRecord[] = [
    { opponent: 'ByteWizard',   problem: 'Two Sum',               result: 'Win',  score: 98, language: 'Python',     duration: '12:29', date: '2 hours ago',  eloChange: +18 },
    { opponent: 'CodeNinja',    problem: 'LRU Cache',             result: 'Win',  score: 92, language: 'JavaScript', duration: '18:44', date: '1 day ago',    eloChange: +22 },
    { opponent: 'AlgoMaster',   problem: 'Merge K Sorted Lists',  result: 'Loss', score: 61, language: 'Python',     duration: '20:00', date: '2 days ago',   eloChange: -15 },
    { opponent: 'DevHunter99',  problem: 'Binary Tree Paths',     result: 'Win',  score: 95, language: 'Go',         duration: '09:52', date: '3 days ago',   eloChange: +20 },
    { opponent: 'RustWarrior',  problem: 'Trapping Rain Water',   result: 'Loss', score: 55, language: 'Python',     duration: '20:00', date: '4 days ago',   eloChange: -12 },
    { opponent: 'JSNinja42',    problem: 'Valid Parentheses',     result: 'Win',  score: 100, language: 'JavaScript', duration: '05:30', date: '5 days ago',  eloChange: +16 }
  ];

  // ─── Achievements ─────────────────────────────────────────────────────────
  achievements: Achievement[] = [
    { icon: '🏆', title: 'First Blood',       desc: 'Won your first coding battle',              earned: true,  rarity: 'Common' },
    { icon: '🔥', title: 'On Fire',           desc: 'Won 5 battles in a row',                    earned: true,  rarity: 'Rare' },
    { icon: '⚡', title: 'Speed Demon',       desc: 'Solved a Hard problem in under 5 minutes',  earned: true,  rarity: 'Epic' },
    { icon: '💎', title: 'Diamond Hands',     desc: 'Reached Platinum tier',                     earned: true,  rarity: 'Legendary' },
    { icon: '🌙', title: 'Night Owl',         desc: 'Won 10 battles between midnight and 6am',   earned: false, rarity: 'Rare' },
    { icon: '🧠', title: 'Big Brain',         desc: 'Solved 100 unique problems',                earned: true,  rarity: 'Epic' },
    { icon: '🤝', title: 'Social Coder',      desc: 'Participated in 5 team battles',            earned: false, rarity: 'Common' },
    { icon: '🎯', title: 'Perfect Score',     desc: 'Achieved 100/100 on 10 battles',            earned: false, rarity: 'Legendary' }
  ];

  // ─── Detailed Stats ───────────────────────────────────────────────────────
  detailedStats: StatBar[] = [
    { label: 'Easy Problems',    value: 98,  max: 100, color: '#10b981' },
    { label: 'Medium Problems',  value: 84,  max: 100, color: '#f97316' },
    { label: 'Hard Problems',    value: 32,  max: 100, color: '#f85149' },
    { label: 'Tournaments Won',  value: 7,   max: 20,  color: '#f97316' },
    { label: 'Perfect Scores',   value: 14,  max: 50,  color: '#ea580c' }
  ];

  topLanguages = this.languages;

  ngOnInit(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      this.user.name = parsed.name || this.user.name;
      this.user.email = parsed.email || this.user.email;
      this.user.designation = parsed.designation || this.user.designation;
      this.user.eloRating = parsed.rating || this.user.eloRating;
      this.user.eloRatingDisplay = this.user.eloRating.toLocaleString();
      if (parsed.initials) {
        this.user.initials = parsed.initials;
      } else {
        const parts = this.user.name.trim().split(/\s+/);
        if (parts.length >= 2) {
          this.user.initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else if (parts.length === 1 && parts[0].length > 0) {
          this.user.initials = parts[0][0].toUpperCase();
        }
      }
    }
  }

  ngAfterViewInit(): void {
    // Small delay to ensure DOM is rendered
    setTimeout(() => {
      this.drawDonut();
      this.drawEloLine();
    }, 100);
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'overview') {
      setTimeout(() => { this.drawDonut(); this.drawEloLine(); }, 50);
    }
  }

  // ─── Donut Chart ──────────────────────────────────────────────────────────
  drawDonut(): void {
    const canvas = this.donutCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 110;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2, cy = size / 2, r = 44, inner = 26;

    ctx.clearRect(0, 0, size, size);
    let angle = -Math.PI / 2;

    this.languages.forEach(lang => {
      const slice = (lang.pct / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = lang.color;
      ctx.fill();
      angle += slice;
    });

    // Hollow centre
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1117';
    ctx.fill();
  }

  // ─── ELO Line Chart ───────────────────────────────────────────────────────
  drawEloLine(): void {
    const canvas = this.eloCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.offsetWidth || 380;
    const H = 120;
    canvas.width = W;
    canvas.height = H;

    const data = this.eloHistory;
    const minElo = Math.min(...data.map(d => d.elo)) - 60;
    const maxElo = Math.max(...data.map(d => d.elo)) + 40;
    const padL = 10, padR = 10, padT = 14, padB = 28;

    const toX = (i: number) => padL + (i / (data.length - 1)) * (W - padL - padR);
    const toY = (v: number) => padT + ((maxElo - v) / (maxElo - minElo)) * (H - padT - padB);

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(249,115,22,0.3)');
    grad.addColorStop(1, 'rgba(249,115,22,0.0)');

    ctx.beginPath();
    data.forEach((d, i) => {
      i === 0 ? ctx.moveTo(toX(i), toY(d.elo)) : ctx.lineTo(toX(i), toY(d.elo));
    });
    ctx.lineTo(toX(data.length - 1), H - padB);
    ctx.lineTo(toX(0), H - padB);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((d, i) => {
      i === 0 ? ctx.moveTo(toX(i), toY(d.elo)) : ctx.lineTo(toX(i), toY(d.elo));
    });
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots + month labels
    ctx.fillStyle = '#f97316';
    data.forEach((d, i) => {
      ctx.beginPath();
      ctx.arc(toX(i), toY(d.elo), 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#7d8590';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.month, toX(i), H - 6);
      ctx.fillStyle = '#f97316';
    });
  }

  getRarityClass(rarity: string): string {
    const map: Record<string, string> = {
      Common: 'rarity-common', Rare: 'rarity-rare',
      Epic: 'rarity-epic', Legendary: 'rarity-legendary'
    };
    return map[rarity] || '';
  }

  get earnedCount(): number {
    return this.achievements.filter(a => a.earned).length;
  }

  openEditModal(): void {
    this.editUser = {
      name: this.user.name,
      email: this.user.email,
      designation: this.user.designation
    };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
  }

  saveProfile(): void {
    this.user.name = this.editUser.name;
    this.user.email = this.editUser.email;
    this.user.designation = this.editUser.designation;

    // Update initials automatically
    const parts = this.editUser.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      this.user.initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      this.user.initials = parts[0][0].toUpperCase();
    } else {
      this.user.initials = 'NC';
    }

    // Save back to localStorage
    const savedUser = localStorage.getItem('currentUser');
    const existing = savedUser ? JSON.parse(savedUser) : {};
    const updatedUser = {
      ...existing,
      name: this.user.name,
      email: this.user.email,
      designation: this.user.designation,
      initials: this.user.initials
    };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    this.closeEditModal();
  }
}
