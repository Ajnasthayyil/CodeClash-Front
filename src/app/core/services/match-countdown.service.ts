import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import * as signalR from '@microsoft/signalr';

export interface UpcomingMatch {
  matchId: string;
  tournamentId: string;
  tournamentTitle?: string;
  scheduledTime: Date;
  player1Username?: string;
  player2Username?: string;
}

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class MatchCountdownService implements OnDestroy {
  private upcomingMatch$ = new BehaviorSubject<UpcomingMatch | null>(null);
  private countdown$     = new BehaviorSubject<CountdownState | null>(null);
  private widgetVisible$ = new BehaviorSubject<boolean>(false);
  private miniVisible$   = new BehaviorSubject<boolean>(false);

  upcomingMatch  = this.upcomingMatch$.asObservable();
  countdown      = this.countdown$.asObservable();
  widgetVisible  = this.widgetVisible$.asObservable();
  miniVisible    = this.miniVisible$.asObservable();

  private timerSub: Subscription | null = null;
  private hubConnection: signalR.HubConnection | null = null;

  constructor(private authService: AuthService) {
    // Defer hub init until the user is logged in
    this.tryConnect();
  }

  /** Re-entrant: safe to call multiple times */
  async tryConnect(): Promise<void> {
    if (!this.authService.isLoggedIn) return;
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) return;

    try {
      if (this.hubConnection) {
        await this.hubConnection.stop().catch(() => {});
        this.hubConnection = null;
      }

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.backendUrl}/hubs/tournament`, {
          accessTokenFactory: () => this.authService.getAccessToken() || ''
        })
        .withAutomaticReconnect([0, 3000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.hubConnection.on('MatchScheduled', (data: any) => {
        console.log('[CountdownService] MatchScheduled received:', data);
        this.handleMatchScheduled(data);
      });

      await this.hubConnection.start();

      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.id || currentUser?.userId) {
        // Join a personal channel so backend can push directly to this user
        // (If JoinPersonal is not implemented, hub will at least have the connection)
        try {
          await this.hubConnection.invoke('JoinPersonal').catch(() => {});
        } catch (_) {}
      }

      console.log('[CountdownService] Hub connected:', this.hubConnection.state);
    } catch (err) {
      console.warn('[CountdownService] Hub connect failed:', err);
    }
  }

  private handleMatchScheduled(data: any): void {
    if (!this.authService.isLoggedIn) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const userId = (currentUser.id || currentUser.userId || '').toString().toLowerCase();
    const p1     = (data.player1Id || '').toLowerCase();
    const p2     = (data.player2Id || '').toLowerCase();

    // Show to both participants (or if no IDs provided, show to all — admin didn't set players yet)
    const isParticipant = (!p1 && !p2) || p1 === userId || p2 === userId;
    if (!isParticipant) return;

    if (!data.scheduledTime) return;
    const raw           = data.scheduledTime.endsWith('Z') ? data.scheduledTime : data.scheduledTime + 'Z';
    const scheduledDate = new Date(raw);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) return;

    this.setMatch({
      matchId:         data.matchId,
      tournamentId:    data.tournamentId,
      tournamentTitle: data.tournamentTitle || data.tournamentName || '',
      scheduledTime:   scheduledDate,
      player1Username: data.player1Username || data.player1Name || '',
      player2Username: data.player2Username || data.player2Name || '',
    });
  }

  /** Called externally (e.g. TournamentComponent) to trigger widget */
  setMatch(match: UpcomingMatch): void {
    this.upcomingMatch$.next(match);
    this.widgetVisible$.next(true);
    this.miniVisible$.next(false);
    this.startTimer(match.scheduledTime);
  }

  private startTimer(scheduledTime: Date): void {
    this.stopTimer();
    // Tick immediately then every second
    this.tick(scheduledTime);
    this.timerSub = interval(1000).subscribe(() => this.tick(scheduledTime));
  }

  private tick(scheduledTime: Date): void {
    const diff = scheduledTime.getTime() - Date.now();
    if (diff <= 0) {
      this.countdown$.next({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
      this.stopTimer();
      return;
    }
    const totalSeconds = Math.floor(diff / 1000);
    const days    = Math.floor(totalSeconds / 86400);
    const hours   = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    this.countdown$.next({ days, hours, minutes, seconds, totalSeconds });
  }

  private stopTimer(): void {
    this.timerSub?.unsubscribe();
    this.timerSub = null;
  }

  minimizeWidget(): void { this.widgetVisible$.next(false); this.miniVisible$.next(true); }
  expandWidget():  void { this.widgetVisible$.next(true);  this.miniVisible$.next(false); }
  dismissAll():    void {
    this.widgetVisible$.next(false);
    this.miniVisible$.next(false);
    this.upcomingMatch$.next(null);
    this.countdown$.next(null);
    this.stopTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.hubConnection?.stop().catch(() => {});
  }
}
