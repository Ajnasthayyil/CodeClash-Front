import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  selectedTech = 'TypeScript';
  technologies = [
    { id: 'React', name: 'React', version: 'v18.2', speed: '0.04ms', desc: 'Front-end assessments with automated Virtual DOM rendering tests.' },
    { id: 'TypeScript', name: 'TypeScript', version: 'v5.3', speed: '0.03ms', desc: 'Full type-checking compiler verification with strict mode enabled.' },
    { id: 'NodeJS', name: 'Node.js', version: 'v20.10', speed: '0.02ms', desc: 'Secure backend sandboxes with sandbox memory allocation tracking.' },
    { id: 'NextJS', name: 'Next.js', version: 'v14.0', speed: '0.05ms', desc: 'Full Server-side rendering (SSR) test automation builds.' },
    { id: 'Docker', name: 'Docker', version: 'v24.0', speed: '0.12ms', desc: 'Isolate candidate execution runs inside clean container templates.' },
    { id: 'AWS', name: 'AWS', version: 'SDK v3', speed: '0.08ms', desc: 'Simulated cloud architecture and database infrastructure queries.' },
    { id: 'GitHub', name: 'GitHub', version: 'API v3', speed: '0.04ms', desc: 'Integrate automated pull request grading and code checkbacks.' },
    { id: 'MongoDB', name: 'MongoDB', version: 'v7.0', speed: '0.06ms', desc: 'Evaluate NoSQL queries and schema optimization solutions.' },
    { id: 'Redis', name: 'Redis', version: 'v7.2', speed: '0.01ms', desc: 'In-memory caching code speed testing and latency scorecards.' },
    { id: 'Python', name: 'Python', version: 'v3.11', speed: '0.04ms', desc: 'Automated test suite runner supporting unittest, pytest, and poetry.' },
    { id: 'Rust', name: 'Rust', version: 'v1.75', speed: '0.01ms', desc: 'Compile verification loops with cargo test and safety analysis.' },
    { id: 'Postgres', name: 'PostgreSQL', version: 'v16.1', speed: '0.03ms', desc: 'Automated relational SQL query syntax checking and query planning.' }
  ];

  get activeTech() {
    return this.technologies.find(t => t.id === this.selectedTech) || this.technologies[0];
  }

  selectTech(techId: string) {
    this.selectedTech = techId;
  }
}
