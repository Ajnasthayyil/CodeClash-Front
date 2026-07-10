import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProblemService } from '../../core/services/problem.service';

interface Problem {
  id: string;
  displayId: number;
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
export class ProblemsComponent implements OnInit {
  problems: Problem[] = [];
  filteredProblems: Problem[] = [];
  selectedDifficulty: string = 'All';
  selectedStatus: string = 'All';
  searchQuery: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private problemService: ProblemService
  ) {}

  ngOnInit(): void {
    this.loadProblems();
  }

  loadProblems(): void {
    this.isLoading = true;
    this.problemService.getProblems(1, 100, this.selectedDifficulty, undefined, this.searchQuery).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res) {
          this.problems = res.items.map((p: any, index: number) => {
            const difficulty = p.difficulty as 'Easy' | 'Medium' | 'Hard';
            const xp = difficulty === 'Easy' ? 100 : difficulty === 'Medium' ? 200 : 400;
            const hash = p.title.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
            const acceptanceRate = `${(45 + (hash % 40)).toFixed(1)}%`;
            
            return {
              id: p.problemId,
              displayId: index + 1,
              title: p.title,
              skill: p.category,
              difficulty,
              status: (p.userStatus as 'Solved' | 'Attempted' | 'Unsolved') || 'Unsolved',
              xp,
              acceptanceRate
            };
          });
          this.applyFilters();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading problems:', err);
      }
    });
  }

  applyFilters() {
    this.filteredProblems = this.problems.filter(p => {
      const matchStatus = this.selectedStatus === 'All' || p.status === this.selectedStatus;
      return matchStatus;
    });
  }

  onSearchOrDifficultyChange(): void {
    this.loadProblems();
  }

  selectProblem(problemId: string) {
    this.router.navigate(['/problems/solve', problemId]);
  }
}
