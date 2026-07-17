import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-tournament-match',
  template: `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0d1117; color: #c9d1d9; font-family: sans-serif;">
      <div style="border: 4px solid rgba(255, 255, 255, 0.1); border-top-color: #a855f7; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
      <p style="font-size: 16px; font-weight: 500;">Connecting to tournament arena room...</p>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </div>
  `,
  standalone: true,
  imports: [CommonModule]
})
export class TournamentMatchComponent implements OnInit, OnDestroy {
  tournamentId = '';
  matchId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.tournamentId = params.get('id') || '';
      this.matchId = params.get('matchId') || '';

      const token = this.authService.getAccessToken();
      const currentUser = this.authService.getCurrentUser();
      const currentUserId = currentUser?.id || '';

      this.http.get<any[]>(`${environment.apiUrl}/tournaments/${this.tournamentId}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (matches) => {
          const match = matches.find(m => m.id === this.matchId);
          if (match && match.battleId) {
            const isP1 = match.player1Id && match.player1Id.toLowerCase() === currentUserId.toLowerCase();
            const oppUsername = isP1 ? match.player2Username : match.player1Username;
            
            this.router.navigate(['/arena/battle'], {
              queryParams: {
                battleId: match.battleId,
                problemId: match.assignedProblemId,
                language: match.language || 'Python',
                opponentName: oppUsername || 'Opponent',
                opponentElo: 1200,
                mode: 'Tournament'
              }
            });
          } else {
            this.router.navigate(['/tournament', this.tournamentId]);
          }
        },
        error: (err) => {
          console.error('Failed to load tournament match for redirection:', err);
          this.router.navigate(['/tournament', this.tournamentId]);
        }
      });
    });
  }

  ngOnDestroy(): void {}
}
