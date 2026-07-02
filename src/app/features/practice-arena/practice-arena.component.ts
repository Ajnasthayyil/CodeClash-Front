import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface ProblemDetails {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
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

  // ─── List of Mock Problems to Load Dynamically ─────────────────────────────
  private problemsDb: Record<number, ProblemDetails> = {
    1: {
      id: 1,
      title: 'Sum of Two Prime Numbers',
      difficulty: 'Easy',
      description: 'Given an even integer <code>n</code> greater than 2, return two prime numbers such that they add up to <code>n</code>. If there are multiple pairs, return the one with the smallest first element.',
      examples: [
        { input: 'n = 10', output: '[3, 7]', explanation: '3 + 7 = 10. Both 3 and 7 are prime numbers.' },
        { input: 'n = 4', output: '[2, 2]' }
      ],
      constraints: [
        '4 ≤ n ≤ 10⁵',
        'n is an even integer',
        'Only prime numbers should be returned'
      ],
      tags: ['Math', 'Primes']
    },
    2: {
      id: 2,
      title: 'Debounce Execution Helper',
      difficulty: 'Medium',
      description: 'Implement a debounce helper function. Given a function <code>fn</code> and a delay in milliseconds <code>t</code>, return a debounced version of that function that delays execution until after <code>t</code> milliseconds have elapsed since the last call.',
      examples: [
        { input: 'fn = (...args) => console.log(args), t = 50', output: 'Delayed log output' }
      ],
      constraints: [
        '0 ≤ t ≤ 1000',
        'fn is a valid function'
      ],
      tags: ['Async', 'Debounce']
    },
    3: {
      id: 3,
      title: 'Lexical Closures Scope Builder',
      difficulty: 'Medium',
      description: 'Given a nested object representing lexical scopes and variable assignments, construct a lookup evaluator closure function that returns variable values by traversing scopes from child to root parent.',
      examples: [
        { input: 'scope = {x: 1, parent: {y: 2}}', output: 'Returns 1 for x, 2 for y' }
      ],
      constraints: [
        'The scope object tree depth ≤ 100'
      ],
      tags: ['Closures', 'Lookup']
    },
    4: {
      id: 4,
      title: 'Merge Interval Intersection',
      difficulty: 'Hard',
      description: 'Given two lists of closed intervals, <code>firstList</code> and <code>secondList</code>, return the intersection of these two interval lists. Each list of intervals is pairwise disjoint and in sorted order.',
      examples: [
        { input: 'firstList = [[0,2],[5,10]], secondList = [[1,5]]', output: '[[1,2],[5,5]]' }
      ],
      constraints: [
        '0 ≤ firstList.length, secondList.length ≤ 1000'
      ],
      tags: ['Arrays', 'Two Pointers']
    },
    5: {
      id: 5,
      title: 'K-way Merge Array Sorter',
      difficulty: 'Hard',
      description: 'You are given an array of <code>k</code> sorted integer arrays. Merge all the sorted arrays into one sorted array and return it.',
      examples: [
        { input: 'arrays = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' }
      ],
      constraints: [
        '0 ≤ k ≤ 10⁴',
        '0 ≤ arrays[i].length ≤ 500'
      ],
      tags: ['Arrays', 'Heap', 'Divide and Conquer']
    },
    6: {
      id: 6,
      title: 'Palindromic Substring Parser',
      difficulty: 'Medium',
      description: 'Given a string <code>s</code>, return the longest palindromic substring in <code>s</code>.',
      examples: [
        { input: 's = "babad"', output: '"bab" or "aba"' }
      ],
      constraints: [
        '1 ≤ s.length ≤ 1000'
      ],
      tags: ['String', 'Dynamic Programming']
    },
    7: {
      id: 7,
      title: 'Lazy Evaluation Stream Generator',
      difficulty: 'Medium',
      description: 'Implement a stream pipeline engine with lazy evaluation support. It should support <code>map</code>, <code>filter</code>, and <code>take</code> operations, executing them only when a terminal operation like <code>collect</code> is invoked.',
      examples: [
        { input: 'Stream.of([1,2,3]).map(x => x*2).collect()', output: '[2,4,6]' }
      ],
      constraints: [
        'Stream length is infinite or finite'
      ],
      tags: ['Functions', 'Streams']
    },
    8: {
      id: 8,
      title: 'Custom Redux Dispatcher Store',
      difficulty: 'Hard',
      description: 'Create a custom state store constructor. It should take a reducer function and initial state, supporting <code>getState()</code>, <code>dispatch(action)</code>, and <code>subscribe(listener)</code>.',
      examples: [
        { input: 'store = createStore(reducer)', output: 'Functional dispatcher store' }
      ],
      constraints: [
        'Reducer is a pure function'
      ],
      tags: ['Functions', 'Redux', 'State']
    }
  };

  // Fallback default problem (Two Sum)
  problem: ProblemDetails = {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' }
    ],
    constraints: [
      '2 ≤ nums.length ≤ 10⁴',
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
    'Python': `def solve_problem(*args, **kwargs):\n    # Write your solution here\n    pass`,
    'JavaScript': `function solveProblem(...args) {\n    // Write your solution here\n}`,
    'C++': `class Solution {\npublic:\n    // Write your solution here\n};`,
    'Go': `func solveProblem() {\n    // Write your solution here\n}`
  };

  get currentCode(): string { return this.codeSnippets[this.selectedLanguage]; }
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

  // ─── Intervals ─────────────────────────────────────────────────────────────
  private autoSaveInterval: any;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // Read route parameter 'id'
    this.route.paramMap.subscribe(params => {
      const problemIdStr = params.get('id');
      if (problemIdStr) {
        const problemId = parseInt(problemIdStr, 10);
        if (this.problemsDb[problemId]) {
          this.problem = this.problemsDb[problemId];
          // Pre-populate boilerplate with customized function names
          this.generateBoilerplate(this.problem.title);
        }
      }
    });

    // Auto-save flash indicator
    this.autoSaveInterval = setInterval(() => {
      if (this.autoSave) {
        this.autoSaveIndicator = true;
        setTimeout(() => { this.autoSaveIndicator = false; }, 1500);
      }
    }, 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.autoSaveInterval);
  }

  ngAfterViewChecked(): void {}

  private generateBoilerplate(title: string) {
    const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const camelTitle = cleanTitle.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    
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
    if (this.isRunning) return;
    this.isRunning = true;
    this.terminalOutput = '$ Running sample test cases...\n';

    setTimeout(() => {
      this.terminalOutput = `$ Running sample test cases...\n\n`;
      this.terminalOutput += `✓ Test 1 passed: output matches expectation\n`;
      this.terminalOutput += `✓ Test 2 passed: output matches expectation\n\n`;
      this.terminalOutput += `All sample tests passed! Runtime: 42ms | Memory: 14.8 MB`;
      this.myTestsPassed = Math.min(this.myTestsPassed + 2, this.totalTests);
      this.isRunning = false;
    }, 1600);
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  submitSolution(): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.terminalOutput = '$ Submitting solution against test suite...\n';

    setTimeout(() => {
      this.myTestsPassed = this.totalTests;
      this.terminalOutput = `$ Evaluating against all ${this.totalTests} test cases...\n\n`;
      for (let i = 1; i <= this.totalTests; i++) {
        this.terminalOutput += `✓ Test ${i} passed\n`;
      }
      this.terminalOutput += `\n🎉 All ${this.totalTests}/${this.totalTests} tests passed!\nRuntime: 36ms (beats 96.5%) | Memory: 14.2 MB (beats 92.1%)`;
      this.isSubmitting = false;
      this.showSubmitSuccess = true;
      
      // Update problem status locally (just for UX feedback)
      this.problem.title = `${this.problem.title} (Solved)`;
      
      setTimeout(() => { this.showSubmitSuccess = false; }, 5000);
    }, 2500);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  get myFillPercent(): number {
    return Math.round((this.myTestsPassed / this.totalTests) * 100);
  }

  getDifficultyClass(diff: string): string {
    return diff === 'Easy' ? 'difficulty-easy' : diff === 'Medium' ? 'difficulty-medium' : 'difficulty-hard';
  }
}
