import { Component, OnInit } from '@angular/core';
import { ProblemService, ProblemSummaryDto } from '../../../core/services/problem.service';

interface NewTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

@Component({
  selector: 'app-problem-management',
  templateUrl: './problem-management.component.html',
  styleUrls: ['./problem-management.component.scss']
})
export class ProblemManagementComponent implements OnInit {
  problems: ProblemSummaryDto[] = [];
  isLoading = false;
  isCreateModalOpen = false;
  isEditMode = false;
  editingProblemId: string | null = null;

  // New Problem Form Data
  newTitle = '';
  newDifficulty = 'Easy';
  newCategory = 'Arrays';
  newStatementMarkdown = '';
  newConstraints: string[] = [''];
  newTimeLimitMs = 2000;
  newMemoryLimitMb = 256;
  newTestCases: NewTestCase[] = [
    { input: '', expectedOutput: '', isHidden: false },
    { input: '', expectedOutput: '', isHidden: true }
  ];

  // Allowed Languages selection dictionary
  allowedLangs: Record<string, boolean> = {
    csharp: true,
    javascript: true,
    python: true,
    cpp: false,
    java: false
  };

  // Valid options for inputs
  validDifficulties = ['Easy', 'Medium', 'Hard'];
  validCategories = [
    'Arrays', 'Strings', 'LinkedLists', 'Trees', 'Graphs',
    'Contests', 'DynamicProgramming', 'Backtracking', 'BinarySearch',
    'Sorting', 'Hashing', 'TwoPointers', 'SlidingWindow', 'Math', 'Greedy', 'BitManipulation'
  ];

  successMessage = '';
  errorMessage = '';

  constructor(private problemService: ProblemService) {}

  ngOnInit(): void {
    this.loadProblems();
  }

  loadProblems(): void {
    this.isLoading = true;
    this.problemService.getProblems(1, 100).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success && res.data) {
          this.problems = res.data.items;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading problems:', err);
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingProblemId = null;
    this.newTitle = '';
    this.newDifficulty = 'Easy';
    this.newCategory = 'Arrays';
    this.newStatementMarkdown = '';
    this.newConstraints = [''];
    this.newTimeLimitMs = 2000;
    this.newMemoryLimitMb = 256;
    this.newTestCases = [
      { input: '', expectedOutput: '', isHidden: false },
      { input: '', expectedOutput: '', isHidden: true }
    ];
    this.allowedLangs = {
      csharp: true,
      javascript: true,
      python: true,
      cpp: false,
      java: false
    };
    this.errorMessage = '';
    this.successMessage = '';
    this.isCreateModalOpen = true;
  }

  openEditModal(problem: ProblemSummaryDto): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.problemService.getProblemById(problem.id).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success && res.data) {
          const detail = res.data;
          this.isEditMode = true;
          this.editingProblemId = problem.id;
          
          this.newTitle = detail.title;
          this.newDifficulty = detail.difficulty;
          this.newCategory = detail.category;
          this.newStatementMarkdown = detail.statementMarkdown;
          this.newConstraints = detail.constraints && detail.constraints.length > 0 ? [...detail.constraints] : [''];
          this.newTimeLimitMs = detail.timeLimitMs;
          this.newMemoryLimitMb = detail.memoryLimitMb;
          this.newTestCases = detail.testCases.map(tc => ({
            input: tc.input || '',
            expectedOutput: tc.expectedOutput || '',
            isHidden: tc.isHidden
          }));
          
          const langs = detail.allowedLanguages.map(l => l.toLowerCase());
          this.allowedLangs = {
            csharp: langs.includes('csharp'),
            javascript: langs.includes('javascript') || langs.includes('js'),
            python: langs.includes('python'),
            cpp: langs.includes('cpp') || langs.includes('c++'),
            java: langs.includes('java')
          };
          
          this.isCreateModalOpen = true;
        } else {
          this.errorMessage = res.message || 'Failed to load problem details.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading problem by ID:', err);
        this.errorMessage = err.error?.message || 'An error occurred while loading problem details.';
      }
    });
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
  }

  addConstraint(): void {
    this.newConstraints.push('');
  }

  removeConstraint(index: number): void {
    if (this.newConstraints.length > 1) {
      this.newConstraints.splice(index, 1);
    }
  }

  addTestCase(): void {
    this.newTestCases.push({ input: '', expectedOutput: '', isHidden: false });
  }

  removeTestCase(index: number): void {
    if (this.newTestCases.length > 1) {
      this.newTestCases.splice(index, 1);
    }
  }

  submitForm(): void {
    if (this.isEditMode) {
      this.updateProblemSubmit();
    } else {
      this.createProblem();
    }
  }

  createProblem(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Validate inputs
    if (!this.newTitle.trim()) {
      this.errorMessage = 'Title is required.';
      this.isLoading = false;
      return;
    }
    if (!this.newStatementMarkdown.trim()) {
      this.errorMessage = 'Statement is required.';
      this.isLoading = false;
      return;
    }

    // Prepare payload
    const selectedLanguages = Object.keys(this.allowedLangs).filter(k => this.allowedLangs[k]);
    if (selectedLanguages.length === 0) {
      this.errorMessage = 'At least one allowed language is required.';
      this.isLoading = false;
      return;
    }

    const cleanedConstraints = this.newConstraints.filter(c => c.trim() !== '');

    const payload = {
      title: this.newTitle.trim(),
      difficulty: this.newDifficulty,
      category: this.newCategory,
      statementMarkdown: this.newStatementMarkdown.trim(),
      constraints: cleanedConstraints,
      allowedLanguages: selectedLanguages,
      timeLimitMs: this.newTimeLimitMs,
      memoryLimitMb: this.newMemoryLimitMb,
      testCases: this.newTestCases.map(tc => ({
        input: tc.input.trim(),
        expectedOutput: tc.expectedOutput.trim(),
        isHidden: tc.isHidden
      }))
    };

    this.problemService.createProblem(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success) {
          this.successMessage = 'Problem created successfully!';
          setTimeout(() => {
            this.closeCreateModal();
            this.loadProblems();
          }, 1500);
        } else {
          this.errorMessage = res.message || 'Failed to create problem.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error creating problem:', err);
        if (err.error && err.error.errors && err.error.errors.length > 0) {
          this.errorMessage = err.error.errors.join(' ');
        } else {
          this.errorMessage = err.error?.message || 'An error occurred while creating the problem.';
        }
      }
    });
  }

  updateProblemSubmit(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newTitle.trim()) {
      this.errorMessage = 'Title is required.';
      this.isLoading = false;
      return;
    }
    if (!this.newStatementMarkdown.trim()) {
      this.errorMessage = 'Statement is required.';
      this.isLoading = false;
      return;
    }

    const selectedLanguages = Object.keys(this.allowedLangs).filter(k => this.allowedLangs[k]);
    if (selectedLanguages.length === 0) {
      this.errorMessage = 'At least one allowed language is required.';
      this.isLoading = false;
      return;
    }

    const cleanedConstraints = this.newConstraints.filter(c => c.trim() !== '');

    const payload = {
      title: this.newTitle.trim(),
      difficulty: this.newDifficulty,
      category: this.newCategory,
      statementMarkdown: this.newStatementMarkdown.trim(),
      constraints: cleanedConstraints,
      allowedLanguages: selectedLanguages,
      timeLimitMs: this.newTimeLimitMs,
      memoryLimitMb: this.newMemoryLimitMb,
      testCases: this.newTestCases.map(tc => ({
        input: tc.input.trim(),
        expectedOutput: tc.expectedOutput.trim(),
        isHidden: tc.isHidden
      })),
      isActive: null
    };

    this.problemService.updateProblem(this.editingProblemId!, payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success) {
          this.successMessage = 'Problem updated successfully!';
          setTimeout(() => {
            this.closeCreateModal();
            this.loadProblems();
          }, 1500);
        } else {
          this.errorMessage = res.message || 'Failed to update problem.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error updating problem:', err);
        if (err.error && err.error.errors && err.error.errors.length > 0) {
          this.errorMessage = err.error.errors.join(' ');
        } else {
          this.errorMessage = err.error?.message || 'An error occurred while updating the problem.';
        }
      }
    });
  }

  togglePublishProblem(problem: ProblemSummaryDto): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // First load full details to get current constraints, languages, testcases
    this.problemService.getProblemById(problem.id).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const detail = res.data;
          const updatedPayload = {
            title: detail.title,
            difficulty: detail.difficulty,
            category: detail.category,
            statementMarkdown: detail.statementMarkdown,
            constraints: detail.constraints,
            allowedLanguages: detail.allowedLanguages,
            timeLimitMs: detail.timeLimitMs,
            memoryLimitMb: detail.memoryLimitMb,
            testCases: detail.testCases.map(tc => ({
              input: tc.input || '',
              expectedOutput: tc.expectedOutput || '',
              isHidden: tc.isHidden
            })),
            isActive: !problem.isActive // Toggle active state
          };

          this.problemService.updateProblem(problem.id, updatedPayload).subscribe({
            next: (updateRes) => {
              this.isLoading = false;
              if (updateRes && updateRes.success) {
                problem.isActive = !problem.isActive;
                this.successMessage = `Problem ${problem.isActive ? 'published' : 'unpublished'} successfully!`;
                setTimeout(() => this.successMessage = '', 3000);
              } else {
                this.errorMessage = updateRes.message || 'Failed to update problem.';
              }
            },
            error: (err) => {
              this.isLoading = false;
              this.errorMessage = err.error?.message || 'An error occurred while updating the problem.';
            }
          });
        } else {
          this.isLoading = false;
          this.errorMessage = 'Failed to load problem details.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred while loading problem details.';
      }
    });
  }

  deleteProblem(problemId: string): void {
    if (confirm('Are you sure you want to delete this problem? This action cannot be undone.')) {
      this.isLoading = true;
      this.problemService.deleteProblem(problemId).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res && res.success) {
            this.successMessage = 'Problem deleted successfully!';
            setTimeout(() => {
              this.successMessage = '';
              this.loadProblems();
            }, 1500);
          } else {
            this.errorMessage = res.message || 'Failed to delete problem.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'An error occurred while deleting the problem.';
        }
      });
    }
  }
}
