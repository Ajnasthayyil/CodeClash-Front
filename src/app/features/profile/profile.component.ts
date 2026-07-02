import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  activeTab: Tab = 'overview';

  // ─── User ────────────────────────────────────────────────────────────────
  user = {
    initials: 'NC',
    name: 'NovaCoder',
    email: 'nova.coder@codeclash.com',
    phoneNumber: '',
    profileImageUrl: '',
    bio: 'Full-stack dev by day, algo grinder by night',
    location: 'United States',
    joined: 'Jan 2025',
    handle: 'novacoder',
    tier: 'Plat',
    eloRating: 1544,
    eloRatingDisplay: '1,544',
    role: 'User'
  };

  isEditModalOpen = false;
  isDropdownOpen = false;
  isConfirmDeleteModalOpen = false;
  editUser = { name: '', username: '', phoneNumber: '' };
  errorMessage = '';
  successMessage = '';
  isLoading = false;

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

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      this.user.name = parsed.name || this.user.name;
      this.user.email = parsed.email || this.user.email;
      this.user.phoneNumber = parsed.phoneNumber || this.user.phoneNumber;
      this.user.handle = parsed.username || this.user.handle;
      this.user.eloRating = parsed.rating || this.user.eloRating;
      this.user.eloRatingDisplay = this.user.eloRating.toLocaleString();
      this.user.role = parsed.role || 'User';
      this.user.joined = parsed.joined || this.user.joined;
      if (parsed.initials) {
        this.user.initials = parsed.initials;
      } else {
        this.updateInitials();
      }
    }

    // Load fresh data from the server
    this.authService.getProfile().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const profile = res.data;
          this.user.name = profile.fullName || this.user.name;
          this.user.email = profile.email || this.user.email;
          this.user.phoneNumber = profile.phoneNumber || '';
          this.user.handle = profile.username || this.user.handle;
          this.user.profileImageUrl = profile.profileImageUrl || '';
          
          if (profile.createdAt) {
            const joinedDate = new Date(profile.createdAt);
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            this.user.joined = `${monthNames[joinedDate.getMonth()]} ${joinedDate.getFullYear()}`;
          }

          this.updateInitials();

          // Sync back to localStorage
          const existing = savedUser ? JSON.parse(savedUser) : {};
          const updatedUser = {
            ...existing,
            name: this.user.name,
            email: this.user.email,
            phoneNumber: this.user.phoneNumber,
            username: this.user.handle,
            initials: this.user.initials,
            profileImageUrl: this.user.profileImageUrl,
            joined: this.user.joined,
            role: this.user.role
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      },
      error: (err) => {
        console.error('Failed to load profile from server:', err);
      }
    });
  }

  private updateInitials(): void {
    const parts = this.user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      this.user.initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      this.user.initials = parts[0][0].toUpperCase();
    } else {
      this.user.initials = 'NC';
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
      username: this.user.handle,
      phoneNumber: this.user.phoneNumber
    };
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
  }

  saveProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      fullName: this.editUser.name,
      username: this.editUser.username,
      phoneNumber: this.editUser.phoneNumber || ''
    };

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success && res.data) {
          this.user.name = res.data.fullName || this.user.name;
          this.user.handle = res.data.username || this.user.handle;
          this.user.phoneNumber = res.data.phoneNumber || '';
          this.user.email = res.data.email || this.user.email;

          this.updateInitials();

          // Save back to localStorage
          const savedUser = localStorage.getItem('currentUser');
          const existing = savedUser ? JSON.parse(savedUser) : {};
          const updatedUser = {
            ...existing,
            name: this.user.name,
            email: this.user.email,
            phoneNumber: this.user.phoneNumber,
            username: this.user.handle,
            initials: this.user.initials
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));

          this.successMessage = 'Profile updated successfully!';
          setTimeout(() => {
            this.successMessage = '';
            this.closeEditModal();
          }, 1500);
        } else {
          this.errorMessage = res.message || 'Failed to update profile.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && err.error.errors && err.error.errors.length > 0) {
          this.errorMessage = err.error.errors.join(' ');
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'An error occurred while updating the profile.';
        }
      }
    });
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.isLoading = true;
      this.authService.uploadProfileImage(file).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res && res.success && res.data) {
            const newUrl = res.data;
            this.user.profileImageUrl = newUrl;
            
            // Sync to localStorage
            const savedUser = localStorage.getItem('currentUser');
            const existing = savedUser ? JSON.parse(savedUser) : {};
            const updatedUser = {
              ...existing,
              profileImageUrl: newUrl
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            this.successMessage = 'Profile picture updated successfully!';
            this.errorMessage = '';
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          } else {
            this.errorMessage = res.message || 'Failed to upload profile picture.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('File upload error:', err);
          this.errorMessage = 'An error occurred while uploading the file.';
        }
      });
    }
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click')
  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  openConfirmDeleteModal(): void {
    this.isDropdownOpen = false;
    this.isConfirmDeleteModalOpen = true;
  }

  closeConfirmDeleteModal(): void {
    this.isConfirmDeleteModalOpen = false;
  }

  deleteAccount(): void {
    this.isLoading = true;
    this.authService.deleteAccount().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success) {
          this.authService.clearSession();
          this.closeConfirmDeleteModal();
          window.location.href = '/';
        } else {
          this.errorMessage = res.message || 'Failed to delete account.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Account deletion error:', err);
        this.errorMessage = 'An error occurred while deleting your account.';
      }
    });
  }
}
