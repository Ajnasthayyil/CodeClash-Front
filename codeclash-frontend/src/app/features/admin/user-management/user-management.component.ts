import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../shared/notifications/notification.service';

interface UserRecord {
  id: string;
  username: string;
  elo: number;
  role: 'Admin' | 'User';
  status: 'Active' | 'Suspended';
  joinDate: string;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: UserRecord[] = [
    { id: '1', username: 'NovaCoder', elo: 1842, role: 'User', status: 'Active', joinDate: '2025-11-12' },
    { id: '2', username: 'ByteWizard', elo: 1756, role: 'User', status: 'Active', joinDate: '2025-12-05' },
    { id: '3', username: 'HexMaster', elo: 2105, role: 'Admin', status: 'Active', joinDate: '2025-08-20' },
    { id: '4', username: 'Cheater404', elo: 1420, role: 'User', status: 'Suspended', joinDate: '2026-02-14' },
    { id: '5', username: 'StackOverlord', elo: 1980, role: 'User', status: 'Active', joinDate: '2026-01-03' },
    { id: '6', username: 'Algorist', elo: 1675, role: 'User', status: 'Active', joinDate: '2026-03-22' }
  ];

  searchQuery = '';

  // Notification Modal state
  isModalOpen = false;
  selectedUser: UserRecord | null = null;
  notificationTitle = '';
  notificationMsg = '';
  notificationType: 'info' | 'success' | 'warning' | 'error' = 'info';

  constructor(private notificationService: NotificationService) { }

  get filteredUsers(): UserRecord[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u => u.username.toLowerCase().includes(q));
  }

  ngOnInit(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Update first mock user record
      const me = this.users.find(u => u.id === '1');
      if (me) {
        me.username = parsed.username || parsed.name || me.username;
        me.elo = parsed.rating || me.elo;
      }
    }
  }

  toggleRole(user: UserRecord): void {
    user.role = user.role === 'Admin' ? 'User' : 'Admin';
  }

  toggleStatus(user: UserRecord): void {
    user.status = user.status === 'Active' ? 'Suspended' : 'Active';
  }

  openNotificationModal(user: UserRecord): void {
    this.selectedUser = user;
    this.notificationTitle = `System Notice: ${user.username}`;
    this.notificationMsg = '';
    this.notificationType = 'info';
    this.isModalOpen = true;
  }

  closeNotificationModal(): void {
    this.isModalOpen = false;
    this.selectedUser = null;
  }

  sendNotification(): void {
    if (!this.selectedUser || !this.notificationTitle.trim() || !this.notificationMsg.trim()) {
      return;
    }

    this.notificationService.addNotification(
      this.notificationTitle,
      this.notificationMsg,
      this.notificationType
    );

    this.notificationService.showToast(
      `Notification sent to ${this.selectedUser.username}!`,
      'success'
    );

    this.closeNotificationModal();
  }
}
