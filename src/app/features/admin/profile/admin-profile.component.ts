import { Component, OnInit } from '@angular/core';

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
    username: 'HexMaster',
    email: 'admin@codeclash.io',
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

  ngOnInit(): void {}

  toggleSetting(setting: AdminSetting): void {
    setting.enabled = !setting.enabled;
  }
}
