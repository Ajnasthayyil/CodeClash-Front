import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  constructor(private router: Router) {}

  get showSidebar(): boolean {
    const url = this.router.url;
    // Show sidebar on all app sub-routes, but hide on landing page '/' and admin pages
    return url !== '/' && url !== '' && !url.startsWith('/admin');
  }

  get showNavbar(): boolean {
    const url = this.router.url;
    // Hide navbar on arena/solve pages for more vertical space
    return !url.includes('/problems/solve') && !url.includes('/arena/battle');
  }
}
