import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatchCountdownService, CountdownState, UpcomingMatch } from '../../core/services/match-countdown.service';

@Component({
  selector: 'app-match-countdown-widget',
  template: `
    <!-- ═══ FULL FLOATING WIDGET ═══ -->
    <div *ngIf="widgetVisible && match && countdown"
      class="fixed top-24 right-4 z-[999] w-72 animate-slideInRight">
      <div class="relative bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-orange-500/30 rounded-2xl shadow-2xl shadow-orange-900/30 overflow-hidden backdrop-blur-md">

        <!-- Ambient glow layer -->
        <div class="absolute inset-0 bg-gradient-to-br from-orange-600/5 via-transparent to-purple-600/5 pointer-events-none"></div>

        <!-- Header bar -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20">
          <div class="flex items-center gap-2">
            <span class="inline-flex w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span class="text-xs font-bold text-orange-400 uppercase tracking-widest">Upcoming Match</span>
          </div>
          <div class="flex items-center gap-1">
            <!-- Minimize to mini badge -->
            <button (click)="minimize()" title="Minimize to navbar"
              class="w-6 h-6 rounded-md text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4"/>
              </svg>
            </button>
            <!-- Close / Dismiss entirely -->
            <button (click)="dismiss()" title="Close"
              class="w-6 h-6 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Match info -->
        <div class="px-4 pt-3 pb-1">
          <!-- Tournament name -->
          <div class="flex items-center gap-1.5 mb-1.5">
            <svg class="w-3 h-3 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
            </svg>
            <span class="text-[11px] font-semibold text-orange-400 truncate">
              {{ match.tournamentTitle || 'Tournament Match' }}
            </span>
          </div>
          <!-- Players -->
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm font-bold text-white truncate max-w-[90px]" [title]="match.player1Username || 'TBD'">
              {{ match.player1Username || 'TBD' }}
            </span>
            <span class="text-orange-500 font-black text-xs flex-shrink-0">VS</span>
            <span class="text-sm font-bold text-white truncate max-w-[90px]" [title]="match.player2Username || 'TBD'">
              {{ match.player2Username || 'TBD' }}
            </span>
          </div>
          <p class="text-[11px] text-slate-500">
            {{ match.scheduledTime | date:'MMM d, y — h:mm a' }}
          </p>
        </div>

        <!-- Countdown tiles -->
        <div class="grid grid-cols-4 gap-2 px-4 pt-2 pb-4">
          <div class="flex flex-col items-center bg-white/5 border border-white/[0.08] rounded-xl py-2.5">
            <span class="text-xl font-extrabold text-white font-mono leading-none">{{ pad(countdown.days) }}</span>
            <span class="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Days</span>
          </div>
          <div class="flex flex-col items-center bg-white/5 border border-white/[0.08] rounded-xl py-2.5">
            <span class="text-xl font-extrabold text-white font-mono leading-none">{{ pad(countdown.hours) }}</span>
            <span class="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Hrs</span>
          </div>
          <div class="flex flex-col items-center bg-white/5 border border-white/[0.08] rounded-xl py-2.5">
            <span class="text-xl font-extrabold text-orange-400 font-mono leading-none">{{ pad(countdown.minutes) }}</span>
            <span class="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Min</span>
          </div>
          <div class="flex flex-col items-center bg-white/5 border border-white/[0.08] rounded-xl py-2.5">
            <span class="text-xl font-extrabold text-orange-500 font-mono leading-none">{{ pad(countdown.seconds) }}</span>
            <span class="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Sec</span>
          </div>
        </div>

        <!-- Accent line -->
        <div class="h-0.5 bg-gradient-to-r from-orange-600 via-orange-400 to-purple-500 mx-4 mb-3 rounded-full opacity-60"></div>
      </div>
    </div>

  `,
  styles: [`
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(100%) scale(0.95); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    .animate-slideInRight {
      animation: slideInRight 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
  `]
})
export class MatchCountdownWidgetComponent implements OnInit, OnDestroy {
  widgetVisible = false;
  miniVisible   = false;
  match: UpcomingMatch | null      = null;
  countdown: CountdownState | null = null;
  miniCountdown = '';

  private subs: Subscription[] = [];

  constructor(private countdownService: MatchCountdownService) {}

  ngOnInit(): void {
    // Ensure the hub is connected now that user is in main layout (authenticated)
    this.countdownService.tryConnect();

    this.subs.push(
      this.countdownService.widgetVisible.subscribe((v: boolean)             => { this.widgetVisible = v; }),
      this.countdownService.miniVisible.subscribe((v: boolean)               => { this.miniVisible = v; }),
      this.countdownService.upcomingMatch.subscribe((m: UpcomingMatch | null) => { this.match = m; }),
      this.countdownService.countdown.subscribe((c: CountdownState | null) => {
        this.countdown = c;
        if (c) { this.miniCountdown = this.buildMini(c); }
      })
    );
  }

  pad(n: number): string { return n.toString().padStart(2, '0'); }

  private buildMini(c: CountdownState): string {
    if (c.days > 0) return `${c.days}d ${this.pad(c.hours)}h ${this.pad(c.minutes)}m`;
    return `${this.pad(c.hours)}:${this.pad(c.minutes)}:${this.pad(c.seconds)}`;
  }

  minimize(): void { this.countdownService.minimizeWidget(); }
  expand():   void { this.countdownService.expandWidget(); }
  dismiss():  void { this.countdownService.dismissAll(); }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }
}
