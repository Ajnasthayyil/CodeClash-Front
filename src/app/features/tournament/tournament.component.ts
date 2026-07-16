import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService, Tournament, TournamentMatch, TournamentParticipant } from '../../core/services/tournament.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../shared/notifications/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tournament',
  templateUrl: './tournament.component.html',
  styleUrls: ['./tournament.component.scss']
})
export class TournamentComponent implements OnInit, OnDestroy {
  // All tournaments fetched from server
  tournaments: Tournament[] = [];
  selectedTournamentId: string = '';
  selectedTournament: Tournament | null = null;

  // Real data
  participants: TournamentParticipant[] = [];
  matches: TournamentMatch[] = [];

  // Current User info
  currentUser: any = null;
  currentUserId: string = '';
  currentUserRating: number = 1200;

  // Bracket Grid formatted for HTML template
  bracketMatches: {
    id: string;
    stage: 'quarter' | 'semi' | 'final';
    status: 'completed' | 'live' | 'upcoming';
    p1: string;
    p1Score?: number;
    p2: string;
    p2Score?: number;
    liveLink?: boolean;
    battleId?: string;
    problemId?: string;
    scheduledTime?: string;
  }[] = [];

  upcomingMatches: {
    id: string;
    timeUTC: string;
    p1: string;
    p2: string;
    timeRemainingSeconds: number;
    battleId?: string;
    problemId?: string;
  }[] = [];

  // Admin schedule time inputs keyed by matchId
  adminScheduleInputs: Record<string, string> = {};

  isRegistered = false;
  isLoading = false;
  tournamentResults: any[] = [];

  // Live Watch Simulation modal
  showLiveModal = false;
  liveMatchInfo = '';
  liveConsoleLogs: string[] = [];
  private liveSimInterval: any;

  private countdownInterval: any;
  private subs: Subscription = new Subscription();

  constructor(
    private tournamentService: TournamentService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.currentUserId = this.currentUser.id || '';
      this.currentUserRating = this.currentUser.rating || 1200;
    }

    this.loadTournaments();

    // Setup SignalR Hub event subscriptions
    this.subs.add(
      this.tournamentService.matchStarted$.subscribe(data => {
        this.notificationService.showToast('Match started in your tournament!', 'info');
        
        // If this match is for the current user, redirect to coding arena immediately!
        const isUserPlayer = 
          (data.player1Id && data.player1Id.toLowerCase() === this.currentUserId.toLowerCase()) ||
          (data.player2Id && data.player2Id.toLowerCase() === this.currentUserId.toLowerCase());

        if (isUserPlayer) {
          const oppUsername = data.player1Id.toLowerCase() === this.currentUserId.toLowerCase() ? data.player2Username : data.player1Username;
          const oppRating = data.player1Id.toLowerCase() === this.currentUserId.toLowerCase() ? data.player2Elo : data.player1Elo;
          this.notificationService.showToast('⚔️ Your tournament match is starting! Teleporting to coding arena...', 'success', 5000);
          this.router.navigate(['/arena/battle'], {
            queryParams: {
              battleId: data.battleId,
              problemId: data.problemId,
              language: data.language || 'Python',
              opponentName: oppUsername,
              opponentElo: oppRating,
              mode: 'Tournament'
            }
          });
        } else {
          // Just refresh matches to show live status in the bracket
          this.loadTournamentData(this.selectedTournamentId);
        }
      })
    );

    this.subs.add(
      this.tournamentService.bracketUpdated$.subscribe(() => {
        this.notificationService.showToast('Tournament bracket updated!', 'info');
        this.loadTournamentData(this.selectedTournamentId);
      })
    );

    this.subs.add(
      this.tournamentService.tournamentCompleted$.subscribe(data => {
        this.notificationService.showToast(`Tournament Completed! Champion: ${data.winnerUsername}`, 'success', 6000);
        this.loadTournamentData(this.selectedTournamentId);
      })
    );

    // Countdown timers
    this.countdownInterval = setInterval(() => {
      this.upcomingMatches.forEach(m => {
        if (m.timeRemainingSeconds > 0) {
          m.timeRemainingSeconds--;
        }
      });
    }, 1000);
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
    clearInterval(this.countdownInterval);
    clearInterval(this.liveSimInterval);
    if (this.selectedTournamentId) {
      this.tournamentService.leaveHubConnection(this.selectedTournamentId);
    }
  }

  hasStage(stage: 'quarter' | 'semi' | 'final'): boolean {
    return this.bracketMatches.some(m => m.stage === stage);
  }

  get isAdmin(): boolean {
    return this.currentUser && this.currentUser.role === 'Admin';
  }

  manuallyStartMatch(matchId: string): void {
    if (!this.selectedTournamentId) return;
    this.isLoading = true;
    this.tournamentService.startMatch(this.selectedTournamentId, matchId).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.showToast('Match manually started!', 'success');
        this.loadTournamentData(this.selectedTournamentId);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to start match:', err);
        this.notificationService.showToast('Failed to start match. Check console.', 'error');
      }
    });
  }

  scheduleMatchTime(matchId: string): void {
    if (!this.selectedTournamentId) return;
    const raw = this.adminScheduleInputs[matchId];
    if (!raw) {
      this.notificationService.showToast('Please pick a date/time first.', 'error');
      return;
    }
    // datetime-local gives local time, convert to ISO UTC string
    const iso = new Date(raw).toISOString();
    this.tournamentService.scheduleMatch(this.selectedTournamentId, matchId, iso).subscribe({
      next: () => {
        this.notificationService.showToast('Match time updated!', 'success');
        this.loadTournamentData(this.selectedTournamentId);
      },
      error: (err) => {
        console.error('Failed to schedule match:', err);
        this.notificationService.showToast('Failed to update match time.', 'error');
      }
    });
  }

  loadTournaments(): void {
    this.isLoading = true;
    this.tournamentService.getTournaments().subscribe({
      next: (data) => {
        this.tournaments = data || [];
        if (this.tournaments.length > 0) {
          // Select the first tournament by default
          this.onTournamentSelect(this.tournaments[0].id);
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load tournaments:', err);
      }
    });
  }

  async onTournamentSelect(id: string): Promise<void> {
    if (this.selectedTournamentId) {
      await this.tournamentService.leaveHubConnection(this.selectedTournamentId);
    }
    this.selectedTournamentId = id;
    this.selectedTournament = this.tournaments.find(t => t.id === id) || null;
    
    // Connect to Hub for this tournament
    await this.tournamentService.initHubConnection(id);

    this.loadTournamentData(id);
  }

  loadTournamentData(id: string): void {
    this.isLoading = true;
    
    // Load detail
    this.tournamentService.getTournamentById(id).subscribe({
      next: (t) => {
        this.selectedTournament = t;
        // Check registration
        this.tournamentService.getTournamentParticipants(id).subscribe({
          next: (parts) => {
            this.participants = parts || [];
            this.isRegistered = this.participants.some(p => p.userId.toLowerCase() === this.currentUserId.toLowerCase());

            // Load matches
            this.tournamentService.getTournamentMatches(id).subscribe({
              next: (m) => {
                this.matches = m || [];
                this.buildBracketAndUpcoming();
                
                if (t.status === 'Completed') {
                  this.tournamentService.getTournamentResults(id).subscribe({
                    next: (res) => {
                      this.tournamentResults = res || [];
                      this.isLoading = false;
                    },
                    error: (err) => {
                      this.isLoading = false;
                      console.error('Failed to load tournament results:', err);
                    }
                  });
                } else {
                  this.tournamentResults = [];
                  this.isLoading = false;
                }
              },
              error: (err) => {
                this.isLoading = false;
                console.error('Failed to load tournament matches:', err);
              }
            });
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Failed to load tournament participants:', err);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load tournament by id:', err);
      }
    });
  }

  getPlayerUsername(playerId: string | undefined): string {
    if (!playerId) return 'TBD';
    const p = this.participants.find(part => part.userId.toLowerCase() === playerId.toLowerCase());
    return p ? p.username : 'Unknown';
  }

  buildBracketAndUpcoming(): void {
    this.bracketMatches = [];
    this.upcomingMatches = [];

    // Helper map
    const roundMap: Record<string, 'quarter' | 'semi' | 'final'> = {
      'QuarterFinal': 'quarter',
      'SemiFinal': 'semi',
      'Final': 'final',
      '0': 'quarter',
      '1': 'semi',
      '2': 'final'
    };

    const statusMap: Record<string, 'completed' | 'live' | 'upcoming'> = {
      'Upcoming': 'upcoming',
      'Scheduled': 'upcoming',
      'Live': 'live',
      'InProgress': 'live',
      'Completed': 'completed',
      'Cancelled': 'upcoming',
      '0': 'upcoming',
      '1': 'live',
      '2': 'completed',
      '3': 'upcoming'
    };

    this.matches.forEach(m => {
      const p1Name = m.player1Username || this.getPlayerUsername(m.player1Id);
      const p2Name = m.player2Username || this.getPlayerUsername(m.player2Id);

      const status = statusMap[m.status] || 'upcoming';
      const stage = roundMap[m.round] || 'quarter';

      const bm = {
        id: m.id,
        stage: stage,
        status: status,
        p1: p1Name,
        p1Score: m.status === 'Completed' || m.status.toString() === '2' ? (m.winnerId === m.player1Id ? 1 : 0) : undefined,
        p2: p2Name,
        p2Score: m.status === 'Completed' || m.status.toString() === '2' ? (m.winnerId === m.player2Id ? 1 : 0) : undefined,
        liveLink: status === 'live',
        battleId: m.battleId,
        problemId: m.assignedProblemId,
        scheduledTime: m.scheduledTime
      };
      this.bracketMatches.push(bm);

      if (status === 'live' && m.battleId && this.currentUserId) {
        const isUserPlayer =
          (m.player1Id && m.player1Id.toLowerCase() === this.currentUserId.toLowerCase()) ||
          (m.player2Id && m.player2Id.toLowerCase() === this.currentUserId.toLowerCase());

        if (isUserPlayer) {
          const oppUsername = m.player1Id?.toLowerCase() === this.currentUserId.toLowerCase() ? p2Name : p1Name;
          this.notificationService.showToast('⚔️ Your tournament match is live! Reconnecting to coding arena...', 'success', 5000);
          this.router.navigate(['/arena/battle'], {
            queryParams: {
              battleId: m.battleId,
              problemId: m.assignedProblemId,
              language: 'Python',
              opponentName: oppUsername,
              opponentElo: 1200,
              mode: 'Tournament'
            }
          });
        }
      }

      if (status === 'upcoming' && m.scheduledTime) {
        let timeStr = m.scheduledTime;
        if (typeof timeStr === 'string' && !timeStr.endsWith('Z') && !timeStr.includes('+') && !timeStr.includes('-')) {
          timeStr += 'Z';
        }
        const scheduled = new Date(timeStr);
        const diffMs = scheduled.getTime() - Date.now();
        const diffSec = Math.max(0, Math.round(diffMs / 1000));

        const datePart = scheduled.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const timePart = scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

        this.upcomingMatches.push({
          id: m.id,
          timeUTC: `${datePart}, ${timePart}`,
          p1: p1Name,
          p2: p2Name,
          timeRemainingSeconds: diffSec,
          battleId: m.battleId,
          problemId: m.assignedProblemId
        });
      }
    });
  }

  register(): void {
    if (!this.selectedTournament) return;
    this.isLoading = true;
    this.tournamentService.register(this.selectedTournament.id).subscribe({
      next: () => {
        this.notificationService.showToast('Successfully registered for tournament!', 'success');
        this.loadTournamentData(this.selectedTournament!.id);
      },
      error: (err) => {
        this.isLoading = false;
        let errMsg = 'Registration failed.';
        if (err.error) {
          if (err.error.detail) {
            errMsg = err.error.detail;
          } else if (err.error.message) {
            errMsg = err.error.message;
          } else if (err.error.errors && err.error.errors.length > 0) {
            errMsg = err.error.errors.join(' ');
          }
        }
        this.notificationService.showToast(errMsg, 'error', 5000);
      }
    });
  }

  unregister(): void {
    if (!this.selectedTournament) return;
    this.isLoading = true;
    this.tournamentService.unregister(this.selectedTournament.id).subscribe({
      next: () => {
        this.notificationService.showToast('Successfully unregistered from tournament.', 'success');
        this.loadTournamentData(this.selectedTournament!.id);
      },
      error: (err) => {
        this.isLoading = false;
        let errMsg = 'Failed to unregister.';
        if (err.error) {
          if (err.error.detail) {
            errMsg = err.error.detail;
          } else if (err.error.message) {
            errMsg = err.error.message;
          }
        }
        this.notificationService.showToast(errMsg, 'error');
      }
    });
  }

  getDisplayTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  watchLiveMatch(match: any): void {
    // Redirection to the coding arena in view-only or spectate mode if battleId is present
    if (match.battleId && match.problemId) {
      this.router.navigate(['/arena/battle'], {
        queryParams: {
          battleId: match.battleId,
          problemId: match.problemId,
          opponentName: match.p2,
          spectate: 'true'
        }
      });
    } else {
      this.liveMatchInfo = `${match.p1} vs ${match.p2}`;
      this.liveConsoleLogs = [
        `[00:01] Match initiated between ${match.p1} and ${match.p2}.`,
        `[00:15] Problem loaded.`,
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
}
