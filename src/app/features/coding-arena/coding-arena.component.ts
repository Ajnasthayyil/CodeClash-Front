import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SubmissionResponseDto, SubmissionsService } from '../../core/services/submissions.service';
import { ProblemService } from '../../core/services/problem.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../shared/notifications/notification.service';
import { environment } from '../../../environments/environment';
import * as signalR from '@microsoft/signalr';

interface Problem {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  tags: string[];
}

interface AiMessage {
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
  typing?: boolean;
}

interface TestResult {
  id: number;
  status: 'pass' | 'fail' | 'pending';
  expected: string;
  got?: string;
}

type Language = string;

/** Maps display names → submission identifiers used by the judge. */
const LANGUAGE_DISPLAY_MAP: Record<string, string> = {
  'python':     'Python',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'csharp':     'C#',
  'c#':         'C#',
  'cpp':        'C++',
  'c++':        'C++',
  'java':       'Java',
  'go':         'Go',
  'rust':       'Rust',
};

/** Returns a minimal valid starter template for a language. */
function starterTemplate(lang: string): string {
  const l = lang.toLowerCase();
  if (l === 'python')     return '# Write your solution here\n\n';
  if (l === 'javascript') return '// Write your solution here\n\n';
  if (l === 'typescript') return '// Write your solution here\n\n';
  if (l === 'csharp' || l === 'c#') return 'using System;\n\nclass Solution {\n    // Write your solution here\n}\n';
  if (l === 'cpp'   || l === 'c++') return '#include <bits/stdc++.h>\nusing namespace std;\n\n// Write your solution here\n';
  if (l === 'java')       return 'class Solution {\n    // Write your solution here\n}\n';
  if (l === 'go')         return 'package main\n\n// Write your solution here\n';
  if (l === 'rust')       return 'fn main() {\n    // Write your solution here\n}\n';
  return '// Write your solution here\n';
}

@Component({
  selector: 'app-coding-arena',
  templateUrl: './coding-arena.component.html',
  styleUrls: ['./coding-arena.component.scss']
})
export class CodingArenaComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('aiScrollContainer') aiScrollContainer!: ElementRef;
  @ViewChild('codeEditor') codeEditor!: ElementRef;
  @ViewChild('lineNums') lineNums!: ElementRef;

  // ─── Players ───────────────────────────────────────────────────────────────
  playerName = 'NovaCoder';
  playerRating = 1544;
  playerSolved = 7;
  playerTotal = 10;

  opponentName = 'ByteWizard';
  opponentRating = 1766;
  opponentSolved = 4;
  opponentTotal = 18;

  matchId = 'CODE-CLASH-542';
  problemId = '';
  opponentCode = '';
  private battleHub: signalR.HubConnection | null = null;
  private typingTimeout: any;

  // ─── Problem ───────────────────────────────────────────────────────────────
  problem: Problem = {
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      { input: 'nums = [3,3], target = 6', output: '[0,1]' }
    ],
    constraints: [
      '2 ≤ nums.length ≤ 10⁴',
      '-10⁹ ≤ nums[i] ≤ 10⁹',
      '-10⁹ ≤ target ≤ 10⁹',
      'Only one valid answer exists'
    ],
    tags: ['Array', 'Hash Table']
  };

  // ─── Code Editor ───────────────────────────────────────────────────────────
  /** The language locked for this battle — set from route param. */
  battleLanguage: string = 'Python';
  /** Display-friendly label shown in the UI badge. */
  get battleLanguageLabel(): string {
    return LANGUAGE_DISPLAY_MAP[this.battleLanguage.toLowerCase()] ?? this.battleLanguage;
  }
  selectedLanguage: Language = 'Python';
  autoSave = true;
  autoSaveIndicator = false;

  runCodeSuccess = false;
  editorCode = '';

  onCodeChange(val: string): void {
    this.runCodeSuccess = false;

    if (this.battleHub && this.matchId) {
      this.battleHub.invoke('SendTypingStatus', this.matchId, true);
      this.battleHub.invoke('SendCodeMirror', this.matchId, val);

      if (this.typingTimeout) clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        this.battleHub?.invoke('SendTypingStatus', this.matchId, false);
      }, 1500);
    }
  }

  get codeLines(): string[] { return this.editorCode.split('\n'); }

  // ─── Terminal / Run ────────────────────────────────────────────────────────
  isRunning = false;
  isSubmitting = false;
  terminalOutput = '$ Waiting for execution...\n\nClick "Run Code" to test your solution.';
  testResults: TestResult[] = [];
  myTestsPassed = 0;
  totalTests = 10;
  lastExecutionResult: SubmissionResponseDto | null = null;

  private handleExecutionResult(result: SubmissionResponseDto): void {
    this.myTestsPassed = result.passed;
    this.totalTests = result.total;
    this.lastExecutionResult = result;
  }

  // ─── Timer ─────────────────────────────────────────────────────────────────
  timeRemainingSeconds = 15 * 60; // 15 minutes
  get timeDisplay(): string {
    const m = Math.floor(this.timeRemainingSeconds / 60);
    const s = this.timeRemainingSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  get isLowTime(): boolean { return this.timeRemainingSeconds < 180; }

  // ─── Opponent ──────────────────────────────────────────────────────────────
  opponentTestsPassed = 4;
  opponentIsTyping = false;
  isPlayer2CodeExpanded = false;

  // ─── AI Assistant ──────────────────────────────────────────────────────────
  aiInput = '';
  aiIsTyping = false;
  aiMessages: AiMessage[] = [
    {
      role: 'assistant',
      text: 'I can see you are working on Two Sum. A hash map approach will give you O(n) time complexity.',
      timestamp: '12:03'
    },
    {
      role: 'user',
      text: 'What about edge cases?',
      timestamp: '12:04'
    },
    {
      role: 'assistant',
      text: 'Handle the case where nums is empty, and check if the same element can be used twice per the constraints.',
      timestamp: '12:04'
    }
  ];

  private aiResponses: Record<string, string> = {
    'hint': 'Try using a hash map to store previously seen values. For each element, check if (target - element) exists in the map.',
    'time complexity': 'A brute force O(n²) approach uses nested loops. The optimal O(n) solution uses a hash map for constant-time lookups.',
    'space': 'The hash map approach uses O(n) space in the worst case, storing up to n elements.',
    'edge': 'Consider: empty array, duplicate numbers (like [3,3] target 6), negative numbers, and target larger than all elements.',
    'submit': 'Before submitting, make sure your solution handles all three examples correctly. Check your return type matches the expected output.',
    'stuck': 'Start simple: for each number at index i, you need to find (target - nums[i]). Store numbers you\'ve already seen in a dictionary as you iterate.',
    'help': 'I\'m here to help! You can ask me about: hints, time complexity, space complexity, edge cases, or debugging your solution.',
    'debug': 'Add a print statement to trace your seen map after each iteration. This often reveals where the logic breaks.',
    'default': 'Great question! Focus on the hash map approach — store each number\'s index as you iterate and check if the complement exists.'
  };

  // ─── Modals / UI State ─────────────────────────────────────────────────────
  showSurrenderModal = false;
  showSubmitSuccess = false;
  activePanel: 'problem' | 'hints' = 'problem';
  mobileActiveTab: 'description' | 'editor' | 'info' = 'editor';
  scrollToAi = false;

  // ─── Intervals ─────────────────────────────────────────────────────────────
  private timerInterval: any;
  private opponentInterval: any;
  private autoSaveInterval: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private submissionsService: SubmissionsService,
    private problemService: ProblemService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      this.playerName = parsed.name || this.playerName;
      this.playerRating = parsed.rating || this.playerRating;
    }

    // 1. Subscribe to route params and load active battle state
    this.route.queryParams.subscribe(params => {
      const battleId  = params['battleId'];
      const problemId = params['problemId'];
      const language  = params['language'];
      const opName    = params['opponentName'];
      const opElo     = params['opponentElo'];

      if (opName) {
        this.opponentName = opName;
      }
      if (opElo) {
        this.opponentRating = parseInt(opElo, 10);
      }

      // Lock the editor to the language chosen during matchmaking
      if (language) {
        this.battleLanguage  = language;
        this.selectedLanguage = this.battleLanguageLabel;
        this.editorCode = starterTemplate(language);
      } else {
        this.editorCode = starterTemplate(this.battleLanguage);
      }

      if (problemId) {
        this.problemId = problemId;
        this.problemService.getProblemById(problemId).subscribe({
          next: (p) => {
            this.problem = {
              title: p.title,
              difficulty: p.difficulty as any,
              description: p.statementMarkdown,
              examples: p.testCases.filter(tc => !tc.isHidden).map(tc => ({
                input: tc.input || '',
                output: tc.expectedOutput || ''
              })),
              constraints: p.constraints,
              tags: [p.category]
            };
          },
          error: (err) => {
            console.error('Failed to load problem:', err);
          }
        });
      }

      if (battleId) {
        this.matchId = battleId;
        this.connectToBattleRoom(battleId);
      }
    });

    // Countdown timer
    this.timerInterval = setInterval(() => {
      if (this.timeRemainingSeconds > 0) {
        this.timeRemainingSeconds--;
      }
    }, 1000);

    // Auto-save flash indicator
    this.autoSaveInterval = setInterval(() => {
      if (this.autoSave) {
        this.autoSaveIndicator = true;
        setTimeout(() => { this.autoSaveIndicator = false; }, 1500);
      }
    }, 30000);
  }

  private connectToBattleRoom(battleId: string): void {
    const token = this.authService.getAccessToken();
    this.battleHub = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.backendUrl}/hubs/battle`, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .build();

    this.battleHub.on('PlayerConnected', (userId) => {
      console.log('Opponent player connected:', userId);
    });

    this.battleHub.on('OpponentTyping', (isTyping) => {
      this.opponentIsTyping = isTyping;
    });

    this.battleHub.on('OpponentCodeUpdated', (code) => {
      this.opponentCode = code;
    });

    this.battleHub.on('BattleEnded', (data: any) => {
      this.notificationService.showToast('Battle Concluded!', 'success');
      this.router.navigate(['/arena/result'], {
        state: {
          battleId: battleId,
          winnerId: data.winnerId,
          winnerDelta: data.winnerDelta,
          loserDelta: data.loserDelta
        }
      });
    });

    this.battleHub.on('BattleCancelled', () => {
      this.notificationService.showToast('Battle cancelled by server.', 'warning');
      this.router.navigate(['/arena']);
    });

    this.battleHub.start().then(() => {
      this.battleHub?.invoke('JoinBattleRoom', battleId);
    }).catch(err => {
      console.error('Failed to connect to BattleHub SignalR:', err);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
    clearInterval(this.autoSaveInterval);
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    if (this.battleHub) {
      this.battleHub.stop();
    }
  }

  ngAfterViewChecked(): void {
    if (this.scrollToAi && this.aiScrollContainer) {
      const el = this.aiScrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.scrollToAi = false;
    }
  }

  // ─── Language — locked for ranked battles ──────────────────────────────────
  selectLanguage(_lang: Language): void {
    // Language is locked to the one chosen during matchmaking — no-op.
  }

  // ─── Run Code ──────────────────────────────────────────────────────────────
  runCode(): void {
    if (this.isRunning || !this.problemId) return;
    this.isRunning = true;
    this.lastExecutionResult = null;
    this.terminalOutput = '$ Submitting code to remote execution engine...\n';

    this.submissionsService.runCode(this.problemId, this.battleLanguageLabel, this.editorCode).subscribe({
      next: (res) => {
        this.isRunning = false;
        this.runCodeSuccess = true;
        this.terminalOutput = `$ Running sample tests...\n\nVerdict: ${res.status}\n`;
        if (res.compileOutput) {
          this.terminalOutput += `Compile Output:\n${res.compileOutput}\n\n`;
        }
        res.testCases.forEach((tc, idx) => {
          this.terminalOutput += `Test ${idx + 1} (${tc.status}): expected "${tc.expectedOutput}", got "${tc.actualOutput}"\n`;
        });
        this.myTestsPassed = res.passed;
        this.totalTests = res.total;
      },
      error: (err) => {
        this.isRunning = false;
        this.terminalOutput = `$ Execution Error: ${err.error?.message || 'Unknown error occurred.'}`;
      }
    });
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  submitSolution(): void {
    if (this.isSubmitting || !this.problemId) return;
    this.isSubmitting = true;
    this.lastExecutionResult = null;
    this.terminalOutput = '$ Submitting solution to validation suite...\n';

    this.submissionsService.submitCode(this.problemId, this.battleLanguageLabel, this.editorCode, this.matchId).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.myTestsPassed = res.passed;
        this.totalTests = res.total;
        this.terminalOutput = `$ Evaluating against all ${res.total} test cases...\n\nVerdict: ${res.status}\n`;
        
        if (res.status === 'Accepted') {
          this.terminalOutput += `🎉 All test cases passed! Battle Won!`;
          this.showSubmitSuccess = true;
        } else {
          this.terminalOutput += `✗ Failed: ${res.status}. Passed ${res.passed}/${res.total} test cases.`;
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.terminalOutput = `$ Submission Error: ${err.error?.message || 'Unknown error occurred.'}`;
      }
    });
  }

  // ─── AI Chat ───────────────────────────────────────────────────────────────
  sendAiMessage(): void {
    const text = this.aiInput.trim();
    if (!text || this.aiIsTyping) return;

    const now = new Date();
    const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    this.aiMessages.push({ role: 'user', text, timestamp });
    this.aiInput = '';
    this.scrollToAi = true;
    this.aiIsTyping = true;

    // Add typing indicator
    this.aiMessages.push({ role: 'assistant', text: '', timestamp, typing: true });
    this.scrollToAi = true;

    setTimeout(() => {
      // Remove typing indicator
      this.aiMessages = this.aiMessages.filter(m => !m.typing);

      const lower = text.toLowerCase();
      let response = this.aiResponses['default'];
      for (const key of Object.keys(this.aiResponses)) {
        if (lower.includes(key)) { response = this.aiResponses[key]; break; }
      }

      this.aiMessages.push({ role: 'assistant', text: response, timestamp });
      this.aiIsTyping = false;
      this.scrollToAi = true;
    }, 1200);
  }

  handleAiKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendAiMessage();
    }
  }

  syncScroll(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    if (this.lineNums) {
      this.lineNums.nativeElement.scrollTop = textarea.scrollTop;
    }
  }

  // ─── Surrender ─────────────────────────────────────────────────────────────
  confirmSurrender(): void {
    this.showSurrenderModal = false;
    if (this.battleHub && this.matchId) {
      this.battleHub.invoke('Surrender', this.matchId);
    } else {
      this.router.navigate(['/arena']);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  get opponentFillPercent(): number {
    return Math.round((this.opponentTestsPassed / this.totalTests) * 100);
  }

  get myFillPercent(): number {
    return Math.round((this.myTestsPassed / this.totalTests) * 100);
  }

  getDifficultyClass(diff: string): string {
    return diff === 'Easy' ? 'difficulty-easy' : diff === 'Medium' ? 'difficulty-medium' : 'difficulty-hard';
  }
}
