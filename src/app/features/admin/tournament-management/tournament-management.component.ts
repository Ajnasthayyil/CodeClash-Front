import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TournamentAdminRecord {
  id: string;
  name: string;
  status: 'Draft' | 'Published' | 'RegistrationOpen' | 'RegistrationClosed' | 'Live' | 'Completed' | 'Cancelled';
  capacity: number;
  registered: number;
  startDate: string;
}

@Component({
  selector: 'app-tournament-management',
  templateUrl: './tournament-management.component.html',
  styleUrls: ['./tournament-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TournamentManagementComponent implements OnInit {
  tournaments: TournamentAdminRecord[] = [
    { id: 'T-1', name: 'Violet Championship S3', status: 'Live', capacity: 256, registered: 256, startDate: '2026-06-20' },
    { id: 'T-2', name: 'Golden League S2', status: 'Completed', capacity: 128, registered: 128, startDate: '2026-05-14' },
    { id: 'T-3', name: 'CodeClash Summer Open', status: 'RegistrationOpen', capacity: 512, registered: 312, startDate: '2026-07-05' },
    { id: 'T-4', name: 'Draft Tournament', status: 'Draft', capacity: 64, registered: 0, startDate: '2026-08-01' }
  ];

  showCreateModal = false;
  newTournament = { name: '', capacity: 64, startDate: '' };

  searchQuery = '';

  get filteredTournaments(): TournamentAdminRecord[] {
    if (!this.searchQuery) return this.tournaments;
    return this.tournaments.filter(t => t.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
  }

  ngOnInit(): void {}

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.newTournament = { name: '', capacity: 64, startDate: '' };
  }

  createTournament(): void {
    if (!this.newTournament.name || !this.newTournament.startDate) return;

    this.tournaments.unshift({
      id: `T-${this.tournaments.length + 1}`,
      name: this.newTournament.name,
      status: 'Draft',
      capacity: this.newTournament.capacity,
      registered: 0,
      startDate: this.newTournament.startDate
    });

    this.closeCreateModal();
  }

  publishTournament(t: TournamentAdminRecord): void {
    t.status = 'Published';
  }

  openRegistration(t: TournamentAdminRecord): void {
    t.status = 'RegistrationOpen';
  }

  generateBracket(t: TournamentAdminRecord): void {
    t.status = 'Live';
    alert(`Bracket generated for ${t.name}! Match generation complete.`);
  }

  cancelTournament(t: TournamentAdminRecord): void {
    t.status = 'Cancelled';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Live': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'RegistrationOpen': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Completed': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'Draft': return 'bg-slate-700/50 text-slate-300 border border-slate-600';
      case 'Cancelled': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    }
  }
}
