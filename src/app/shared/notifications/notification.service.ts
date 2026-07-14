import { Injectable, OnDestroy } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, Subscription, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);

  private toastsSubject = new BehaviorSubject<Toast[]>([]);

  notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();
  toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  unreadCount$: Observable<number> = this.notifications$.pipe(
    map(notifs => notifs.filter(n => !n.read).length)
  );

  // Custom Duel Events
  duelInvitationReceived$ = new Subject<any>();
  invitationAccepted$ = new Subject<any>();
  invitationDeclined$ = new Subject<any>();
  playerJoined$ = new Subject<any>();
  playerReady$ = new Subject<any>();
  duelStarted$ = new Subject<any>();

  private hubConnection: signalR.HubConnection | null = null;
  private connectionInterval: any;
  private activeRoomId: string | null = null; // track joined room for auto-rejoin on reconnect

  constructor(private authService: AuthService, private http: HttpClient) {
    this.startSignalRConnection();
  }

  ngOnDestroy(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
    if (this.connectionInterval) {
      clearInterval(this.connectionInterval);
    }
  }

  private startSignalRConnection(): void {
    // Only connect if user is logged in
    const token = this.authService.getAccessToken();
    if (!token) {
      // Periodically check if token becomes available (e.g. after login)
      this.connectionInterval = setTimeout(() => this.startSignalRConnection(), 5000);
      return;
    }

    // Load initial notifications
    this.loadNotifications(token);

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.backendUrl}/hubs/notifications`, {
        accessTokenFactory: () => this.authService.getAccessToken() || ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR Notification Hub connected.'))
      .catch(err => console.error('Error while starting connection: ' + err));

    // Re-join the room group if the connection auto-reconnects (new ConnectionId loses all groups)
    this.hubConnection.onreconnected(() => {
      console.log('SignalR reconnected — rejoining room group if active.');
      if (this.activeRoomId && this.hubConnection) {
        this.hubConnection.invoke('JoinRoom', this.activeRoomId)
          .catch(err => console.error('Failed to rejoin room on reconnect:', err));
      }
    });

    this.hubConnection.on('ReceiveNotification', (data: { title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' }) => {
      this.addNotification(data.title, data.message, data.type);
      this.showToast(`New Notification: ${data.title}`, data.type);
    });

    this.hubConnection.on('ForceLogout', () => {
      this.authService.logout();
      window.location.href = '/login?error=blocked';
    });

    this.hubConnection.on('DuelInvitationReceived', (data: any) => {
      this.duelInvitationReceived$.next(data);
    });

    this.hubConnection.on('InvitationAccepted', (data: any) => {
      this.invitationAccepted$.next(data);
    });

    this.hubConnection.on('InvitationDeclined', (data: any) => {
      this.invitationDeclined$.next(data);
    });

    this.hubConnection.on('PlayerJoined', (userId: string) => {
      this.playerJoined$.next(userId);
    });

    this.hubConnection.on('PlayerReady', (data: any) => {
      this.playerReady$.next(data);
    });

    this.hubConnection.on('DuelStarted', (data: any) => {
      this.duelStarted$.next(data);
    });
  }

  joinRoomGroup(roomId: string): void {
    this.activeRoomId = roomId;
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('JoinRoom', roomId)
        .catch(err => console.error('Error joining room group:', err));
    }
  }

  leaveRoomGroup(roomId: string): void {
    if (this.activeRoomId === roomId) {
      this.activeRoomId = null;
    }
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('LeaveRoom', roomId)
        .catch(err => console.error('Error leaving room group:', err));
    }
  }

  public getHubConnection(): signalR.HubConnection | null {
    return this.hubConnection;
  }


  private loadNotifications(token: string): void {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    this.http.get<any>(`${environment.apiUrl}/notifications`, { headers })
      .subscribe({
        next: (res) => {
          if (res) {
            this.notificationsSubject.next(res);
          }
        },
        error: (err) => console.error('Failed to load notifications', err)
      });
  }

  // ─── Notification Management ────────────────────────────────────────────────
  addNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const newNotif: AppNotification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      time: new Date(),
      read: false,
      type
    };

    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotif, ...current]);
  }

  markAsRead(id: string): void {
    const token = this.authService.getAccessToken();
    if (!token) return;

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.put(`${environment.apiUrl}/notifications/${id}/read`, {}, { headers })
      .subscribe({
        next: () => {
          const updated = this.notificationsSubject.value.map(n => 
            n.id === id ? { ...n, read: true } : n
          );
          this.notificationsSubject.next(updated);
        },
        error: (err) => console.error('Failed to mark as read', err)
      });
  }

  markAllAsRead(): void {
    const token = this.authService.getAccessToken();
    if (!token) return;

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.put(`${environment.apiUrl}/notifications/read-all`, {}, { headers })
      .subscribe({
        next: () => {
          const updated = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
          this.notificationsSubject.next(updated);
        },
        error: (err) => console.error('Failed to mark all as read', err)
      });
  }

  clearNotification(id: string): void {
    const filtered = this.notificationsSubject.value.filter(n => n.id !== id);
    this.notificationsSubject.next(filtered);
  }

  clearAllNotifications(): void {
    this.notificationsSubject.next([]);
  }

  // ─── Toast Management ───────────────────────────────────────────────────────
  showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000): void {
    const newToast: Toast = {
      id: `toast-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      duration
    };

    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      this.removeToast(newToast.id);
    }, duration);
  }

  removeToast(id: string): void {
    const filtered = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(filtered);
  }
}
