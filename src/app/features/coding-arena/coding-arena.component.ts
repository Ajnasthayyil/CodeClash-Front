import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SubmissionResponseDto } from '../../core/services/submissions.service';
import { ProblemService } from '../../core/services/problem.service';

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

type Language = 'Python' | 'JavaScript' | 'C++' | 'Go';

@Component({
  selector: 'app-coding-arena',
  templateUrl: './coding-arena.component.html',
  styleUrls: ['./coding-arena.component.scss']
})
export class CodingArenaComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('aiScrollContainer') aiScrollContainer!: ElementRef;
  @ViewChild('codeEditor') codeEditor!: ElementRef;

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
  languages: Language[] = ['Python', 'JavaScript', 'C++', 'Go'];
  selectedLanguage: Language = 'Python';
  autoSave = true;
  autoSaveIndicator = false;

  codeSnippets: Record<Language, string> = {
    'Python': `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        comp = target - n
        if comp in seen:
            return [seen[comp], i]
        seen[n] = i
    return []`,
    'JavaScript': `function twoSum(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (seen.has(comp)) {
            return [seen.get(comp), i];
        }
        seen.set(nums[i], i);
    }
    return [];
}`,
    'C++': `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int comp = target - nums[i];
            if (seen.count(comp)) {
                return {seen[comp], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
    'Go': `func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, n := range nums {
        comp := target - n
        if j, ok := seen[comp]; ok {
            return []int{j, i}
        }
        seen[n] = i
    }
    return nil
}`
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
    private problemService: ProblemService
  ) {}

  ngOnInit(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      this.playerName = parsed.name || this.playerName;
      this.playerRating = parsed.rating || this.playerRating;
    }

    // Subscribe to query parameters to load chosen problem dynamically
    this.route.queryParams.subscribe(params => {
      const problemId = params['problemId'];
      if (problemId) {
        this.loadProblem(problemId);
      }
      const room = params['room'];
      if (room) {
        this.matchId = `ROOM-${room}`;
      }
    });

    // Countdown timer
    this.timerInterval = setInterval(() => {
      if (this.timeRemainingSeconds > 0) {
        this.timeRemainingSeconds--;
      }
    }, 1000);

    // Opponent simulated progress
    this.opponentInterval = setInterval(() => {
      if (this.opponentTestsPassed < this.totalTests && Math.random() > 0.65) {
        this.opponentTestsPassed = Math.min(this.opponentTestsPassed + 1, this.totalTests);
        this.opponentIsTyping = true;
        setTimeout(() => { this.opponentIsTyping = false; }, 2000);
      }
    }, 7000);

    // Auto-save flash indicator
    this.autoSaveInterval = setInterval(() => {
      if (this.autoSave) {
        this.autoSaveIndicator = true;
        setTimeout(() => { this.autoSaveIndicator = false; }, 1500);
      }
    }, 30000);
  }

  loadProblem(problemId: string): void {
    this.problemService.getProblemById(problemId).subscribe({
      next: (detail) => {
        this.problem = {
          title: detail.title,
          difficulty: this.capitalizeDifficulty(detail.difficulty),
          description: detail.statementMarkdown,
          examples: detail.testCases ? detail.testCases.filter(t => !t.isHidden).slice(0, 3).map(t => ({
            input: t.input || '',
            output: t.expectedOutput || ''
          })) : [],
          constraints: detail.constraints || [],
          tags: [detail.category || 'General']
        };

        // Populate initial dynamic boilerplate snippets for the editor based on problem name
        this.generateDefaultSnippets(detail.title);
      },
      error: (err) => {
        console.error('Failed to load active duel problem details', err);
      }
    });
  }

  private capitalizeDifficulty(diff: string): 'Easy' | 'Medium' | 'Hard' {
    if (!diff) return 'Medium';
    const lower = diff.toLowerCase();
    if (lower === 'easy') return 'Easy';
    if (lower === 'hard') return 'Hard';
    return 'Medium';
  }

  private generateDefaultSnippets(title: string): void {
    const functionName = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    this.codeSnippets = {
      'Python': `def ${functionName}(nums, target):\n    # Write your solution here\n    pass`,
      'JavaScript': `function ${functionName}(nums, target) {\n    // Write your solution here\n    \n}`,
      'C++': `class Solution {\npublic:\n    vector<int> ${functionName}(vector<int>& nums, int target) {\n        // Write your solution here\n        \n    }\n};`,
      'Go': `func ${functionName}(nums []int, target int) []int {\n    // Write your solution here\n    return nil\n}`
    };
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
    clearInterval(this.opponentInterval);
    clearInterval(this.autoSaveInterval);
  }

  ngAfterViewChecked(): void {
    if (this.scrollToAi && this.aiScrollContainer) {
      const el = this.aiScrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.scrollToAi = false;
    }
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

    setTimeout(() => {
      const passed = Math.random() > 0.3;
      this.terminalOutput = `$ Running test cases...\n\n`;
      this.terminalOutput += `✓ Test 1 passed: [0,1]\n`;
      this.terminalOutput += `✓ Test 2 passed: [1,2]\n`;
      if (passed) {
        this.runCodeSuccess = true;
        this.terminalOutput += `✓ Test 3 passed: [0,1]\n\n`;
        this.terminalOutput += `All sample tests passed! Runtime: 52ms | Memory: 16.2 MB`;
        this.handleExecutionResult({ submissionId: 'mock', status: 'Accepted', passed: 3, total: 3, executionTime: 52, memory: 16, testCases: [
          { id: '1', status: 'Passed', input: 'mock', expectedOutput: 'mock', isHidden: false },
          { id: '2', status: 'Passed', input: 'mock', expectedOutput: 'mock', isHidden: false },
          { id: '3', status: 'Passed', input: 'mock', expectedOutput: 'mock', isHidden: false }
        ] });
      } else {
        this.terminalOutput += `✗ Test 3 failed: expected [0,1], got [1,0]\n\n`;
        this.terminalOutput += `1/3 tests failed. Check your output order.`;
        this.handleExecutionResult({ submissionId: 'mock', status: 'WrongAnswer', passed: 2, total: 3, executionTime: 52, memory: 16, testCases: [
          { id: '1', status: 'Passed', input: 'mock', expectedOutput: 'mock', isHidden: false },
          { id: '2', status: 'Passed', input: 'mock', expectedOutput: 'mock', isHidden: false },
          { id: '3', status: 'Failed', input: 'mock', expectedOutput: '[0,1]', actualOutput: '[1,0]', isHidden: false }
        ] });
      }
      this.isRunning = false;
    }, 1600);
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  submitSolution(): void {
    if (this.isSubmitting || !this.problem) return;
    this.isSubmitting = true;
    this.lastExecutionResult = null;
    this.terminalOutput = '$ Submitting solution against test suite...\n';

    setTimeout(() => {
      this.myTestsPassed = this.totalTests;
      this.terminalOutput = `$ Evaluating against all ${this.totalTests} test cases...\n\n`;
      for (let i = 1; i <= this.totalTests; i++) {
        this.terminalOutput += `✓ Test ${i} passed\n`;
      }
      this.terminalOutput += `\n🎉 All ${this.totalTests}/${this.totalTests} tests passed!\nRuntime: 48ms (beats 94.3%) | Memory: 15.8 MB (beats 87.1%)`;
      this.isSubmitting = false;
      this.showSubmitSuccess = true;
      setTimeout(() => {
        this.showSubmitSuccess = false;
        this.router.navigate(['/arena/result']);
      }, 2000);
    }, 2500);
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

  // ─── Surrender ─────────────────────────────────────────────────────────────
  confirmSurrender(): void {
    this.showSurrenderModal = false;
    // In real app: navigate away or emit event
    window.location.href = '/dashboard';
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
