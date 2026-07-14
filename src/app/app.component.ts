import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService } from './shared/notifications/notification.service';
import { CustomDuelService } from './core/services/custom-duel.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'codeclash-frontend';
  activeInvitation: any = null;
  private inviteSub!: Subscription;
  private inviteTimeout: any = null;

  constructor(
    private notificationService: NotificationService,
    private customDuelService: CustomDuelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.inviteSub = this.notificationService.duelInvitationReceived$.subscribe(data => {
      // Clear any existing active invitation timeout
      if (this.inviteTimeout) {
        clearTimeout(this.inviteTimeout);
        this.inviteTimeout = null;
      }

      this.activeInvitation = data;

      // Auto dismiss banner from screen after 30 seconds (do NOT call declineInvite API to avoid multi-tab desync)
      this.inviteTimeout = setTimeout(() => {
        if (this.activeInvitation && this.activeInvitation.roomId === data.roomId) {
          this.activeInvitation = null;
        }
      }, 30000);
    });
  }

  ngOnDestroy(): void {
    if (this.inviteSub) {
      this.inviteSub.unsubscribe();
    }
    if (this.inviteTimeout) {
      clearTimeout(this.inviteTimeout);
    }
  }

  acceptInvite(): void {
    if (!this.activeInvitation) return;
    const roomId = this.activeInvitation.roomId;

    if (this.inviteTimeout) {
      clearTimeout(this.inviteTimeout);
      this.inviteTimeout = null;
    }

    this.customDuelService.acceptInvitation(roomId).subscribe({
      next: (res) => {
        this.activeInvitation = null;
        this.router.navigate(['/arena'], { queryParams: { room: roomId } });
        this.notificationService.showToast('Invitation accepted! Joining lobby...', 'success');
      },
      error: (err) => {
        this.activeInvitation = null;
        this.notificationService.showToast('Failed to accept invitation.', 'error');
        console.error(err);
      }
    });
  }

  declineInvite(): void {
    if (!this.activeInvitation) return;
    const roomId = this.activeInvitation.roomId;

    if (this.inviteTimeout) {
      clearTimeout(this.inviteTimeout);
      this.inviteTimeout = null;
    }

    this.customDuelService.declineInvitation(roomId).subscribe({
      next: (res) => {
        this.activeInvitation = null;
        this.notificationService.showToast('Invitation declined.', 'info');
      },
      error: (err) => {
        this.activeInvitation = null;
        console.error(err);
      }
    });
  }
}
