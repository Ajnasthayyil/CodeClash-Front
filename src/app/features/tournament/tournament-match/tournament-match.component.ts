import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tournament-match',
  templateUrl: './tournament-match.component.html',
  styleUrls: ['./tournament-match.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TournamentMatchComponent implements OnInit, OnDestroy {
  @ViewChild('codeEditor') codeEditor!: ElementRef;

  // Metadata
  tournamentId = '';
  matchId = '';
  
  // Timer
  matchDurationSeconds = 45 * 60; // 45 minutes
  timeRemaining = this.matchDurationSeconds;
  private timerInterval: any;

  // Opponent Status
  opponentName = 'AlgoKing99';
  opponentStatus = 'Coding...';
  opponentTestsPassed = 0;
  totalTests = 10;
  private opponentSimInterval: any;

  // Editor & Execution
  languages = ['Python', 'JavaScript', 'C++', 'Go'];
  selectedLanguage = 'Python';
  currentCode = 'def longest_valid_parentheses(s):\n    # Write your solution here\n    pass';
  
  isRunning = false;
  isSubmitting = false;
  terminalOutput = '$ Waiting for execution...\n\nClick "Run Code" to test your solution.';
  
  myTestsPassed = 0;
  runCodeSuccess = false;
  showSubmitSuccess = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.tournamentId = params.get('id') || '';
      this.matchId = params.get('matchId') || '';
    });

    // Start timer
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) this.timeRemaining--;
    }, 1000);

    // Simulate opponent progress
    this.simulateOpponent();
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
    clearInterval(this.opponentSimInterval);
  }

  getDisplayTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  get myFillPercent(): number {
    return Math.round((this.myTestsPassed / this.totalTests) * 100);
  }

  get oppFillPercent(): number {
    return Math.round((this.opponentTestsPassed / this.totalTests) * 100);
  }

  selectLanguage(lang: string): void {
    this.selectedLanguage = lang;
  }

  get codeLines(): string[] { return this.currentCode.split('\n'); }

  runCode(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.terminalOutput = '$ Submitting code to remote execution engine...\n';
    
    setTimeout(() => {
      this.isRunning = false;
      this.myTestsPassed = 7;
      this.runCodeSuccess = true;
      this.terminalOutput += '🎉 7/10 tests passed!\nRuntime: 45ms | Memory: 14.2 MB';
    }, 1500);
  }

  submitSolution(): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.terminalOutput = '$ Submitting final solution...\n';

    setTimeout(() => {
      this.isSubmitting = false;
      this.myTestsPassed = 10;
      this.terminalOutput += '🎉 All 10/10 tests passed! You won the match!\n';
      this.showSubmitSuccess = true;
      
      // Stop opponent simulation since we won
      clearInterval(this.opponentSimInterval);
      this.opponentStatus = 'Defeated';
      
      setTimeout(() => { this.showSubmitSuccess = false; }, 5000);
    }, 2000);
  }

  private simulateOpponent(): void {
    this.opponentSimInterval = setInterval(() => {
      if (this.opponentTestsPassed < 8) {
        this.opponentTestsPassed++;
        this.opponentStatus = `Passed ${this.opponentTestsPassed}/10 tests`;
      } else {
        this.opponentStatus = 'Debugging...';
      }
    }, 8000); // Opponent passes a test every 8 seconds
  }
}
