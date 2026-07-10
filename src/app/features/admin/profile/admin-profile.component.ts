import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

interface AdminSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.scss']
})
export class AdminProfileComponent implements OnInit {
  adminInfo = {
    username: 'Admin123',
    email: 'admin@codeclash.com',
    role: 'Root Administrator',
    privilegeTier: 'Level 3 (Full Access)',
    lastActive: 'Just now',
    ipAddress: '192.168.1.105'
  };

  settings: AdminSetting[] = [
    { id: '1', name: 'Platform Maintenance Mode', description: 'Suspend sandbox runs and matchmaking globally.', enabled: false },
    { id: '2', name: 'Sandbox Diagnostic Logs', description: 'Enable verbose debugger logging for compiler pods.', enabled: true },
    { id: '3', name: 'Admin Activity Notifications', description: 'Receive email alerts for user moderation actions.', enabled: false },
    { id: '4', name: 'Rate Limiter Hard Cap', description: 'Strictly enforce maximum API rate limitations (60 req/min).', enabled: true }
  ];

  securityLogs = [
    { action: 'Database backup initiated', time: '12:00:15', status: 'Completed' },
    { action: 'Role updated: NovaCoder to User', time: '10:45:00', status: 'Success' },
    { action: 'User suspension: Cheater404', time: '09:30:12', status: 'Success' },
    { action: 'Privilege elevation requested', time: '08:15:44', status: 'Approved' }
  ];

  // Modal and API State
  isEditModalOpen = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  editAdmin = {
    name: '',
    username: '',
    phoneNumber: ''
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadAdminProfile();
  }

  loadAdminProfile(): void {
    const localUser = this.authService.getCurrentUser();
    if (localUser) {
      this.adminInfo.username = localUser.username || this.adminInfo.username;
      this.adminInfo.email = localUser.email || this.adminInfo.email;
      this.adminInfo.role = localUser.role === 'Admin' ? 'Root Administrator' : localUser.role;
    }

    // Call API to fetch fresh data
    this.authService.getProfile().subscribe({
      next: (res) => {
        if (res) {
          const profile = res;
          this.adminInfo.username = profile.username;
          this.adminInfo.email = profile.email;
          this.adminInfo.role = profile.role === 'Admin' ? 'Root Administrator' : profile.role;

          // Update local storage in case details changed on another device
          const savedUser = localStorage.getItem('currentUser');
          const existing = savedUser ? JSON.parse(savedUser) : {};
          const updatedUser = {
            ...existing,
            name: profile.fullName,
            email: profile.email,
            phoneNumber: profile.phoneNumber || '',
            username: profile.username,
            role: profile.role
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      },
      error: (err) => {
        console.error('Failed to load fresh admin profile details:', err);
      }
    });
  }

  openEditModal(): void {
    const localUser = this.authService.getCurrentUser();
    this.editAdmin = {
      name: localUser?.name || this.adminInfo.username,
      username: this.adminInfo.username,
      phoneNumber: localUser?.phoneNumber || ''
    };
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
  }

  saveProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.editAdmin.name.trim()) {
      this.errorMessage = 'Full Name is required.';
      this.isLoading = false;
      return;
    }
    if (!this.editAdmin.username.trim()) {
      this.errorMessage = 'Username is required.';
      this.isLoading = false;
      return;
    }

    const payload = {
      fullName: this.editAdmin.name.trim(),
      username: this.editAdmin.username.trim(),
      phoneNumber: this.editAdmin.phoneNumber.trim()
    };

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res) {
          // Update details inside state
          this.adminInfo.username = res.username;
          this.adminInfo.email = res.email;
          this.adminInfo.role = res.role === 'Admin' ? 'Root Administrator' : res.role;

          // Save back to localStorage
          const savedUser = localStorage.getItem('currentUser');
          const existing = savedUser ? JSON.parse(savedUser) : {};
          
          // Compute initials
          const parts = (res.fullName || '').trim().split(/\s+/);
          let initials = 'SA';
          if (parts.length >= 2) {
            initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
          } else if (parts.length === 1 && parts[0].length > 0) {
            initials = parts[0][0].toUpperCase();
          }

          const updatedUser = {
            ...existing,
            name: res.fullName,
            email: res.email,
            phoneNumber: res.phoneNumber,
            username: res.username,
            role: res.role,
            initials: initials
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));

          this.successMessage = 'Profile updated successfully!';
          setTimeout(() => {
            this.successMessage = '';
            this.closeEditModal();
            this.loadAdminProfile();
          }, 1500);
        } else {
          this.errorMessage = (res as any)?.message || 'Failed to update admin profile.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && err.error.errors && err.error.errors.length > 0) {
          this.errorMessage = err.error.errors.join(' ');
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'An error occurred while updating the admin profile.';
        }
      }
    });
  }

  toggleSetting(setting: AdminSetting): void {
    setting.enabled = !setting.enabled;
  }
}
