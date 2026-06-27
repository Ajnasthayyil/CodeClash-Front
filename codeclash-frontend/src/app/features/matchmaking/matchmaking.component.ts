import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../shared/notifications/notification.service';

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
  userElo = 1842;
  userInitial = 'N';

  // Custom Friend Room States
  friendlyRoomId = '';
  friendlyUrl = '';
  linkCopied = false;

  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.cancelSearch();
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

        // Trigger success notification and toast
        this.notificationService.showToast('Match found! Teleporting to arena...', 'success', 3000);
        this.notificationService.addNotification(
          'Match Found! ⚔️',
          `Opponent: ByteWizard (1766 ELO) matched for ${this.selectedLanguage} (${this.selectedDifficulty.toUpperCase()}).`,
          'success'
        );

        // Redirect to Battle Arena after 2 seconds match display
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

  // ─── Friendly Duel ─────────────────────────────────────────────────────────
  createFriendlyRoom(): void {
    // Generate a random uppercase room code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    this.friendlyRoomId = `CLASH-${code}`;
    // Construct absolute URL (using window.location origins)
    const origin = window.location.origin;
    this.friendlyUrl = `${origin}/arena/battle?room=${this.friendlyRoomId}`;
    this.linkCopied = false;
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

  startFriendlyDuel(): void {
    if (!this.friendlyRoomId) return;
    this.router.navigate(['/arena/battle'], { queryParams: { room: this.friendlyRoomId } });
  }

  shareRoom(): void {
    if (!this.friendlyUrl) return;
    if (navigator.share) {
      navigator.share({
        title: 'CodeClash Duel Invite',
        text: `Join my private coding duel on CodeClash! Room Code: ${this.friendlyRoomId}`,
        url: this.friendlyUrl
      }).catch(err => {
        console.log('Error sharing:', err);
      });
    } else {
      this.copyRoomLink();
    }
  }
}
