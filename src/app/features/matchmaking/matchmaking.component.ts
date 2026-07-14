import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../shared/notifications/notification.service';
import { CustomDuelService, UserSearchResultDto, CustomDuelRoomDto } from '../../core/services/custom-duel.service';
import { AuthService } from '../../core/services/auth.service';
import { MatchmakingService } from '../../core/services/matchmaking.service';

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

  selectedDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  selectedLanguage = 'Python';
  languages: string[] = ['Python', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Java', 'Go', 'Rust'];
  userElo = 1842;
  userInitial = 'N';

  // ─── Custom Duel Features ──────────────────────────────────────────────────
  currentUser: any = null;
  inviteModalOpen = false;
  searchControl = new FormControl('');
  searchResults: UserSearchResultDto[] = [];
  isSearchingUsers = false;
  searchErrorMessage = '';

  lobbyRoomId = '';
  lobbyRoom: CustomDuelRoomDto | null = null;
  isLobbyLoading = false;
  isLobbyReady = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private customDuelService: CustomDuelService,
    private authService: AuthService,
    private matchmakingService: MatchmakingService
  ) {}

  ngOnInit(): void {
    // 1. Fetch current user
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.userElo = this.currentUser.rating || 1500;
      this.userInitial = this.currentUser.initials || 'C';
    }

    // 2. Query parameters subscription (for waiting lobby redirection)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const room = params['room'];
      if (room) {
        this.joinLobby(room);
      } else {
        this.leaveLobby();
      }
    });

    // 2.5 Real-time 1v1 Ranked Matchmaking subscriptions
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

    // 3. Debounced friend search
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      switchMap(query => {
        if (!query || query.trim().length < 2) {
          this.searchResults = [];
          return [];
        }
        this.isSearchingUsers = true;
        this.searchErrorMessage = '';
        return this.customDuelService.searchUsers(query.trim());
      })
    ).subscribe({
      next: (results) => {
        this.isSearchingUsers = false;
        this.searchResults = results;
      },
      error: (err) => {
        this.isSearchingUsers = false;
        this.searchErrorMessage = 'Failed to load search results.';
        console.error(err);
      }
    });

    // 4. SignalR waiting lobby event bindings
    this.notificationService.invitationAccepted$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (this.lobbyRoomId && this.lobbyRoomId === data.roomId) {
        this.notificationService.showToast(`${data.friendUsername} joined the lobby!`, 'success');
        this.refreshLobby();
      }
    });

    this.notificationService.playerJoined$.pipe(takeUntil(this.destroy$)).subscribe(userId => {
      if (this.lobbyRoomId) {
        this.refreshLobby();
      }
    });

    this.notificationService.playerReady$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (this.lobbyRoomId && this.lobbyRoomId === data.roomId) {
        this.refreshLobby();
      }
    });

    this.notificationService.duelStarted$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (this.lobbyRoomId && this.lobbyRoomId === data.roomId) {
        this.notificationService.showToast('Duel started! Navigating to coding arena...', 'success');
        this.notificationService.leaveRoomGroup(data.roomId);
        this.router.navigate(['/arena/battle'], { queryParams: { room: data.roomCode, problemId: data.problemId } });
      }
    });

    this.notificationService.invitationDeclined$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (this.lobbyRoomId && this.lobbyRoomId === data.roomId) {
        this.notificationService.showToast('Friend declined the duel invitation.', 'warning');
        this.exitLobby();
      }
    });
  }

  ngOnDestroy(): void {
    this.cancelSearch();
    this.leaveLobby();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Ranked Queue matchmaking ──────────────────────────────────────────────
  setDifficulty(diff: 'easy' | 'medium' | 'hard'): void {
    this.selectedDifficulty = diff;
    this.notificationService.showToast(`Difficulty filter set to ${diff.toUpperCase()}`, 'info', 2000);
  }

  onLanguageChange(lang: string): void {
    this.selectedLanguage = lang;
    this.notificationService.showToast(`Language filter set to ${lang}`, 'info', 2000);
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

  // ─── Friend Invite and Waiting Lobby ──────────────────────────────────────
  openInviteModal(): void {
    this.inviteModalOpen = true;
    this.searchControl.setValue('');
    this.searchResults = [];
    this.searchErrorMessage = '';
  }

  closeInviteModal(): void {
    this.inviteModalOpen = false;
  }

  inviteUser(friendUserId: string): void {
    if (!this.currentUser) {
      this.notificationService.showToast('Please log in to invite friends.', 'error');
      return;
    }

    this.customDuelService.inviteFriend(this.currentUser.id, friendUserId).subscribe({
      next: (room) => {
        this.closeInviteModal();
        this.notificationService.showToast('Invitation sent! Waiting for acceptance...', 'info');
        this.router.navigate(['/arena'], { queryParams: { room: room.roomId } });
      },
      error: (err) => {
        this.notificationService.showToast('Failed to send invitation.', 'error');
        console.error(err);
      }
    });
  }

  joinLobby(roomId: string): void {
    this.lobbyRoomId = roomId;
    this.isLobbyLoading = true;

    this.customDuelService.getRoomDetails(roomId).subscribe({
      next: (room) => {
        this.isLobbyLoading = false;
        this.lobbyRoom = room;

        // Sync local ready status with backend status
        if (this.currentUser) {
          this.isLobbyReady = this.currentUser.id === room.hostUserId ? room.isHostReady : room.isFriendReady;
        }

        // Join SignalR room group
        this.notificationService.joinRoomGroup(roomId);
      },
      error: (err) => {
        this.isLobbyLoading = false;
        this.notificationService.showToast('Failed to join lobby room.', 'error');
        this.exitLobby();
        console.error(err);
      }
    });
  }

  leaveLobby(): void {
    if (this.lobbyRoomId) {
      this.notificationService.leaveRoomGroup(this.lobbyRoomId);
    }
    this.lobbyRoomId = '';
    this.lobbyRoom = null;
    this.isLobbyReady = false;
  }

  refreshLobby(): void {
    if (!this.lobbyRoomId) return;

    this.customDuelService.getRoomDetails(this.lobbyRoomId).subscribe({
      next: (room) => {
        this.lobbyRoom = room;
        if (this.currentUser) {
          this.isLobbyReady = this.currentUser.id === room.hostUserId ? room.isHostReady : room.isFriendReady;
        }
      },
      error: (err) => {
        console.error('Failed to refresh waiting lobby details', err);
      }
    });
  }

  toggleReady(): void {
    if (!this.lobbyRoomId || !this.currentUser) return;

    const nextReadyState = !this.isLobbyReady;
    this.customDuelService.setPlayerReady(this.lobbyRoomId, this.currentUser.id, nextReadyState).subscribe({
      next: (res) => {
        this.isLobbyReady = nextReadyState;
        this.refreshLobby();
      },
      error: (err) => {
        this.notificationService.showToast('Failed to toggle ready status.', 'error');
        console.error(err);
      }
    });
  }

  launchDuel(): void {
    if (!this.lobbyRoomId) return;

    this.customDuelService.startDuel(this.lobbyRoomId).subscribe({
      next: (res) => {
        this.notificationService.showToast('Launching duel...', 'success');
      },
      error: (err) => {
        this.notificationService.showToast(err.error?.message || 'Failed to start duel.', 'error');
        console.error(err);
      }
    });
  }

  exitLobby(): void {
    this.router.navigate(['/arena']);
  }
}
