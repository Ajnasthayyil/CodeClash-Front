import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { MatchCountdownService, CountdownState, UpcomingMatch } from '../../core/services/match-countdown.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isDarkMode = true;
  isMobileMenuOpen = false;

  // Mini countdown badge
  miniVisible   = false;
  miniCountdown = '';
  upcomingMatch: UpcomingMatch | null = null;

  private subs: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private countdownService: MatchCountdownService
  ) {}

  get isLoggedIn(): boolean { return this.authService.isLoggedIn; }
  get currentUser(): any    { return this.authService.getCurrentUser(); }

  logout() {
    this.authService.logout().subscribe({
      next: ()  => { this.router.navigate(['/']); },
      error: () => { this.authService.clearSession(); this.router.navigate(['/']); }
    });
  }

  logoutMobile() { this.isMobileMenuOpen = false; this.logout(); }
  toggleMobileMenu() { this.isMobileMenuOpen = !this.isMobileMenuOpen; }

  expandCountdown() { this.countdownService.expandWidget(); }

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isDarkMode = false;
      document.body.classList.add('light-mode');
    } else {
      this.isDarkMode = true;
      document.body.classList.remove('light-mode');
    }

    // Subscribe to mini badge visibility and countdown data
    this.subs.push(
      this.countdownService.miniVisible.subscribe((v: boolean) => { this.miniVisible = v; }),
      this.countdownService.upcomingMatch.subscribe((m: UpcomingMatch | null) => { this.upcomingMatch = m; }),
      this.countdownService.countdown.subscribe((c: CountdownState | null) => {
        if (c) { this.miniCountdown = this.buildMini(c); }
      })
    );
  }

  private buildMini(c: CountdownState): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (c.days > 0) return `${c.days}d ${pad(c.hours)}h ${pad(c.minutes)}m`;
    return `${pad(c.hours)}:${pad(c.minutes)}:${pad(c.seconds)}`;
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }
}
