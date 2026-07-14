import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MatchmakingService {
  private hubConnection: signalR.HubConnection | null = null;

  opponentFound$ = new Subject<any>();
  queueLeft$ = new Subject<void>();

  constructor(private http: HttpClient, private authService: AuthService) {}

  async initConnection(): Promise<void> {
    // Always tear down old connection cleanly before creating a new one
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (_) {}
      this.hubConnection = null;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.backendUrl}/hubs/matchmaking`, {
        // Use a factory so a fresh token is fetched on every reconnect attempt
        accessTokenFactory: () => this.authService.getAccessToken() || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.on('OpponentFound', (data) => {
      console.log('[MM] OpponentFound received:', data);
      this.opponentFound$.next(data);
    });

    this.hubConnection.on('QueueLeft', () => {
      console.log('[MM] QueueLeft received.');
      this.queueLeft$.next();
    });

    this.hubConnection.onreconnecting((error) => {
      console.warn('[MM] SignalR reconnecting...', error);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('[MM] SignalR reconnected. ConnectionId:', connectionId);
    });

    this.hubConnection.onclose((error) => {
      console.warn('[MM] SignalR connection closed.', error);
    });

    await this.hubConnection.start();
    console.log('[MM] SignalR connected. State:', this.hubConnection.state);
  }

  joinQueue(preferredLanguage: string, difficulty: string): void {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      console.log(`[MM] Invoking JoinQueue(${preferredLanguage}, ${difficulty})`);
      this.hubConnection.invoke('JoinQueue', preferredLanguage, difficulty)
        .then(() => console.log('[MM] JoinQueue invoked successfully.'))
        .catch(err => console.error('[MM] JoinQueue error:', err));
    } else {
      console.error('[MM] Cannot JoinQueue — hub not connected. State:', this.hubConnection?.state);
    }
  }

  leaveQueue(): void {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('LeaveQueue').catch(err => console.error('[MM] LeaveQueue error:', err));
    }
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (_) {}
      this.hubConnection = null;
    }
  }

  getQueueTicket(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/matchmaking/queue`, {});
  }
}
