import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../../shared/notifications/notification.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  const user = authService.getCurrentUser();

  if (authService.isLoggedIn && user && user.role === 'Admin') {
    return true;
  }

  // Not an admin, show warning and redirect to dashboard
  notificationService.showToast('Access denied. Admin role required.', 'error');
  router.navigate(['/dashboard']);
  return false;
};
