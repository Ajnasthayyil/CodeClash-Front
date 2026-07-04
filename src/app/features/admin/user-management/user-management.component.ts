import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../shared/notifications/notification.service';
import { AdminUserService, AdminUserRecordDto } from '../../../core/services/admin-user.service';

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
  users: UserRecord[] = [];
  isLoading = false;
  searchQuery = '';

  // Notification Modal state
  isModalOpen = false;
  selectedUser: UserRecord | null = null;
  notificationTitle = '';
  notificationMsg = '';
  notificationType: 'info' | 'success' | 'warning' | 'error' = 'info';

  constructor(
    private notificationService: NotificationService,
    private adminUserService: AdminUserService
  ) { }

  get filteredUsers(): UserRecord[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u => u.username.toLowerCase().includes(q));
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminUserService.getUsers().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res) {
          this.users = res.map(u => ({
            id: u.id,
            username: u.username,
            elo: u.elo,
            role: u.role as 'Admin' | 'User',
            status: u.status as 'Active' | 'Suspended',
            joinDate: u.joinDate
          }));
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading users:', err);
        const msg = err.error?.message || 'An error occurred while loading system users.';
        this.notificationService.showToast(msg, 'error');
      }
    });
  }

  toggleStatus(user: UserRecord): void {
    if (user.role === 'Admin') {
      this.notificationService.showToast('Administrator accounts cannot be suspended or deactivated.', 'error');
      return;
    }

    const actionText = user.status === 'Active' ? 'suspend' : 'activate';
    if (confirm(`Are you sure you want to ${actionText} the user account "${user.username}"?`)) {
      this.isLoading = true;
      this.adminUserService.toggleUserStatus(user.id).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res) {
            user.status = user.status === 'Active' ? 'Suspended' : 'Active';
            this.notificationService.showToast((res as any)?.message || `User status updated successfully.`, 'success');
          } else {
            this.notificationService.showToast((res as any)?.message || 'Failed to update user status.', 'error');
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error toggling user status:', err);
          const msg = err.error?.message || 'An error occurred while updating user status.';
          this.notificationService.showToast(msg, 'error');
        }
      });
    }
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

    this.isLoading = true;
    const payload = {
      userId: this.selectedUser.id,
      title: this.notificationTitle.trim(),
      message: this.notificationMsg.trim(),
      type: this.notificationType
    };

    this.adminUserService.sendNotification(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res) {
          this.notificationService.showToast(`Notification sent to ${this.selectedUser?.username}!`, 'success');
          this.closeNotificationModal();
        } else {
          this.notificationService.showToast((res as any)?.message || 'Failed to send notification.', 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error sending notification:', err);
        const msg = err.error?.message || 'An error occurred while sending the notification.';
        this.notificationService.showToast(msg, 'error');
      }
    });
  }
}
