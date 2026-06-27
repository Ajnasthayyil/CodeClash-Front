import { Component, OnInit } from '@angular/core';
import { NotificationService, AppNotification } from '../notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss']
})
export class NotificationListComponent implements OnInit {
  notifications$: Observable<AppNotification[]>;

  constructor(private notificationService: NotificationService) {
    this.notifications$ = this.notificationService.notifications$;
  }

  ngOnInit(): void {}

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
