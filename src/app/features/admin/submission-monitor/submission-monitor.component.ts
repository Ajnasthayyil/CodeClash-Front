import { Component, OnInit, OnDestroy } from '@angular/core';
import { SubmissionsService, SubmissionSummary } from 'src/app/core/services/submissions.service';

interface SubmissionRecord {
  id: string;
  user: string;
  problem: string;
  language: string;
  status: string;
  runtime: string;
  memory: string;
  timeAgo: string;
}

@Component({
  selector: 'app-submission-monitor',
  templateUrl: './submission-monitor.component.html',
  styleUrls: ['./submission-monitor.component.scss']
})
export class SubmissionMonitorComponent implements OnInit, OnDestroy {
  submissions: SubmissionRecord[] = [];
  private intervalId: any;

  constructor(private submissionsService: SubmissionsService) {}

  ngOnInit(): void {
    this.fetchSubmissions();
    
    // Poll every 5 seconds to get the latest submissions
    this.intervalId = setInterval(() => {
      this.fetchSubmissions();
    }, 5000);
  }

  fetchSubmissions(): void {
    this.submissionsService.getSubmissions(1, 20).subscribe({
      next: (response) => {
        this.submissions = response.items.map(s => this.mapToRecord(s));
      },
      error: (err) => {
        console.error('Error fetching submissions:', err);
      }
    });
  }

  mapToRecord(dto: SubmissionSummary): SubmissionRecord {
    return {
      id: dto.id.substring(0, 8).toUpperCase(),
      user: dto.userName,
      problem: dto.problemTitle,
      language: this.capitalize(dto.language),
      status: this.formatStatus(dto.status),
      runtime: dto.executionTimeMs !== null && dto.executionTimeMs !== undefined ? `${dto.executionTimeMs}ms` : 'N/A',
      memory: dto.memoryUsedBytes !== null && dto.memoryUsedBytes !== undefined ? `${(dto.memoryUsedBytes / (1024 * 1024)).toFixed(1)} MB` : 'N/A',
      timeAgo: this.calculateTimeAgo(dto.createdAt)
    };
  }

  private capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private formatStatus(status: string): string {
    // Map status enum string if needed, e.g., "WrongAnswer" -> "Wrong Answer"
    return status.replace(/([A-Z])/g, ' $1').trim();
  }

  private calculateTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
