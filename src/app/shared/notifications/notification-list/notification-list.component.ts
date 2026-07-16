import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService, AppNotification } from '../notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss']
}
)
export class NotificationListComponent implements OnInit {
  notifications$: Observable<AppNotification[]>;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.notifications$ = this.notificationService.notifications$;
  }

  ngOnInit(): void {}

  onNotificationClick(notif: AppNotification, event: MouseEvent): void {
    // Navigate to tournament if it matches
    if (notif.title === 'New Tournament Created' || notif.message.toLowerCase().includes('tournament')) {
      this.router.navigate(['/tournament']);
    }

    // Mark as read in DB and clear from the local notification list dropdown
    this.notificationService.markAsRead(notif.id);
    this.notificationService.clearNotification(notif.id);
  }

  markAsRead(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id);
  }

  markAllAsRead(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead();
  }

  clearNotification(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.clearNotification(id);
  }

  clearAll(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.clearAllNotifications();
  }
}
