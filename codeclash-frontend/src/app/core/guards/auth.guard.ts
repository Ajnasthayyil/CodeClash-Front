import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../../shared/notifications/notification.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  if (authService.isLoggedIn) {
    return true;
  }

  // Show warning message via toast
  notificationService.showToast('Please log in to access this page.', 'warning');

  // Not logged in, redirect to login page with query parameter for return URL
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
