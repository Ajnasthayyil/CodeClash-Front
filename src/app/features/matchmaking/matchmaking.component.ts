import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../shared/notifications/notification.service';
import { CustomDuelService, UserSearchResultDto } from '../../core/services/custom-duel.service';
import { AuthService } from '../../core/services/auth.service';
import { MatchmakingService } from '../../core/services/matchmaking.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-matchmaking',
  templateUrl: './matchmaking.component.html',
  styleUrls: ['./matchmaking.component.scss']
})
export class MatchmakingComponent implements OnInit, OnDestroy {
  // ─── Ranked Duel Queue States ──────────────────────────────────────────────
  queueStatus: 'idle' | 'configuring' | 'searching' | 'matched' = 'idle';
  queueSeconds = 0;
  private queueInterval: any;

  // Opponent matching settings
  selectedDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  selectedLanguage = 'Python';
  languages: string[] = ['Python', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Java', 'Go', 'Rust'];
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
  searchResults: UserSearchResultDto[] = [];
  lobbyStatus: 'idle' | 'invited' | 'lobby' | 'declined' = 'idle';
  invitedFriend: { id: string; username: string } | null = null;
  hostUser: { id: string; username: string } | null = null;

  // Ready States
  isHostReady = false;
  isFriendReady = false;
  amIReady = false;

  // Popup visibility flags
  showSearchPopup = false;
  showLobbyPopup = false;

  private signalRListeners: { event: string; handler: (...args: any[]) => void }[] = [];
  private duelNavigating = false; // guard against double-navigation from duplicate DuelStarted events
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private notificationService: NotificationService,
    private customDuelService: CustomDuelService,
    private authService: AuthService,
    private matchmakingService: MatchmakingService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.userElo = this.currentUser.rating || 1200;
      this.userInitial = this.currentUser.initials || 'U';
    }

    this.setupSignalRListeners();

    // Real-time 1v1 Ranked Matchmaking subscriptions
    this.matchmakingService.opponentFound$.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      if (this.queueInterval) {
        clearInterval(this.queueInterval);
      }
      this.queueStatus = 'matched';
      this.notificationService.showToast('Match found! Teleporting to coding arena...', 'success', 3000);
      this.notificationService.addNotification(
        'Match Found! ⚔️',
        `Opponent found for ${this.selectedLanguage} (${this.selectedDifficulty.toUpperCase()}).`,
        'success'
      );
      setTimeout(() => {
        this.router.navigate(['/arena/battle'], {
          queryParams: {
            battleId: data.battleId,
            problemId: data.problemId,
            language: data.language,
            opponentName: data.opponentName,
            opponentElo: data.opponentElo,
            mode: '1v1'
          }
        });
      }, 2000);
    });

    this.matchmakingService.queueLeft$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.queueInterval) {
        clearInterval(this.queueInterval);
      }
      this.queueStatus = 'configuring';
      this.queueSeconds = 0;
    });

    // Check if routed with a roomId query param
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const roomParam = params['room'];
      if (roomParam) {
        this.joinExistingRoom(roomParam);
      }
    });
  }

  ngOnDestroy(): void {
    this.cancelSearch();
    this.cleanupSignalRListeners();
    this.destroy$.next();
    this.destroy$.complete();
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
          if (data.roomId === this.friendlyRoomId && !this.duelNavigating) {
            this.duelNavigating = true;
            this.notificationService.showToast('Duel is starting! Entering arena...', 'success', 2000);
            setTimeout(() => {
              this.router.navigate(['/arena/battle'], { queryParams: { room: this.friendlyRoomId, lang: this.selectedLanguage.toLowerCase() } });
            }, 1500);
          }
        }
      },
      {
        event: 'LobbySettingsUpdated',
        handler: (data: any) => {
          if (data.roomId === this.friendlyRoomId) {
            this.selectedDifficulty = data.difficulty;
            this.selectedLanguage = data.language;
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
    this.syncLobbySettings(diff, this.selectedLanguage);
  }

  onLanguageChange(lang: string): void {
    this.selectedLanguage = lang;
    this.notificationService.showToast(`Language filter set to ${lang}`, 'info', 2000);
    this.syncLobbySettings(this.selectedDifficulty, lang);
  }

  syncLobbySettings(diff: string, lang: string): void {
    if (!this.friendlyRoomId || this.currentUser?.id !== this.hostUser?.id) return;
    this.http.post<any>(`${environment.apiUrl}/customduel/settings`, {
      roomId: this.friendlyRoomId,
      difficulty: diff,
      language: lang
    }).subscribe({
      error: (err) => console.error('Failed to sync lobby settings', err)
    });
  }

  openConfigOverlay(): void {
    this.queueStatus = 'configuring';
  }

  closeConfigOverlay(): void {
    this.queueStatus = 'idle';
  }

  startSearch(): void {
    if (this.queueStatus !== 'configuring') return;
    this.queueStatus = 'searching';
    this.queueSeconds = 0;
    this.notificationService.showToast('Entering matchmaking queue...', 'info', 2500);

    this.matchmakingService.getQueueTicket().subscribe({
      next: () => {
        this.matchmakingService.initConnection().then(() => {
          this.matchmakingService.joinQueue(this.selectedLanguage, this.selectedDifficulty);
          this.queueInterval = setInterval(() => {
            this.queueSeconds++;
          }, 1000);
        }).catch(err => {
          this.notificationService.showToast('Failed to connect to matchmaking server.', 'error');
          this.queueStatus = 'configuring';
          console.error(err);
        });
      },
      error: (err) => {
        this.notificationService.showToast('Failed to acquire matchmaking ticket.', 'error');
        this.queueStatus = 'configuring';
        console.error(err);
      }
    });
  }

  cancelSearch(): void {
    if (this.queueStatus === 'searching') {
      this.notificationService.showToast('Matchmaking search cancelled.', 'warning', 2500);
    }
    this.matchmakingService.leaveQueue();
    this.matchmakingService.stopConnection();
    if (this.queueInterval) {
      clearInterval(this.queueInterval);
      this.queueInterval = null;
    }
    this.queueStatus = 'configuring';
    this.queueSeconds = 0;
  }

  // ─── Friendly Duel Invitation ──────────────────────────────────────────────
  searchUsers(): void {
    const query = this.searchQuery.trim();
    if (!query || query.length < 2) {
      this.searchResults = [];
      return;
    }
    this.customDuelService.searchUsers(query).subscribe({
      next: (res) => {
        this.searchResults = res || [];
      },
      error: (err) => console.error('Failed to search users', err)
    });
  }

  inviteFriendFromPopup(friend: UserSearchResultDto): void {
    this.showSearchPopup = false;
    this.inviteFriend(friend);
  }

  inviteFriend(friend: UserSearchResultDto): void {
    if (!this.currentUser) return;
    this.customDuelService.inviteFriend(this.currentUser.id, friend.id).subscribe({
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

        // Join SignalR group for room (tracked for auto-rejoin on reconnect)
        this.notificationService.joinRoomGroup(this.friendlyRoomId);
      },
      error: (err) => {
        this.notificationService.showToast(err.error?.message || 'Failed to send invite.', 'error', 3000);
      }
    });
  }

  // ─── Custom Duel Lobby Handling ────────────────────────────────────────────
  private joinExistingRoom(roomId: string): void {
    this.customDuelService.getRoomDetails(roomId)
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

          this.showLobbyPopup = true;

          // Join SignalR group (tracked for auto-rejoin on reconnect)
          this.notificationService.joinRoomGroup(this.friendlyRoomId);
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
    this.customDuelService.setPlayerReady(this.friendlyRoomId, this.currentUser.id, nextReadyState).subscribe({
      next: () => {
        this.amIReady = nextReadyState;
      },
      error: (err) => console.error('Failed to set ready state', err)
    });
  }

  startFriendlyDuel(): void {
    if (!this.friendlyRoomId) return;
    this.duelNavigating = false; // reset guard before each attempt
    this.showLobbyPopup = false;
    this.customDuelService.startDuel(this.friendlyRoomId).subscribe({
      next: () => {
        // Navigate immediately from HTTP success — SignalR DuelStarted is a secondary mechanism.
        // This prevents the host from being stranded if their SignalR group membership dropped.
        if (!this.duelNavigating) {
          this.duelNavigating = true;
          this.notificationService.showToast('Duel is starting! Entering arena...', 'success', 2000);
          setTimeout(() => {
            this.router.navigate(['/arena/battle'], { queryParams: { room: this.friendlyRoomId } });
          }, 1500);
        }
      },
      error: (err) => {
        this.duelNavigating = false;
        this.showLobbyPopup = true; // re-open lobby on error
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
    this.duelNavigating = false;
    if (this.friendlyRoomId) {
      this.notificationService.leaveRoomGroup(this.friendlyRoomId);
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
