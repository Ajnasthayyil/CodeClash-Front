import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProblemService, ProblemDetailDto } from '../../core/services/problem.service';
import { SubmissionsService, SubmissionResponseDto } from '../../core/services/submissions.service';
import { NotificationService } from '../../shared/notifications/notification.service';
import { AuthService } from '../../core/services/auth.service';
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

  // ─── Players ───────────────────────────────────────────────────────────────
  playerName = 'Player';
  playerRating = 1200;
  playerSolved = 0;
  playerTotal = 10;

  opponentName = 'Opponent';
  opponentRating = 1200;
  opponentSolved = 0;
  opponentTotal = 10;

  matchId = 'CODE-CLASH-542';
  problemId = '';
  opponentCode = '';
  roomId = '';
  currentUser: any = null;
  private battleHub: signalR.HubConnection | null = null;
  private typingTimeout: any;

  // ─── Problem ───────────────────────────────────────────────────────────────
  problem: Problem | null = null;
  allowedLanguages: string[] = [];

  // ─── Code Editor ───────────────────────────────────────────────────────────
  languages: string[] = ['csharp', 'python', 'javascript', 'cpp', 'java', 'go', 'rust'];
  battleLanguage: string = 'Python';
  get battleLanguageLabel(): string {
    return LANGUAGE_DISPLAY_MAP[this.battleLanguage.toLowerCase()] ?? this.battleLanguage;
  }
  selectedLanguage: string = 'Python';
  preferredLanguage: string | null = null;
  autoSave = true;
  autoSaveIndicator = false;

  codeSnippets: Record<string, string> = {
    'csharp': `public class Solution {\n    public int[] TwoSum(int[] nums, int target) {\n        return new int[] {};\n    }\n}`,
    'python': `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass`,
    'javascript': `var twoSum = function(nums, target) {\n\n};`,
    'cpp': `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};`,
    'java': `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}`,
    'go': `func twoSum(nums []int, target int) []int {\n    return nil\n}`,
    'rust': `impl Solution {\n    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n        \n    }\n}`
  };

  runCodeSuccess = false;

  get currentCode(): string {
    const lang = this.selectedLanguage.toLowerCase();
    if (this.codeSnippets[lang] === undefined) {
      this.codeSnippets[lang] = '';
    }
    return this.codeSnippets[lang];
  }
  set currentCode(val: string) {
    const lang = this.selectedLanguage.toLowerCase();
    this.codeSnippets[lang] = val;
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

  // Alias used by the template's [(ngModel)]="editorCode"
  get editorCode(): string { return this.currentCode; }
  set editorCode(val: string) { this.currentCode = val; }

  get codeLines(): string[] { return this.currentCode.split('\n'); }

  onCodeChange(val: string): void {
    this.currentCode = val;
  }

  syncScroll(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const lineNums = textarea.previousElementSibling as HTMLElement;
    if (lineNums) {
      lineNums.scrollTop = textarea.scrollTop;
    }
  }

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
  battleEndData: any = null;
  activePanel: 'problem' | 'hints' = 'problem';
  mobileActiveTab: 'description' | 'editor' | 'info' = 'editor';
  scrollToAi = false;

  // ─── Victory Stats ─────────────────────────────────────────────────────────
  victoryPoints = 15;
  victoryTime = '';

  // ─── Resizing ──────────────────────────────────────────────────────────────
  editorHeight = 450;
  private isResizing = false;
  private startY = 0;
  private startHeight = 0;

  startResize(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;
    this.startY = event.clientY;
    this.startHeight = this.editorHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.isResizing) return;
      const deltaY = moveEvent.clientY - this.startY;
      // Min 150px, Max 800px
      this.editorHeight = Math.max(150, Math.min(800, this.startHeight + deltaY));
    };

    const onMouseUp = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // ─── Intervals ─────────────────────────────────────────────────────────────
  private timerInterval: any;
  private autoSaveInterval: any;
  private signalRListeners: { event: string; handler: (...args: any[]) => void }[] = [];

  constructor(
    public router: Router,
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
    this.playerRating = this.currentUser?.rating || this.playerRating;

    this.route.queryParams.subscribe(params => {
      const roomParam = params['room'];
      const langParam = params['lang'];
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

      if (roomParam) {
        // Custom Duel Room loading flow
        this.roomId = roomParam;
        if (langParam) {
          this.preferredLanguage = langParam.toLowerCase();
          this.selectedLanguage = langParam.toLowerCase();
        }
        this.loadDuelRoomDetails(roomParam);
      } else {
        // 1v1 Ranked Battle flow
        if (battleId) {
          this.matchId = battleId;
          this.connectToBattleRoom(battleId);
        }

        if (language) {
          this.battleLanguage = language;
          this.selectedLanguage = this.battleLanguage.toLowerCase();
          this.codeSnippets[this.selectedLanguage] = starterTemplate(language);
        } else {
          this.selectedLanguage = this.battleLanguage.toLowerCase();
          this.codeSnippets[this.selectedLanguage] = starterTemplate(this.battleLanguage);
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
              this.totalTests = p.testCases.length;
            },
            error: (err) => {
              console.error('Failed to load problem:', err);
            }
          });
        } else {
          this.loadDemoProblem();
        }
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
      this.battleEndData = data;
      clearInterval(this.timerInterval);

      if (data.winnerId === this.currentUser?.id) {
        this.notificationService.showToast('VICTORY! You solved the challenge first!', 'success', 5000);
        const elapsed = (30 * 60) - this.timeRemainingSeconds;
        const m = Math.floor(elapsed / 60);
        const s = elapsed % 60;
        this.victoryTime = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        this.victoryPoints = data.winnerDelta;
        this.showVictoryModal = true;
      } else {
        this.notificationService.showToast(`DEFEAT! ${this.opponentName} solved the challenge first!`, 'error', 5000);
        this.showDefeatModal = true;
      }

      if (this.currentUser) {
        const ratingChange = (data.winnerId === this.currentUser.id) ? data.winnerDelta : data.loserDelta;
        this.currentUser.rating = (this.currentUser.rating || 1200) + ratingChange;
        this.playerRating = this.currentUser.rating;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      }
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
              const langKey = template.language.toLowerCase();
              if (this.codeSnippets[langKey] !== undefined) {
                this.codeSnippets[langKey] = template.starterCode;
              }
            });
          }

          // Select preferred language if allowed by problem, else first allowed
          if (this.preferredLanguage && p.allowedLanguages.map(l => l.toLowerCase()).includes(this.preferredLanguage)) {
            this.selectedLanguage = this.preferredLanguage;
          } else if (p.allowedLanguages && p.allowedLanguages.length > 0) {
            const firstAllowed = p.allowedLanguages[0].toLowerCase();
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
              // Calculate elapsed time
              const elapsed = (30 * 60) - this.timeRemainingSeconds;
              const m = Math.floor(elapsed / 60);
              const s = elapsed % 60;
              this.victoryTime = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
              this.victoryPoints = data.pointsAwarded ?? 15;
              this.showVictoryModal = true;
              
              // Increment local user score/points
              if (this.currentUser) {
                this.currentUser.totalPoints = (this.currentUser.totalPoints || 0) + this.victoryPoints;
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
  selectLanguage(lang: string): void {
    if (!this.roomId) {
      // Language is locked for ranked battles
      return;
    }
    this.selectedLanguage = lang.toLowerCase();
  }

  get mappedLanguage(): string {
    const lang = this.selectedLanguage.toLowerCase();
    return LANGUAGE_DISPLAY_MAP[lang] ?? this.selectedLanguage;
  }

  // ─── Run Code ──────────────────────────────────────────────────────────────
  runCode(): void {
    if (this.isRunning || !this.problemId) return;
    this.isRunning = true;
    this.lastExecutionResult = null;
    this.terminalOutput = '$ Compiling and executing code against sample test cases...\n';

    this.submissionsService.runCode(this.problemId, this.mappedLanguage, this.currentCode)
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
          let errMsg = err.error?.message || err.message;
          if (err.error?.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0) {
            errMsg += '\nDetails:\n- ' + err.error.errors.join('\n- ');
          }
          this.terminalOutput = `$ Remote compiler error:\n${errMsg}`;
        }
      });
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  submitSolution(): void {
    if (this.isSubmitting || !this.problemId) return;
    this.isSubmitting = true;
    this.lastExecutionResult = null;
    this.terminalOutput = '$ Submitting code to remote verification server...\n';

    const battleIdParam = this.roomId ? undefined : this.matchId;

    this.submissionsService.submitCode(this.problemId, this.mappedLanguage, this.currentCode, battleIdParam)
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.lastExecutionResult = res;
          this.myTestsPassed = res.passed;
          this.totalTests = res.total;

          this.terminalOutput = `$ Evaluation Finished: ${res.status}\n`;
          this.terminalOutput += `Passed: ${res.passed}/${res.total} test cases\n`;

          if (res.status === 'Accepted') {
            this.notificationService.showToast('Solution Accepted! Processing duel result...', 'success', 3000);
            if (!this.roomId) {
              this.showSubmitSuccess = true;
            } else {
              // Victory modal is shown by the DuelEnded SignalR event
              // If no room (solo practice), navigate back after a short delay
              if (!this.battleHub) {
                setTimeout(() => {
                  this.router.navigate(['/arena']);
                }, 2000);
              }
            }
          } else {
            this.terminalOutput += `\n✗ Solution Rejected. Keep trying to fix bugs!`;
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          let errMsg = err.error?.message || err.message;
          if (err.error?.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0) {
            errMsg += '\nDetails:\n- ' + err.error.errors.join('\n- ');
          }
          this.terminalOutput = `$ Submission failed: ${errMsg}`;
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

    if (this.roomId && this.currentUser) {
      // Call Leave API on backend so opponent knows
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
    } else if (this.battleHub && this.matchId) {
      this.battleHub.invoke('Surrender', this.matchId);
    } else {
      this.router.navigate(['/arena']);
    }
  }

  goToResults(): void {
    if (this.battleEndData) {
      this.router.navigate(['/arena/result'], {
        state: {
          battleId: this.matchId,
          winnerId: this.battleEndData.winnerId,
          winnerDelta: this.battleEndData.winnerDelta,
          loserDelta: this.battleEndData.loserDelta,
          opponentName: this.opponentName,
          opponentRating: this.opponentRating
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
