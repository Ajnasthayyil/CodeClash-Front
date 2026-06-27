import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit(): void {}

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.redirectToLanding();
      },
      error: () => {
        this.authService.clearSession();
        this.redirectToLanding();
      }
    });
  }

  private redirectToLanding(): void {
    localStorage.removeItem('theme');
    window.location.href = '/';
  }
}
