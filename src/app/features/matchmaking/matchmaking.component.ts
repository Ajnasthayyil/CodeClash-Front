import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../shared/notifications/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface UserSearchResult {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
}

@Component({
  selector: 'app-matchmaking',
  templateUrl: './matchmaking.component.html',
  styleUrls: ['./matchmaking.component.scss']
})
export class MatchmakingComponent implements OnInit, OnDestroy {
  // Ranked Duel Queue States
  queueStatus: 'idle' | 'searching' | 'matched' = 'idle';
  queueSeconds = 0;
  private queueInterval: any;

  // Opponent matching settings
  selectedDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  selectedLanguage = 'Python';
  languages: string[] = ['Python', 'JavaScript', 'TypeScript', 'C++', 'Java', 'Go', 'Rust'];
  userElo = 1200;
  userInitial = 'U';
  currentUser: any = null;

  // Custom Friend Room States
  friendlyRoomId = ''; // Holds Guid Room ID
  friendlyRoomCode = ''; // Holds 6-character room code
  friendlyUrl = '';
  linkCopied = false;

  // Friend Search / Invite States
  searchQuery = '';
  searchResults: UserSearchResult[] = [];
  lobbyStatus: 'idle' | 'invited' | 'lobby' | 'declined' = 'idle';
  invitedFriend: { id: string; username: string } | null = null;
  hostUser: { id: string; username: string } | null = null;

  // Ready States
  isHostReady = false;
  isFriendReady = false;
  amIReady = false;

  // Incoming duel invitation modal
  incomingInvitation: { roomId: string; roomCode: string; hostUsername: string } | null = null;

  // Popup visibility flags
  showSearchPopup = false;
  showLobbyPopup = false;

  private signalRListeners: { event: string; handler: (...args: any[]) => void }[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.userElo = this.currentUser.rating || 1200;
      this.userInitial = this.currentUser.initials || 'U';
    }

    this.setupSignalRListeners();

    // Check if routed with a roomId query param
    this.route.queryParams.subscribe(params => {
      const roomParam = params['room'];
      if (roomParam) {
        this.joinExistingRoom(roomParam);
      }
    });
  }

  ngOnDestroy(): void {
    this.cancelSearch();
    this.cleanupSignalRListeners();
  }

  // ─── SignalR Events ────────────────────────────────────────────────────────
  private setupSignalRListeners(): void {
    const hub = this.notificationService.getHubConnection();
    if (!hub) {
      setTimeout(() => this.setupSignalRListeners(), 1000);
      return;
    }

    const listeners = [
      {
        event: 'DuelInvitationReceived',
        handler: (data: any) => {
          this.incomingInvitation = {
            roomId: data.roomId,
            roomCode: data.roomCode,
            hostUsername: data.hostUsername
          };
          this.notificationService.showToast(`Duel Invitation from ${data.hostUsername}!`, 'info', 6000);
        }
      },
      {
        event: 'InvitationAccepted',
        handler: (data: any) => {
          if (data.roomId === this.friendlyRoomId) {
            this.lobbyStatus = 'lobby';
            this.invitedFriend = { id: data.friendUserId, username: data.friendUsername };
            this.showLobbyPopup = true; // Auto-open lobby when friend joins
            this.notificationService.showToast(`${data.friendUsername} joined the lobby!`, 'success', 3000);
          }
        }
      },
      {
        event: 'InvitationDeclined',
        handler: (data: any) => {
          if (data.roomId === this.friendlyRoomId) {
            this.lobbyStatus = 'declined';
            this.notificationService.showToast('Your duel invitation was declined.', 'warning', 4000);
            setTimeout(() => { this.resetCustomRoom(); }, 3000);
          }
        }
      },
      {
        event: 'PlayerReady',
        handler: (data: any) => {
          if (data.roomId === this.friendlyRoomId) {
            if (data.userId === this.currentUser?.id) {
              this.amIReady = data.isReady;
            }
            // Update host / friend ready states
            const isHost = this.currentUser?.id === this.hostUser?.id;
            if (data.userId === this.hostUser?.id) {
              this.isHostReady = data.isReady;
            } else {
              this.isFriendReady = data.isReady;
            }
          }
        }
      },
      {
        event: 'DuelStarted',
        handler: (data: any) => {
          if (data.roomId === this.friendlyRoomId) {
            this.notificationService.showToast('Duel is starting! Entering arena...', 'success', 2000);
            setTimeout(() => {
              this.router.navigate(['/arena/battle'], { queryParams: { room: this.friendlyRoomId } });
            }, 1500);
          }
        }
      }
    ];

    listeners.forEach(l => {
      hub.on(l.event, l.handler);
      this.signalRListeners.push(l);
    });
  }

  private cleanupSignalRListeners(): void {
    const hub = this.notificationService.getHubConnection();
    if (hub) {
      this.signalRListeners.forEach(l => {
        hub.off(l.event, l.handler);
      });
    }
    this.signalRListeners = [];
  }

  // ─── Ranked Queue ──────────────────────────────────────────────────────────
  setDifficulty(diff: 'easy' | 'medium' | 'hard'): void {
    this.selectedDifficulty = diff;
    this.notificationService.showToast(`Difficulty filter set to ${diff.toUpperCase()}`, 'info', 2000);
  }

  onLanguageChange(lang: string): void {
    this.selectedLanguage = lang;
    this.notificationService.showToast(`Language filter set to ${lang}`, 'info', 2000);
  }

  startSearch(): void {
    if (this.queueStatus !== 'idle') return;
    this.queueStatus = 'searching';
    this.queueSeconds = 0;
    this.notificationService.showToast('Matchmaking search started...', 'info', 2500);

    this.queueInterval = setInterval(() => {
      this.queueSeconds++;

      // Simulate match found after 15 seconds
      if (this.queueSeconds >= 15) {
        clearInterval(this.queueInterval);
        this.queueStatus = 'matched';

        this.notificationService.showToast('Match found! Teleporting to arena...', 'success', 3000);
        this.notificationService.addNotification(
          'Match Found! ⚔️',
          `Opponent: ByteWizard (1766 ELO) matched for ${this.selectedLanguage} (${this.selectedDifficulty.toUpperCase()}).`,
          'success'
        );

        setTimeout(() => {
          this.router.navigate(['/arena/battle']);
        }, 2000);
      }
    }, 1000);
  }

  cancelSearch(): void {
    if (this.queueStatus === 'searching') {
      this.notificationService.showToast('Matchmaking search cancelled.', 'warning', 2500);
    }
    if (this.queueInterval) {
      clearInterval(this.queueInterval);
    }
    this.queueStatus = 'idle';
    this.queueSeconds = 0;
  }

  // ─── Friendly Duel Invitation ──────────────────────────────────────────────
  searchUsers(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }
    this.http.get<UserSearchResult[]>(`${environment.apiUrl}/users/search?query=${encodeURIComponent(this.searchQuery.trim())}`)
      .subscribe({
        next: (res) => {
          this.searchResults = res || [];
        },
        error: (err) => console.error('Failed to search users', err)
      });
  }

  inviteFriendFromPopup(friend: UserSearchResult): void {
    this.showSearchPopup = false;
    this.inviteFriend(friend);
  }

  inviteFriend(friend: UserSearchResult): void {
    if (!this.currentUser) return;
    this.http.post<any>(`${environment.apiUrl}/customduel/invite`, {
      hostUserId: this.currentUser.id,
      friendUserId: friend.id
    }).subscribe({
      next: (res) => {
        this.friendlyRoomId = res.roomId;
        this.friendlyRoomCode = res.roomCode;
        this.friendlyUrl = `${window.location.origin}/arena?room=${this.friendlyRoomId}`;
        this.lobbyStatus = 'invited';
        this.invitedFriend = { id: friend.id, username: friend.username };
        this.hostUser = { id: this.currentUser.id, username: this.currentUser.name || this.currentUser.username };
        this.searchResults = [];
        this.searchQuery = '';

        this.notificationService.showToast(`Invitation sent to ${friend.username}!`, 'success', 3000);

        // Join SignalR group for room
        const hub = this.notificationService.getHubConnection();
        if (hub) {
          hub.invoke('JoinRoom', this.friendlyRoomId)
            .then(() => console.log(`Joined SignalR group for Custom Duel: ${this.friendlyRoomId}`))
            .catch(err => console.error('Failed to join room group', err));
        }
      },
      error: (err) => {
        this.notificationService.showToast(err.error?.message || 'Failed to send invite.', 'error', 3000);
      }
    });
  }

  acceptIncomingInvitation(): void {
    if (!this.incomingInvitation) return;
    const inv = this.incomingInvitation;
    this.incomingInvitation = null;

    this.http.post<any>(`${environment.apiUrl}/customduel/accept`, {
      roomId: inv.roomId
    }).subscribe({
      next: (res) => {
        // Load the room details and show lobby popup
        this.joinExistingRoom(inv.roomId);
        this.showLobbyPopup = true;
      },
      error: (err) => {
        this.notificationService.showToast(err.error?.message || 'Failed to accept invitation.', 'error', 3000);
      }
    });
  }

  declineIncomingInvitation(): void {
    if (!this.incomingInvitation) return;
    const inv = this.incomingInvitation;
    this.incomingInvitation = null;

    this.http.post<any>(`${environment.apiUrl}/customduel/decline`, {
      roomId: inv.roomId
    }).subscribe({
      next: () => {
        this.notificationService.showToast('Invitation declined.', 'info', 2000);
      },
      error: (err) => console.error('Failed to decline invitation', err)
    });
  }

  // ─── Custom Duel Lobby Handling ────────────────────────────────────────────
  private joinExistingRoom(roomId: string): void {
    this.http.get<any>(`${environment.apiUrl}/customduel/${roomId}`)
      .subscribe({
        next: (room) => {
          this.friendlyRoomId = room.id;
          this.friendlyRoomCode = room.roomCode;
          this.friendlyUrl = `${window.location.origin}/arena?room=${this.friendlyRoomId}`;
          this.lobbyStatus = 'lobby';

          this.hostUser = { id: room.hostUserId, username: room.hostUsername };
          this.invitedFriend = { id: room.friendUserId, username: room.friendUsername };

          this.isHostReady = room.isHostReady;
          this.isFriendReady = room.isFriendReady;
          this.amIReady = this.currentUser?.id === room.hostUserId ? room.isHostReady : room.isFriendReady;

          // Join SignalR group
          const hub = this.notificationService.getHubConnection();
          if (hub) {
            hub.invoke('JoinRoom', this.friendlyRoomId)
              .then(() => console.log(`Joined SignalR group for Custom Duel: ${this.friendlyRoomId}`))
              .catch(err => console.error('Failed to join room group', err));
          }
        },
        error: (err) => {
          this.notificationService.showToast('Failed to load duel lobby details.', 'error', 3000);
          this.resetCustomRoom();
        }
      });
  }

  toggleReadyState(): void {
    if (!this.friendlyRoomId || !this.currentUser) return;
    const nextReadyState = !this.amIReady;
    this.http.post<any>(`${environment.apiUrl}/customduel/ready`, {
      roomId: this.friendlyRoomId,
      userId: this.currentUser.id,
      isReady: nextReadyState
    }).subscribe({
      next: () => {
        this.amIReady = nextReadyState;
      },
      error: (err) => console.error('Failed to set ready state', err)
    });
  }

  startFriendlyDuel(): void {
    if (!this.friendlyRoomId) return;
    this.showLobbyPopup = false;
    this.http.post<any>(`${environment.apiUrl}/customduel/start`, {
      roomId: this.friendlyRoomId,
      difficulty: this.selectedDifficulty
    }).subscribe({
      next: () => {
        // DuelStarted SignalR message will trigger navigation
      },
      error: (err) => {
        this.notificationService.showToast(err.error?.message || 'Failed to start duel.', 'error', 3000);
      }
    });
  }

  copyRoomLink(): void {
    if (!this.friendlyUrl) return;
    navigator.clipboard.writeText(this.friendlyUrl).then(() => {
      this.linkCopied = true;
      setTimeout(() => {
        this.linkCopied = false;
      }, 3000);
    });
  }

  shareRoom(): void {
    if (!this.friendlyUrl) return;
    if (navigator.share) {
      navigator.share({
        title: 'CodeClash Duel Invite',
        text: `Join my private coding duel on CodeClash! Room Code: ${this.friendlyRoomCode}`,
        url: this.friendlyUrl
      }).catch(err => console.log('Error sharing:', err));
    } else {
      this.copyRoomLink();
    }
  }

  resetCustomRoom(): void {
    const hub = this.notificationService.getHubConnection();
    if (hub && this.friendlyRoomId) {
      hub.invoke('LeaveRoom', this.friendlyRoomId).catch(err => console.error(err));
    }
    this.friendlyRoomId = '';
    this.friendlyRoomCode = '';
    this.friendlyUrl = '';
    this.lobbyStatus = 'idle';
    this.invitedFriend = null;
    this.hostUser = null;
    this.isHostReady = false;
    this.isFriendReady = false;
    this.amIReady = false;
    this.router.navigate(['/arena'], { queryParams: {} });
  }
}
