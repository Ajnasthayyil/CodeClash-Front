import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.redirectToLanding();
      },
      error: () => {
        // Fallback to client-side clear on error
        this.authService.clearSession();
        this.redirectToLanding();
      }
    });
  }

  private redirectToLanding(): void {
    localStorage.removeItem('theme'); // Optional: reset any state
    window.location.href = '/';
  }
}
