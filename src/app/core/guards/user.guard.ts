import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../../shared/notifications/notification.service';

export const userGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  const user = authService.getCurrentUser();

  if (authService.isLoggedIn && user && user.role !== 'Admin') {
    return true;
  }

  if (user && user.role === 'Admin') {
    notificationService.showToast('Admins cannot access player components.', 'error');
    router.navigate(['/admin/dashboard']);
    return false;
  }

  // Not logged in or no role (failsafe)
  router.navigate(['/auth/login']);
  return false;
};
