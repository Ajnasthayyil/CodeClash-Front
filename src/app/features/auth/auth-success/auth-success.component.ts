import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-success',
  templateUrl: './auth-success.component.html',
  styleUrls: ['./auth-success.component.scss']
})
export class AuthSuccessComponent implements OnInit {
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const refreshToken = params['refreshToken'];

      if (token && refreshToken) {
        // 1. Save tokens to cookies and memory
        this.authService.setAuthTokens(token, refreshToken);

        // 2. Fetch user profile to initialize the session
        this.authService.getProfile().subscribe({
          next: (res) => {
            if (res && res.success && res.data) {
              const profile = res.data;
              
              // Compute user initials
              const parts = (profile.fullName || '').trim().split(/\s+/);
              let initials = 'NC';
              if (parts.length >= 2) {
                initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
              } else if (parts.length === 1 && parts[0].length > 0) {
                initials = parts[0][0].toUpperCase();
              }

              const currentUser = {
                id: profile.userId,
                name: profile.fullName,
                email: profile.email,
                phoneNumber: profile.phoneNumber || '',
                username: profile.username,
                initials: initials,
                profileImageUrl: profile.profileImageUrl || ''
              };

              // Store user details in localStorage
              localStorage.setItem('currentUser', JSON.stringify(currentUser));
              
              // 3. Redirect to dashboard
              this.router.navigate(['/dashboard']);
            } else {
              this.handleError('Failed to retrieve user profile.');
            }
          },
          error: (err) => {
            console.error('Profile fetch error:', err);
            this.handleError('An error occurred while loading your profile details.');
          }
        });
      } else {
        this.handleError('Authentication tokens are missing from the login redirect.');
      }
    });
  }

  private handleError(msg: string): void {
    this.isLoading = false;
    this.errorMessage = msg;
    setTimeout(() => {
      this.router.navigate(['/auth/login']);
    }, 3000);
  }
}
