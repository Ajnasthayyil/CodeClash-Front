import { Component, OnInit } from '@angular/core';

interface ContestRecord {
  id: string;
  name: string;
  type: 'Rated Match' | 'Weekly Duel' | 'Tournament';
  status: 'Ongoing' | 'Scheduled' | 'Completed';
  participants: number;
  dateTime: string;
}

@Component({
  selector: 'app-contest-management',
  templateUrl: './contest-management.component.html',
  styleUrls: ['./contest-management.component.scss']
})
export class ContestManagementComponent implements OnInit {
  contests: ContestRecord[] = [
    { id: '1', name: 'Grandmaster Rated Duel', type: 'Rated Match', status: 'Ongoing', participants: 24, dateTime: 'June 25, 2026' },
    { id: '2', name: 'Weekly Blitz Brawl #23', type: 'Weekly Duel', status: 'Scheduled', participants: 156, dateTime: 'June 28, 2026, 18:00' },
    { id: '3', name: 'CodeClash Summer Open', type: 'Tournament', status: 'Scheduled', participants: 512, dateTime: 'July 05, 2026, 10:00' },
    { id: '4', name: 'Alpha Bracket Series #4', type: 'Tournament', status: 'Completed', participants: 64, dateTime: 'June 20, 2026' }
  ];

  newContestName = '';
  newContestType: 'Rated Match' | 'Weekly Duel' | 'Tournament' = 'Rated Match';
  newContestDate = '';

  ngOnInit(): void {}

  scheduleContest(): void {
    const name = this.newContestName.trim();
    const date = this.newContestDate.trim();
    if (!name || !date) return;

    this.contests.unshift({
      id: String(this.contests.length + 1),
      name,
      type: this.newContestType,
      status: 'Scheduled',
      participants: 0,
      dateTime: date
    });

    this.newContestName = '';
    this.newContestDate = '';
  }

  cancelContest(contest: ContestRecord): void {
    this.contests = this.contests.filter(c => c.id !== contest.id);
  }
}
