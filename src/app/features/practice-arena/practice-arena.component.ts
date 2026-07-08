import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProblemService, ProblemDetailDto } from '../../core/services/problem.service';
import { SubmissionsService, SubmissionResponseDto, Result } from '../../core/services/submissions.service';

interface ProblemDetails {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  tags: string[];
}

interface TestResult {
  id: number;
  status: 'pass' | 'fail' | 'pending';
  expected: string;
  got?: string;
}

type Language = 'Python' | 'JavaScript' | 'C++' | 'Go';

@Component({
  selector: 'app-practice-arena',
  templateUrl: './practice-arena.component.html',
  styleUrls: ['./practice-arena.component.scss']
})
export class PracticeArenaComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('codeEditor') codeEditor!: ElementRef;

  problem: ProblemDetails | null = null;
  isLoading = true;
  errorMessage = '';

  // ─── Code Editor ───────────────────────────────────────────────────────────
  languages: Language[] = ['Python', 'JavaScript', 'C++', 'Go'];
  selectedLanguage: Language = 'Python';
  autoSave = true;
  autoSaveIndicator = false;

  codeSnippets: Partial<Record<Language, string>> = {};

  get currentCode(): string { return this.codeSnippets[this.selectedLanguage] || ''; }
  set currentCode(val: string) { this.codeSnippets[this.selectedLanguage] = val; }

  get codeLines(): string[] { return this.currentCode.split('\n'); }

  // ─── Terminal / Run ────────────────────────────────────────────────────────
  isRunning = false;
  isSubmitting = false;
  terminalOutput = '$ Waiting for execution...\n\nClick "Run Code" to test your solution.';
  myTestsPassed = 0;
  totalTests = 10;

  // ─── Modals / UI State ─────────────────────────────────────────────────────
  showSubmitSuccess = false;
  activePanel: 'problem' | 'hints' = 'problem';
  mobileActiveTab: 'description' | 'editor' = 'description';
  latestSubmissionId: string | null = null;
  lastExecutionResult: SubmissionResponseDto | null = null;

  // ─── Intervals ─────────────────────────────────────────────────────────────
  private autoSaveInterval: any;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private problemService: ProblemService,
    private submissionsService: SubmissionsService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const problemIdStr = params.get('id');
      if (problemIdStr) {
        this.fetchProblemDetails(problemIdStr);
      } else {
        this.errorMessage = 'Invalid Problem ID';
        this.isLoading = false;
      }
    });

    // Auto-save flash indicator
    this.autoSaveInterval = setInterval(() => {
      if (this.autoSave && !this.isLoading) {
        this.autoSaveIndicator = true;
        setTimeout(() => { this.autoSaveIndicator = false; }, 1500);
      }
    }, 30000);
  }

  fetchProblemDetails(problemId: string): void {
    this.isLoading = true;
    this.problemService.getProblemById(problemId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res) {
          const dto = res;
          
          // Filter test cases that aren't hidden to use as examples
          const visibleTestCases = dto.testCases
            ?.filter(tc => !tc.isHidden)
            .map(tc => ({
              input: tc.input || '',
              output: tc.expectedOutput || ''
            })) || [];

          this.problem = {
            id: dto.problemId,
            title: dto.title,
            difficulty: dto.difficulty,
            description: dto.statementMarkdown, // Assuming markdown or HTML is returned
            constraints: dto.constraints || [],
            tags: dto.category ? [dto.category] : [],
            examples: visibleTestCases
          };
          
          // Update total tests for the mock terminal progress
          this.totalTests = dto.testCases?.length || 10;

          // Update available languages if provided by backend
          if (dto.allowedLanguages && dto.allowedLanguages.length > 0) {
            this.languages = dto.allowedLanguages as Language[];
            if (!this.languages.includes(this.selectedLanguage)) {
              this.selectedLanguage = this.languages[0];
            }
          }

          this.generateBoilerplate(this.problem.title);
        } else {
          this.errorMessage = (res as any)?.message || 'Failed to load problem details.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred while fetching the problem.';
        console.error(err);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  ngAfterViewChecked(): void {}

  private generateBoilerplate(title: string) {
    const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const camelTitle = cleanTitle.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
    
    this.codeSnippets = {
      'Python': `def ${cleanTitle}(*args, **kwargs):\n    # Write your Python solution for ${title} here\n    return None`,
      'JavaScript': `function ${camelTitle}(...args) {\n    // Write your JavaScript solution for ${title} here\n    return null;\n}`,
      'C++': `class Solution {\npublic:\n    // Write your C++ solution for ${title} here\n};`,
      'Go': `func ${camelTitle}() {\n    // Write your Go solution for ${title} here\n}`
    };
  }

  // ─── Language ──────────────────────────────────────────────────────────────
  selectLanguage(lang: Language): void {
    this.selectedLanguage = lang;
  }

  // ─── Run Code ──────────────────────────────────────────────────────────────
  runCode(): void {
    if (this.isRunning || !this.problem) return;
    this.isRunning = true;
    this.lastExecutionResult = null;
    this.terminalOutput = '$ Submitting code to remote execution engine...\n';

    this.submissionsService.runCode(this.problem.id, this.selectedLanguage, this.currentCode).subscribe({
      next: (response: SubmissionResponseDto) => {
        this.isRunning = false;
        this.handleExecutionResult(response);
      },
      error: (err) => {
        this.isRunning = false;
        this.terminalOutput += `\nHTTP Error: Could not connect to the execution server.\n`;
        console.error(err);
      }
    });
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  submitSolution(): void {
    if (this.isSubmitting || !this.problem) return;
    this.isSubmitting = true;
    this.lastExecutionResult = null;
    this.terminalOutput = '$ Submitting solution against test suite...\n';

    this.submissionsService.submitCode(this.problem.id, this.selectedLanguage, this.currentCode).subscribe({
      next: (response: SubmissionResponseDto) => {
        this.isSubmitting = false;
        this.latestSubmissionId = response.submissionId;
        this.handleExecutionResult(response);
        
        if (response.passed === response.total && response.status === 'Accepted' && this.problem) {
          this.showSubmitSuccess = true;
          // Mark as solved in UI if not already
          if (!this.problem.title.includes('(Solved)')) {
            this.problem.title = `${this.problem.title} (Solved)`;
          }
          setTimeout(() => { this.showSubmitSuccess = false; }, 5000);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.terminalOutput += `\nHTTP Error: Could not connect to the execution server.\n`;
        console.error(err);
      }
    });
  }

  private handleExecutionResult(result: SubmissionResponseDto): void {
    this.myTestsPassed = result.passed;
    this.totalTests = result.total;
    this.lastExecutionResult = result;
    
    this.terminalOutput += `\n$ Evaluating against all ${result.total} test cases...\n\n`;

    if (result.status === 'CompileError' || result.status === 'CompilationError') {
      this.terminalOutput += `✗ Compilation Error:\n${result.compileOutput || 'Unknown error'}\n`;
      return;
    }

    if (result.status === 'InternalError') {
      this.terminalOutput += `✗ Internal Error: Could not execute code properly.\n${result.compileOutput || ''}\n`;
      return;
    }

    if (result.status === 'Accepted') {
      this.terminalOutput += `🎉 All ${result.passed}/${result.total} tests passed!\n`;
      this.terminalOutput += `Runtime: ${result.executionTime}ms | Memory: ${(result.memory / (1024 * 1024)).toFixed(1)} MB\n`;
    } else {
      this.terminalOutput += `✗ ${this.formatStatus(result.status)}\n`;
      this.terminalOutput += `Passed: ${result.passed}/${result.total} tests.\n`;
      if (result.compileOutput) {
        this.terminalOutput += `\nOutput logs:\n${result.compileOutput}\n`;
      }
    }
  }

  private formatStatus(status: string): string {
    return status.replace(/([A-Z])/g, ' $1').trim();
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  get myFillPercent(): number {
    return this.totalTests > 0 ? Math.round((this.myTestsPassed / this.totalTests) * 100) : 0;
  }

  getDifficultyClass(diff: string): string {
    return diff === 'Easy' ? 'difficulty-easy' : diff === 'Medium' ? 'difficulty-medium' : 'difficulty-hard';
  }

  analyzeWithAI(): void {
    if (this.latestSubmissionId) {
      this.router.navigate(['/arena/analysis'], { queryParams: { submissionId: this.latestSubmissionId } });
    }
  }
}
