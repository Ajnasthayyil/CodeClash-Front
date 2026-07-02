import { Component, OnInit, OnDestroy } from '@angular/core';

interface SubmissionRecord {
  id: string;
  user: string;
  problem: string;
  language: string;
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error';
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
  submissions: SubmissionRecord[] = [
    { id: 'SUB-1052', user: 'NovaCoder', problem: 'Two Sum', language: 'Python', status: 'Accepted', runtime: '48ms', memory: '15.8 MB', timeAgo: 'Just now' },
    { id: 'SUB-1051', user: 'ByteWizard', problem: 'Two Sum', language: 'JavaScript', status: 'Accepted', runtime: '52ms', memory: '16.2 MB', timeAgo: '30s ago' },
    { id: 'SUB-1050', user: 'Algorist', problem: 'Two Sum', language: 'C++', status: 'Wrong Answer', runtime: '0ms', memory: '4.8 MB', timeAgo: '1m ago' },
    { id: 'SUB-1049', user: 'Cheater404', problem: 'Two Sum', language: 'Python', status: 'Time Limit Exceeded', runtime: '2000ms', memory: '12.4 MB', timeAgo: '4m ago' },
    { id: 'SUB-1048', user: 'StackOverlord', problem: 'Two Sum', language: 'Go', status: 'Accepted', runtime: '12ms', memory: '8.2 MB', timeAgo: '6m ago' }
  ];

  private intervalId: any;
  private userPool = ['NovaCoder', 'ByteWizard', 'Algorist', 'StackOverlord', 'CodeNinja', 'BitCrusher', 'SyntaxSlayer'];
  private languagePool = ['Python', 'JavaScript', 'C++', 'Go'];
  private statusPool: ('Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error')[] = [
    'Accepted', 'Accepted', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error'
  ];

  ngOnInit(): void {
    // Generate new mock submissions dynamically
    this.intervalId = setInterval(() => {
      const randomUser = this.userPool[Math.floor(Math.random() * this.userPool.length)];
      const randomLanguage = this.languagePool[Math.floor(Math.random() * this.languagePool.length)];
      const randomStatus = this.statusPool[Math.floor(Math.random() * this.statusPool.length)];
      
      let runtime = '42ms';
      let memory = '15.2 MB';
      
      if (randomStatus === 'Wrong Answer') {
        runtime = '0ms';
      } else if (randomStatus === 'Time Limit Exceeded') {
        runtime = '2000ms';
      } else if (randomStatus === 'Runtime Error') {
        runtime = '0ms';
        memory = '0 MB';
      } else {
        runtime = `${Math.floor(Math.random() * 60) + 10}ms`;
        memory = `${(Math.random() * 10 + 6).toFixed(1)} MB`;
      }

      const newId = `SUB-${Math.floor(Math.random() * 9000) + 1000}`;
      
      this.submissions.unshift({
        id: newId,
        user: randomUser,
        problem: 'Two Sum',
        language: randomLanguage,
        status: randomStatus,
        runtime,
        memory,
        timeAgo: 'Just now'
      });

      // Keep array size reasonable
      if (this.submissions.length > 20) {
        this.submissions.pop();
      }

      // Update relative time strings for other elements
      this.submissions.forEach((s, idx) => {
        if (idx === 0) return;
        if (idx === 1) s.timeAgo = '10s ago';
        else if (idx === 2) s.timeAgo = '45s ago';
        else s.timeAgo = `${idx * 2}m ago`;
      });
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
