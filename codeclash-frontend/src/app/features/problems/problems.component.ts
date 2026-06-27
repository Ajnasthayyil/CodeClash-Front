import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface Problem {
  id: number;
  title: string;
  skill: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Solved' | 'Attempted' | 'Unsolved';
  xp: number;
  acceptanceRate: string;
}

@Component({
  selector: 'app-problems',
  templateUrl: './problems.component.html',
  styleUrls: ['./problems.component.scss']
})
export class ProblemsComponent {
  problems: Problem[] = [
    { id: 1, title: 'Sum of Two Prime Numbers', skill: 'Math', difficulty: 'Easy', status: 'Solved', xp: 120, acceptanceRate: '82.4%' },
    { id: 2, title: 'Debounce Execution Helper', skill: 'Async', difficulty: 'Medium', status: 'Solved', xp: 240, acceptanceRate: '56.1%' },
    { id: 3, title: 'Lexical Closures Scope Builder', skill: 'Closures', difficulty: 'Medium', status: 'Attempted', xp: 220, acceptanceRate: '61.7%' },
    { id: 4, title: 'Merge Interval Intersection', skill: 'Arrays', difficulty: 'Hard', status: 'Unsolved', xp: 450, acceptanceRate: '28.9%' },
    { id: 5, title: 'K-way Merge Array Sorter', skill: 'Arrays', difficulty: 'Hard', status: 'Unsolved', xp: 500, acceptanceRate: '19.4%' },
    { id: 6, title: 'Palindromic Substring Parser', skill: 'String', difficulty: 'Medium', status: 'Solved', xp: 200, acceptanceRate: '64.3%' },
    { id: 7, title: 'Lazy Evaluation Stream Generator', skill: 'Functions', difficulty: 'Medium', status: 'Unsolved', xp: 250, acceptanceRate: '43.8%' },
    { id: 8, title: 'Custom Redux Dispatcher Store', skill: 'Functions', difficulty: 'Hard', status: 'Attempted', xp: 400, acceptanceRate: '31.2%' }
  ];

  filteredProblems: Problem[] = [];
  selectedDifficulty: string = 'All';
  selectedStatus: string = 'All';
  searchQuery: string = '';

  constructor(private router: Router) {
    this.filteredProblems = [...this.problems];
  }

  applyFilters() {
    this.filteredProblems = this.problems.filter(p => {
      const matchDiff = this.selectedDifficulty === 'All' || p.difficulty === this.selectedDifficulty;
      const matchStatus = this.selectedStatus === 'All' || p.status === this.selectedStatus;
      const matchSearch = p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                          p.skill.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchDiff && matchStatus && matchSearch;
    });
  }

  selectProblem(problemId: number) {
    // Navigate to the practice arena route
    this.router.navigate(['/problems/solve', problemId]);
  }
}
