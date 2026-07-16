import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService, Tournament, TournamentMatch } from '../../../core/services/tournament.service';
import { NotificationService } from '../../../shared/notifications/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tournament-management',
  templateUrl: './tournament-management.component.html',
  styleUrls: ['./tournament-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TournamentManagementComponent implements OnInit, OnDestroy {
  tournaments: Tournament[] = [];
  isLoading = false;
  private subscription = new Subscription();

  // Roster panel
  expandedTournaments: Set<string> = new Set();
  rosterMap: Record<string, any[] | undefined> = {};
  rosterLoading: Record<string, boolean> = {};

  // Match panel
  expandedMatchPanels: Set<string> = new Set();
  matchesMap: Record<string, TournamentMatch[] | undefined> = {};
  matchesLoading: Record<string, boolean> = {};
  matchScheduleInputs: Record<string, string> = {};
  matchDateInputs: Record<string, string> = {};
  matchHourInputs: Record<string, string> = {};
  matchMinuteInputs: Record<string, string> = {};
  matchAmPmInputs: Record<string, string> = {};

  hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1));
  minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  ampmList = ['AM', 'PM'];

  showCreateModal = false;
  newTournament = {
    title: '',
    description: '',
    maxParticipants: 64,
    startDate: '',
    endDate: '',
    minRating: null as number | null,
    maxRating: null as number | null,
    language: ''
  };

  searchQuery = '';

  get filteredTournaments(): Tournament[] {
    if (!this.searchQuery) return this.tournaments;
    return this.tournaments.filter(t => t.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
  }

  constructor(
    private tournamentService: TournamentService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadTournaments();
    this.tournamentService.initAdminHubConnection();

    this.subscription.add(
      this.tournamentService.tournamentRegistrantIncremented$.subscribe((data) => {
        const tournament = this.tournaments.find(t => t.id.toLowerCase() === data.tournamentId.toLowerCase());
        if (tournament) {
          tournament.participantCount = data.participantCount;
        }
      })
    );

    this.subscription.add(
      this.tournamentService.matchCompleted$.subscribe((data) => {
        if (this.expandedMatchPanels.has(data.tournamentId)) {
          this.loadMatches(data.tournamentId);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.tournamentService.leaveAdminHubConnection();
  }

  loadTournaments(): void {
    this.isLoading = true;
    this.tournamentService.getTournaments().subscribe({
      next: (data) => {
        this.tournaments = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load tournaments:', err);
        this.notificationService.showToast('Failed to load tournaments.', 'error');
      }
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    this.newTournament = {
      title: '',
      description: '',
      maxParticipants: 64,
      startDate: today.toISOString().substring(0, 10),
      endDate: tomorrow.toISOString().substring(0, 10),
      minRating: null,
      maxRating: null,
      language: ''
    };
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createTournament(): void {
    if (!this.newTournament.title || !this.newTournament.startDate || !this.newTournament.endDate) {
      this.notificationService.showToast('Please fill out all required fields.', 'warning');
      return;
    }
    this.isLoading = true;
    const payload = {
      title: this.newTournament.title,
      description: this.newTournament.description || 'CodeClash Arena Tournament',
      startDate: new Date(this.newTournament.startDate).toISOString(),
      endDate: new Date(this.newTournament.endDate).toISOString(),
      maxParticipants: Number(this.newTournament.maxParticipants),
      minRating: this.newTournament.minRating ? Number(this.newTournament.minRating) : null,
      maxRating: this.newTournament.maxRating ? Number(this.newTournament.maxRating) : null,
      language: this.newTournament.language || null
    };
    this.tournamentService.createTournament(payload).subscribe({
      next: () => {
        this.notificationService.showToast('Tournament created successfully!', 'success');
        this.loadTournaments();
        this.closeCreateModal();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Create tournament failed:', err);
        const errMsg = err?.error?.message || 'Failed to create tournament.';
        this.notificationService.showToast(errMsg, 'error');
      }
    });
  }

  publishTournament(t: Tournament): void {
    this.isLoading = true;
    this.tournamentService.publishTournament(t.id).subscribe({
      next: () => { this.notificationService.showToast('Tournament published!', 'success'); this.loadTournaments(); },
      error: () => { this.isLoading = false; this.notificationService.showToast('Failed to publish tournament.', 'error'); }
    });
  }

  openRegistration(t: Tournament): void {
    this.isLoading = true;
    this.tournamentService.openRegistration(t.id).subscribe({
      next: () => { this.notificationService.showToast('Registration opened!', 'success'); this.loadTournaments(); },
      error: () => { this.isLoading = false; this.notificationService.showToast('Failed to open registration.', 'error'); }
    });
  }

  cancelTournament(t: Tournament): void {
    if (!confirm(`Cancel "${t.title}"?`)) return;
    this.isLoading = true;
    this.tournamentService.cancelTournament(t.id).subscribe({
      next: () => { this.notificationService.showToast('Tournament cancelled.', 'info'); this.loadTournaments(); },
      error: () => { this.isLoading = false; this.notificationService.showToast('Failed to cancel tournament.', 'error'); }
    });
  }

  generateBracket(t: Tournament): void {
    this.isLoading = true;
    this.tournamentService.generateBracket(t.id).subscribe({
      next: () => { this.notificationService.showToast('Bracket generated!', 'success'); this.loadTournaments(); },
      error: (err) => {
        this.isLoading = false;
        const errMsg = err?.error?.message || 'Failed to generate bracket.';
        this.notificationService.showToast(errMsg, 'error');
      }
    });
  }

  deleteTournament(t: Tournament): void {
    if (!confirm(`Delete "${t.title}"?`)) return;
    this.isLoading = true;
    this.tournamentService.deleteTournament(t.id).subscribe({
      next: () => { this.notificationService.showToast('Tournament deleted.', 'success'); this.loadTournaments(); },
      error: () => { this.isLoading = false; this.notificationService.showToast('Failed to delete tournament.', 'error'); }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Live': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'RegistrationOpen': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Completed': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'Draft': return 'bg-slate-700/50 text-slate-300 border border-slate-600';
      case 'Cancelled': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    }
  }

  getMatchStatusClass(status: any): string {
    const statusStr = this.getMatchStatusString(status);
    switch (statusStr) {
      case 'InProgress': return 'text-green-400 bg-green-500/10 border border-green-500/30';
      case 'Completed': return 'text-purple-400 bg-purple-500/10 border border-purple-500/30';
      case 'Scheduled': return 'text-blue-400 bg-blue-500/10 border border-blue-500/30';
      default: return 'text-slate-700 border border-slate-600';
    }
  }

  getMatchStatusString(status: any): 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' {
    if (status === 0 || status === '0' || status === 'Scheduled') return 'Scheduled';
    if (status === 1 || status === '1' || status === 'InProgress') return 'InProgress';
    if (status === 2 || status === '2' || status === 'Completed') return 'Completed';
    return 'Cancelled';
  }

  getMatchRoundString(round: any): string {
    if (round === 0 || round === '0' || round === 'QuarterFinal') return 'Quarter Final';
    if (round === 1 || round === '1' || round === 'SemiFinal') return 'Semi Final';
    if (round === 2 || round === '2' || round === 'Final') return 'Final';
    return String(round);
  }

  // ── Roster panel ──
  isRosterOpen(id: string): boolean { return this.expandedTournaments.has(id); }

  toggleRoster(t: Tournament): void {
    if (this.expandedTournaments.has(t.id)) {
      this.expandedTournaments.delete(t.id);
    } else {
      this.expandedTournaments.add(t.id);
      this.loadRoster(t.id);
    }
  }

  loadRoster(id: string): void {
    this.rosterLoading[id] = true;
    this.tournamentService.getTournamentParticipants(id).subscribe({
      next: (data) => { this.rosterMap[id] = data || []; this.rosterLoading[id] = false; },
      error: (err) => {
        this.rosterLoading[id] = false;
        this.notificationService.showToast('Failed to load roster.', 'error');
      }
    });
  }

  closeRegistrationEarly(t: Tournament): void {
    if (!confirm(`Close registration for "${t.title}"?`)) return;
    this.isLoading = true;
    this.tournamentService.closeRegistration(t.id).subscribe({
      next: () => {
        this.notificationService.showToast('Registration closed.', 'info');
        this.loadTournaments();
        this.loadRoster(t.id);
      },
      error: () => { this.isLoading = false; this.notificationService.showToast('Failed to close registration.', 'error'); }
    });
  }

  // ── Match panel ──
  isMatchPanelOpen(id: string): boolean { return this.expandedMatchPanels.has(id); }

  toggleMatchPanel(t: Tournament): void {
    if (this.expandedMatchPanels.has(t.id)) {
      this.expandedMatchPanels.delete(t.id);
    } else {
      this.expandedMatchPanels.add(t.id);
      this.loadMatches(t.id);
    }
  }

  loadMatches(tournamentId: string): void {
    this.matchesLoading[tournamentId] = true;

    // Pre-load roster if not loaded yet so we can resolve usernames
    if (!this.rosterMap[tournamentId]) {
      this.tournamentService.getTournamentParticipants(tournamentId).subscribe({
        next: (parts) => { this.rosterMap[tournamentId] = parts || []; },
        error: (err) => console.error('Failed to pre-load roster for match usernames:', err)
      });
    }

    this.tournamentService.getTournamentMatches(tournamentId).subscribe({
      next: (data) => {
        const matches = data || [];
        console.log('Loaded matches from backend:', matches);
        this.matchesMap[tournamentId] = matches;

        // Pre-populate custom date, hour, minute, and AM/PM select options
        matches.forEach(m => {
          if (m.scheduledTime) {
            let timeStr = m.scheduledTime;
            if (typeof timeStr === 'string' && !timeStr.endsWith('Z') && !timeStr.includes('+') && !timeStr.includes('-')) {
              timeStr += 'Z';
            }
            const date = new Date(timeStr);
            if (!isNaN(date.getTime()) && date.getFullYear() > 1970) {
              const pad = (n: number) => n.toString().padStart(2, '0');
              const yyyy = date.getFullYear();
              const MM = pad(date.getMonth() + 1);
              const dd = pad(date.getDate());
              this.matchDateInputs[m.id] = `${yyyy}-${MM}-${dd}`;

              const hours = date.getHours();
              const ampm = hours >= 12 ? 'PM' : 'AM';
              const hour12 = hours % 12 === 0 ? 12 : hours % 12;
              this.matchHourInputs[m.id] = String(hour12);
              this.matchMinuteInputs[m.id] = pad(date.getMinutes());
              this.matchAmPmInputs[m.id] = ampm;
            } else {
              this.matchDateInputs[m.id] = '';
              this.matchHourInputs[m.id] = '12';
              this.matchMinuteInputs[m.id] = '00';
              this.matchAmPmInputs[m.id] = 'AM';
            }
          } else {
            this.matchDateInputs[m.id] = '';
            this.matchHourInputs[m.id] = '12';
            this.matchMinuteInputs[m.id] = '00';
            this.matchAmPmInputs[m.id] = 'AM';
          }
        });

        this.matchesLoading[tournamentId] = false;
      },
      error: (err) => {
        this.matchesLoading[tournamentId] = false;
        this.notificationService.showToast('Failed to load matches.', 'error');
      }
    });
  }

  formatDateForInput(dateStr: string | undefined): string {
    if (!dateStr) return '';
    let timeStr = dateStr;
    if (typeof timeStr === 'string' && !timeStr.endsWith('Z') && !timeStr.includes('+') && !timeStr.includes('-')) {
      timeStr += 'Z';
    }
    const date = new Date(timeStr);
    if (isNaN(date.getTime()) || date.getFullYear() <= 1970) return '';

    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());

    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  }

  scheduleMatch(tournamentId: string, matchId: string): void {
    const dateStr = this.matchDateInputs[matchId];
    if (!dateStr) { this.notificationService.showToast('Please select a date.', 'warning'); return; }

    const hourStr = this.matchHourInputs[matchId] || '12';
    const minStr = this.matchMinuteInputs[matchId] || '00';
    const ampmStr = this.matchAmPmInputs[matchId] || 'AM';

    const parts = dateStr.split('-');
    if (parts.length !== 3) { this.notificationService.showToast('Invalid date format.', 'warning'); return; }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    if (ampmStr === 'PM' && hour < 12) {
      hour += 12;
    } else if (ampmStr === 'AM' && hour === 12) {
      hour = 0;
    }

    const localDate = new Date(year, month, day, hour, minute);
    if (isNaN(localDate.getTime())) {
      this.notificationService.showToast('Invalid date or time selected.', 'error');
      return;
    }

    const iso = localDate.toISOString();
    this.tournamentService.scheduleMatch(tournamentId, matchId, iso).subscribe({
      next: () => { this.notificationService.showToast('Match time saved!', 'success'); this.loadMatches(tournamentId); },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.detail || 'Failed to update match time.';
        this.notificationService.showToast(msg, 'error');
      }
    });
  }

  forceStartMatch(tournamentId: string, matchId: string): void {
    if (!confirm('Force start this match now?')) return;
    this.tournamentService.startMatch(tournamentId, matchId).subscribe({
      next: () => { this.notificationService.showToast('Match started!', 'success'); this.loadMatches(tournamentId); },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.detail || 'Failed to start match.';
        this.notificationService.showToast(msg, 'error');
      }
    });
  }

  getPlayerUsername(tournamentId: string, playerId: string | undefined): string {
    if (!playerId) return 'TBD';
    const participants = this.rosterMap[tournamentId] || [];
    const p = participants.find(part => part.userId.toLowerCase() === playerId.toLowerCase());
    return p ? p.username : (playerId.substring(0, 8));
  }

  getMatchPlayerLabel(tournamentId: string, match: TournamentMatch): string {
    const p1 = match.player1Username || this.getPlayerUsername(tournamentId, match.player1Id);
    const p2 = match.player2Username || this.getPlayerUsername(tournamentId, match.player2Id);
    return `${p1} vs ${p2}`;
  }

  canForceStart(tournamentId: string, match: any): boolean {
    if (!match.player1Id || !match.player2Id) return false;

    const matches = this.matchesMap[tournamentId] || [];

    if (String(match.round) === 'Final' || String(match.round) === '2') {
      const unfinishedSemi = matches.some(m =>
        (String(m.round) === 'SemiFinal' || String(m.round) === '1') &&
        this.getMatchStatusString(m.status) !== 'Completed'
      );
      if (unfinishedSemi) return false;
    } else if (String(match.round) === 'SemiFinal' || String(match.round) === '1') {
      const unfinishedQuarter = matches.some(m =>
        (String(m.round) === 'QuarterFinal' || String(m.round) === '0') &&
        this.getMatchStatusString(m.status) !== 'Completed'
      );
      if (unfinishedQuarter) return false;
    }

    return true;
  }
}
