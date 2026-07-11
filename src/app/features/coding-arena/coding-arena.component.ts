import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProblemService, ProblemDetailDto } from '../../core/services/problem.service';
import { SubmissionsService, SubmissionResponseDto } from '../../core/services/submissions.service';
import { NotificationService } from '../../shared/notifications/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

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

type Language = 'csharp' | 'python' | 'javascript' | 'cpp' | 'java' | 'go' | 'rust';

@Component({
  selector: 'app-coding-arena',
  templateUrl: './coding-arena.component.html',
  styleUrls: ['./coding-arena.component.scss']
})
export class CodingArenaComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('aiScrollContainer') aiScrollContainer!: ElementRef;
  @ViewChild('codeEditor') codeEditor!: ElementRef;

  // ─── Players ───────────────────────────────────────────────────────────────
  playerName = 'Player';
  playerRating = 1200;
  playerSolved = 0;
  playerTotal = 10;

  opponentName = 'Opponent';
  opponentRating = 1200;
  opponentSolved = 0;
  opponentTotal = 10;

  matchId = 'CUSTOM-DUEL';
  roomId = '';
  currentUser: any = null;

  // ─── Problem ───────────────────────────────────────────────────────────────
  problemId = '';
  problem: Problem | null = null;
  allowedLanguages: string[] = [];

  // ─── Code Editor ───────────────────────────────────────────────────────────
  languages: Language[] = ['csharp', 'python', 'javascript', 'cpp', 'java', 'go', 'rust'];
  selectedLanguage: Language = 'python';
  autoSave = true;
  autoSaveIndicator = false;

  codeSnippets: Record<Language, string> = {
    'csharp': `public class Solution {\n    public int[] TwoSum(int[] nums, int target) {\n        return new int[] {};\n    }\n}`,
    'python': `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass`,
    'javascript': `var twoSum = function(nums, target) {\n\n};`,
    'cpp': `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};`,
    'java': `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}`,
    'go': `func twoSum(nums []int, target int) []int {\n    return nil\n}`,
    'rust': `impl Solution {\n    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n        \n    }\n}`
  };

  runCodeSuccess = false;

  get currentCode(): string { return this.codeSnippets[this.selectedLanguage]; }
  set currentCode(val: string) { 
    this.codeSnippets[this.selectedLanguage] = val; 
    this.runCodeSuccess = false;
  }

  get codeLines(): string[] { return this.currentCode.split('\n'); }

  // ─── Terminal / Run ────────────────────────────────────────────────────────
  isRunning = false;
  isSubmitting = false;
  terminalOutput = '$ Waiting for execution...\n\nClick "Run Code" to test your solution.';
  testResults: TestResult[] = [];
  myTestsPassed = 0;
  totalTests = 3;
  lastExecutionResult: SubmissionResponseDto | null = null;

  // ─── Timer ─────────────────────────────────────────────────────────────────
  timeRemainingSeconds = 30 * 60; // 30 minutes for custom duel
  get timeDisplay(): string {
    const m = Math.floor(this.timeRemainingSeconds / 60);
    const s = this.timeRemainingSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  get isLowTime(): boolean { return this.timeRemainingSeconds < 180; }

  // ─── Opponent Progress ─────────────────────────────────────────────────────
  opponentTestsPassed = 0;
  opponentIsTyping = false;
  opponentLeft = false;
  isPlayer2CodeExpanded = false;

  // ─── AI Assistant ──────────────────────────────────────────────────────────
  aiInput = '';
  aiIsTyping = false;
  aiMessages: AiMessage[] = [
    {
      role: 'assistant',
      text: 'Welcome to the Coding Arena. Solve the problem as fast as possible to beat your opponent!',
      timestamp: '12:00'
    }
  ];

  // ─── Modals / UI State ─────────────────────────────────────────────────────
  showSurrenderModal = false;
  showSubmitSuccess = false;
  showVictoryModal = false;
  showDefeatModal = false;
  activePanel: 'problem' | 'hints' = 'problem';
  mobileActiveTab: 'description' | 'editor' | 'info' = 'editor';
  scrollToAi = false;

  // ─── Intervals ─────────────────────────────────────────────────────────────
  private timerInterval: any;
  private autoSaveInterval: any;
  private signalRListeners: { event: string; handler: (...args: any[]) => void }[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private problemService: ProblemService,
    private submissionsService: SubmissionsService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.playerName = this.currentUser?.name || this.currentUser?.username || 'You';

    // Parse room parameter from URL query params
    this.route.queryParams.subscribe(params => {
      const roomParam = params['room'];
      if (roomParam) {
        this.roomId = roomParam;
        this.loadDuelRoomDetails(roomParam);
      } else {
        // Fallback for direct practice or demo
        this.loadDemoProblem();
      }
    });

    // Countdown timer
    this.timerInterval = setInterval(() => {
      if (this.timeRemainingSeconds > 0) {
        this.timeRemainingSeconds--;
      } else {
        // Time expired, trigger defeat
        this.showDefeatModal = true;
        clearInterval(this.timerInterval);
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

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
    clearInterval(this.autoSaveInterval);
    this.cleanupSignalRListeners();
  }

  ngAfterViewChecked(): void {
    if (this.scrollToAi && this.aiScrollContainer) {
      const el = this.aiScrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.scrollToAi = false;
    }
  }

  // ─── Custom Duel Room Loading ──────────────────────────────────────────────
  private loadDuelRoomDetails(roomId: string): void {
    this.http.get<any>(`${environment.apiUrl}/customduel/${roomId}`)
      .subscribe({
        next: (room) => {
          this.matchId = `ROOM: ${room.roomCode}`;
          this.opponentLeft = this.currentUser?.id === room.hostUserId ? room.hasFriendLeft : room.hasHostLeft;

          // Identify players
          if (this.currentUser?.id === room.hostUserId) {
            this.playerName = room.hostUsername;
            this.opponentName = room.friendUsername;
          } else {
            this.playerName = room.friendUsername;
            this.opponentName = room.hostUsername;
          }

          if (room.selectedProblemId) {
            this.problemId = room.selectedProblemId;
            this.loadProblemDetails(room.selectedProblemId);
          }

          this.setupSignalRListeners();
        },
        error: (err) => {
          console.error('Failed to load custom duel room', err);
          this.notificationService.showToast('Failed to load duel lobby details.', 'error', 3000);
          this.loadDemoProblem();
        }
      });
  }

  private loadProblemDetails(problemId: string): void {
    this.problemService.getProblemById(problemId)
      .subscribe({
        next: (p: ProblemDetailDto) => {
          // Parse constraints and examples
          const examples = p.testCases.filter(tc => !tc.isHidden).map((tc, idx) => {
            return {
              input: tc.input || '',
              output: tc.expectedOutput || '',
              explanation: idx === 0 ? 'Example explanation.' : undefined
            };
          });

          this.problem = {
            title: p.title,
            difficulty: p.difficulty as any,
            description: p.statementMarkdown,
            examples: examples,
            constraints: p.constraints || [],
            tags: [p.category]
          };

          this.totalTests = p.testCases.length;
          this.allowedLanguages = p.allowedLanguages;

          // Populate starter code snippets if returned
          if (p.languageTemplates && p.languageTemplates.length > 0) {
            p.languageTemplates.forEach(template => {
              const langKey = template.language.toLowerCase() as Language;
              if (this.codeSnippets[langKey] !== undefined) {
                this.codeSnippets[langKey] = template.starterCode;
              }
            });
          }

          // Select first allowed language
          if (p.allowedLanguages && p.allowedLanguages.length > 0) {
            const firstAllowed = p.allowedLanguages[0].toLowerCase() as Language;
            if (this.languages.includes(firstAllowed)) {
              this.selectedLanguage = firstAllowed;
            }
          }
        },
        error: (err) => console.error('Failed to load problem details', err)
      });
  }

  private loadDemoProblem(): void {
    this.problem = {
      title: 'Two Sum',
      difficulty: 'Easy',
      description: 'Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to target.',
      examples: [
        { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }
      ],
      constraints: ['2 ≤ nums.length ≤ 10⁴'],
      tags: ['Array']
    };
    this.totalTests = 3;
  }

  // ─── SignalR Events ────────────────────────────────────────────────────────
  private setupSignalRListeners(): void {
    const hub = this.notificationService.getHubConnection();
    if (!hub) return;

    // Join room group
    hub.invoke('JoinRoom', this.roomId).catch(err => console.error(err));

    const listeners = [
      {
        event: 'PlayerLeft',
        handler: (data: any) => {
          if (data.roomId === this.roomId && data.userId !== this.currentUser?.id) {
            this.opponentLeft = true;
            this.notificationService.showToast(`${this.opponentName} has left the duel! You can still submit to win.`, 'warning', 5000);
          }
        }
      },
      {
        event: 'DuelEnded',
        handler: (data: any) => {
          if (data.roomId === this.roomId) {
            clearInterval(this.timerInterval);
            if (data.winnerId === this.currentUser?.id) {
              this.showVictoryModal = true;
              this.notificationService.showToast('VICTORY! You won the duel!', 'success', 5000);
              
              // Increment local user score/points
              if (this.currentUser) {
                this.currentUser.rating = (this.currentUser.rating || 1200) + 15;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
              }
            } else {
              this.showDefeatModal = true;
              this.notificationService.showToast('DEFEAT! Your opponent solved the problem first.', 'error', 5000);
            }
          }
        }
      }
    ];

    listeners.forEach(l => {
      hub.on(l.event, l.handler);
      this.signalRListeners.push(l);
    });
  }

  private cleanupSignalRListeners(): void {
    const hub = this.notificationService.getHubConnection();
    if (hub) {
      this.signalRListeners.forEach(l => hub.off(l.event, l.handler));
      if (this.roomId) {
        hub.invoke('LeaveRoom', this.roomId).catch(err => console.error(err));
      }
    }
    this.signalRListeners = [];
  }

  // ─── Language ──────────────────────────────────────────────────────────────
  selectLanguage(lang: Language): void {
    this.selectedLanguage = lang;
  }

  // ─── Run Code ──────────────────────────────────────────────────────────────
  runCode(): void {
    if (this.isRunning || !this.problemId) return;
    this.isRunning = true;
    this.lastExecutionResult = null;
    this.terminalOutput = '$ Compiling and executing code against sample test cases...\n';

    this.submissionsService.runCode(this.problemId, this.selectedLanguage, this.currentCode)
      .subscribe({
        next: (res) => {
          this.isRunning = false;
          this.lastExecutionResult = res;
          this.myTestsPassed = res.passed;
          this.totalTests = res.total;

          this.terminalOutput = `$ Execution Result: ${res.status}\n`;
          this.terminalOutput += `Passed: ${res.passed}/${res.total} test cases\n`;
          this.terminalOutput += `Execution Time: ${res.executionTime} ms\n`;
          this.terminalOutput += `Memory Used: ${(res.memory / 1024 / 1024).toFixed(2)} MB\n`;

          if (res.compileOutput) {
            this.terminalOutput += `\nCompiler Output:\n${res.compileOutput}\n`;
          }

          if (res.status === 'Accepted') {
            this.runCodeSuccess = true;
            this.terminalOutput += `\n✓ All sample test cases passed successfully!`;
          } else {
            this.runCodeSuccess = false;
            this.terminalOutput += `\n✗ Some test cases failed or encountered runtime errors.`;
          }
        },
        error: (err) => {
          this.isRunning = false;
          this.terminalOutput = `$ Remote compiler error:\n${err.error?.message || err.message}`;
        }
      });
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  submitSolution(): void {
    if (this.isSubmitting || !this.problemId) return;
    this.isSubmitting = true;
    this.lastExecutionResult = null;
    this.terminalOutput = '$ Submitting code to remote verification server...\n';

    this.submissionsService.submitCode(this.problemId, this.selectedLanguage, this.currentCode)
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.lastExecutionResult = res;
          this.myTestsPassed = res.passed;
          this.totalTests = res.total;

          this.terminalOutput = `$ Evaluation Finished: ${res.status}\n`;
          this.terminalOutput += `Passed: ${res.passed}/${res.total} test cases\n`;

          if (res.status === 'Accepted') {
            this.showSubmitSuccess = true;
            this.notificationService.showToast('Solution Accepted! Processing duel result...', 'success', 3000);
            
            // Redirect to matchmaking screen lobby or Dashboard after 2s
            setTimeout(() => {
              this.showSubmitSuccess = false;
              this.router.navigate(['/arena']);
            }, 2000);
          } else {
            this.terminalOutput += `\n✗ Solution Rejected. Keep trying to fix bugs!`;
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.terminalOutput = `$ Submission failed: ${err.error?.message || err.message}`;
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

      // Simple response
      const response = "Think about boundary limits and optimize your lookup paths using maps/dictionaries.";
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

  // ─── Surrender ─────────────────────────────────────────────────────────────
  confirmSurrender(): void {
    this.showSurrenderModal = false;
    
    // Call Leave API on backend so opponent knows
    if (this.roomId && this.currentUser) {
      this.http.post<any>(`${environment.apiUrl}/customduel/leave`, {
        roomId: this.roomId,
        userId: this.currentUser.id
      }).subscribe({
        next: () => {
          this.showDefeatModal = true;
          setTimeout(() => {
            this.router.navigate(['/arena']);
          }, 2000);
        },
        error: (err) => {
          console.error(err);
          this.router.navigate(['/arena']);
        }
      });
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
