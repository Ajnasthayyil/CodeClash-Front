import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';

export interface Tournament {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  minRating?: number;
  maxRating?: number;
  status: 'Draft' | 'Published' | 'RegistrationOpen' | 'RegistrationClosed' | 'Live' | 'Completed' | 'Cancelled';
  participantCount: number;
  createdAt: string;
  updatedAt: string;
  registrations: any[];
  language?: string;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  player1Id?: string;
  player1Username?: string;
  player2Id?: string;
  player2Username?: string;
  winnerId?: string;
  status: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
  round: 'QuarterFinal' | 'SemiFinal' | 'Final';
  battleId?: string;
  assignedProblemId?: string;
  scheduledTime: string;
  startTime?: string;
  endTime?: string;
}

export interface TournamentParticipant {
  userId: string;
  username: string;
  fullName: string;
  profileImageUrl?: string;
  registeredAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private hubConnection: signalR.HubConnection | null = null;

  matchStarted$ = new Subject<any>();
  bracketUpdated$ = new Subject<void>();
  tournamentCompleted$ = new Subject<any>();
  tournamentRegistrantIncremented$ = new Subject<{ tournamentId: string, participantCount: number }>();
  matchCompleted$ = new Subject<{ tournamentId: string, matchId: string, winnerId: string }>();

  constructor(private http: HttpClient, private authService: AuthService) {}

  // API Methods
  getTournaments(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(`${environment.apiUrl}/tournaments`);
  }

  getTournamentById(id: string): Observable<Tournament> {
    return this.http.get<Tournament>(`${environment.apiUrl}/tournaments/${id}`);
  }

  getTournamentMatches(id: string): Observable<TournamentMatch[]> {
    return this.http.get<TournamentMatch[]>(`${environment.apiUrl}/tournaments/${id}/matches`);
  }

  getTournamentParticipants(id: string): Observable<TournamentParticipant[]> {
    return this.http.get<TournamentParticipant[]>(`${environment.apiUrl}/tournaments/${id}/participants`);
  }

  getTournamentResults(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/tournaments/${id}/results`);
  }

  register(id: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/tournaments/${id}/register`, {});
  }

  unregister(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/tournaments/${id}/unregister`);
  }

  createTournament(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/tournaments`, data);
  }

  updateTournament(id: string, data: any): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/tournaments/${id}`, data);
  }

  deleteTournament(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/tournaments/${id}`);
  }

  publishTournament(id: string): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/tournaments/${id}/publish`, {});
  }

  openRegistration(id: string): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/tournaments/${id}/open-registration`, {});
  }

  closeRegistration(id: string): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/tournaments/${id}/close-registration`, {});
  }

  cancelTournament(id: string): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/tournaments/${id}/cancel`, {});
  }

  generateBracket(id: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/tournaments/${id}/generate-bracket`, {});
  }

  startMatch(tournamentId: string, matchId: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/tournaments/${tournamentId}/matches/${matchId}/start`, {});
  }

  scheduleMatch(tournamentId: string, matchId: string, scheduledTime: string): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/tournaments/${tournamentId}/matches/${matchId}/schedule`, { scheduledTime });
  }

  // SignalR Methods
  async initHubConnection(tournamentId: string): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (_) {}
      this.hubConnection = null;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.backendUrl}/hubs/tournament`, {
        accessTokenFactory: () => this.authService.getAccessToken() || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.on('MatchStarted', (data) => {
      console.log('[TournamentHub] MatchStarted:', data);
      this.matchStarted$.next(data);
    });

    this.hubConnection.on('BracketUpdated', (data) => {
      console.log('[TournamentHub] BracketUpdated:', data);
      this.bracketUpdated$.next();
    });

    this.hubConnection.on('TournamentCompleted', (data) => {
      console.log('[TournamentHub] TournamentCompleted:', data);
      this.tournamentCompleted$.next(data);
    });

    this.hubConnection.on('MatchCompleted', (data) => {
      console.log('[TournamentHub] MatchCompleted:', data);
      this.matchCompleted$.next(data);
    });

    await this.hubConnection.start();
    console.log('[TournamentHub] SignalR connected. State:', this.hubConnection.state);

    await this.hubConnection.invoke('JoinTournament', tournamentId);
    console.log('[TournamentHub] Joined tournament room:', tournamentId);
  }

  async leaveHubConnection(tournamentId: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('LeaveTournament', tournamentId);
      } catch (_) {}
    }
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (_) {}
      this.hubConnection = null;
    }
  }

  async initAdminHubConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (_) {}
      this.hubConnection = null;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.backendUrl}/hubs/tournament`, {
        accessTokenFactory: () => this.authService.getAccessToken() || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.on('TournamentRegistrantIncremented', (data) => {
      console.log('[TournamentHub] TournamentRegistrantIncremented:', data);
      this.tournamentRegistrantIncremented$.next(data);
    });

    this.hubConnection.on('MatchCompleted', (data) => {
      console.log('[TournamentHub] MatchCompleted:', data);
      this.matchCompleted$.next(data);
    });

    await this.hubConnection.start();
    console.log('[TournamentHub] Admin SignalR connected. State:', this.hubConnection.state);

    await this.hubConnection.invoke('JoinAdminDashboard');
    console.log('[TournamentHub] Joined Admin Dashboard group.');
  }

  async leaveAdminHubConnection(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('LeaveAdminDashboard');
      } catch (_) {}
    }
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (_) {}
      this.hubConnection = null;
    }
  }
}
