import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'Welcome to CodeClash! 🚀',
      message: 'Challenge other developers in real-time speed coding battles.',
      time: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      read: false,
      type: 'info'
    },
    {
      id: 'notif-2',
      title: 'Match Won! 🎉',
      message: 'You defeated ByteWizard (+18 ELO). Excellent solution to "Two Sum".',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true,
      type: 'success'
    },
    {
      id: 'notif-3',
      title: 'System Update ⚙️',
      message: 'Compilers upgraded to support C++23 and TypeScript 5.',
      time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
      type: 'warning'
    }
  ]);

  private toastsSubject = new BehaviorSubject<Toast[]>([]);

  notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();
  toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  unreadCount$: Observable<number> = this.notifications$.pipe(
    map(notifs => notifs.filter(n => !n.read).length)
  );

  constructor() {}

  // ─── Notification Management ────────────────────────────────────────────────
  addNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const newNotif: AppNotification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      time: new Date(),
      read: false,
      type
    };

    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotif, ...current]);
  }

  markAsRead(id: string): void {
    const updated = this.notificationsSubject.value.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(updated);
  }

  markAllAsRead(): void {
    const updated = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(updated);
  }

  clearNotification(id: string): void {
    const filtered = this.notificationsSubject.value.filter(n => n.id !== id);
    this.notificationsSubject.next(filtered);
  }

  clearAllNotifications(): void {
    this.notificationsSubject.next([]);
  }

  // ─── Toast Management ───────────────────────────────────────────────────────
  showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000): void {
    const newToast: Toast = {
      id: `toast-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      duration
    };

    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      this.removeToast(newToast.id);
    }, duration);
  }

  removeToast(id: string): void {
    const filtered = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(filtered);
  }
}
