import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AiAnalysisService, AiAnalysisResponse } from '../../core/services/ai-analysis.service';

interface CodeLine {
  number: number;
  text: string;
  annotation: {
    type: 'success' | 'warning' | 'info';
    label: string;
    message: string;
  } | null;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

@Component({
  selector: 'app-ai-analysis',
  templateUrl: './ai-analysis.component.html',
  styleUrls: ['./ai-analysis.component.scss']
})
export class AiAnalysisComponent implements OnInit, OnDestroy {
  // Loading and State
  isLoading = true;
  selectedModel = 'Gemini 1.5 Pro (Deep)';
  isChatOpen = false;
  activeAccordion = ''; // 'alternative' | 'security' | 'suggestions'
  
  // Simulated Log Loading
  scanLogs: string[] = [];
  private logTimer: any;
  private allLogs = [
    'Initializing CodeClash AI Code Analyzer...',
    'Fetching submission details...',
    'Parsing abstract syntax tree (AST)...',
    'Analyzing code metrics and line structures...',
    'Waiting for AI analysis generation...'
  ];

  // AI Response Data
  analysisData: AiAnalysisResponse | null = null;
  errorMessage: string | null = null;

  // Problem metadata (can be fetched from API later, using generic for now)
  problemName = 'Your Solution';
  language = 'Code';
  submissionTime = 'Just now';

  // Dynamic code snippet representation
  codeLines: CodeLine[] = [
    { number: 1, text: 'def two_sum(nums, target):', annotation: null },
    { number: 2, text: '    seen = {}', annotation: null },
    { number: 3, text: '    for i, n in enumerate(nums):', annotation: null },
    { number: 4, text: '        comp = target - n', annotation: null },
    { 
      number: 5, 
      text: '        if comp in seen:', 
      annotation: { 
        type: 'success', 
        label: 'Good (Time Complexity)', 
        message: 'Excellent! Direct dictionary lookup achieves O(1) average lookup time.' 
      } 
    },
    { number: 6, text: '            return [seen[comp], i]', annotation: null },
    { number: 7, text: '        seen[n] = i', annotation: null },
    { 
      number: 8, 
      text: '    return []', 
      annotation: { 
        type: 'warning', 
        label: 'Warning (Edge Case)', 
        message: 'Ensure boundary testing is done. If target is never met, this returns an empty list.' 
      } 
    }
  ];

  // Metrics
  correctnessScore = 92;
  readabilityScore = 88;
  timeComplexity = 'O(n)';
  spaceComplexity = 'O(n)';

  // Chat Assistant
  chatMessages: ChatMessage[] = [
    { 
      sender: 'ai', 
      text: 'Hello! I have completed analyzing your Python solution for "Two Sum". I found it highly optimal with O(n) time complexity. Feel free to ask me anything about your code, such as optimizations, edge cases, or translating it to another language!', 
      time: this.getCurrentTime() 
    }
  ];
  chatInput = '';
  isTyping = false;

  suggestions = [
    'How can I optimize this?',
    'What are the edge cases?',
    'Explain the time complexity',
    'Explain the space complexity'
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private aiService: AiAnalysisService
  ) {}

  ngOnInit(): void {
    this.startLoadingLogs();
    
    this.route.queryParams.subscribe(params => {
      const submissionId = params['submissionId'];
      if (submissionId) {
        this.fetchAnalysis(submissionId);
      } else {
        this.errorMessage = 'No submission ID provided.';
        this.finishLoading();
      }
    });
  }

  fetchAnalysis(submissionId: string) {
    this.aiService.analyzeSubmission(submissionId).subscribe({
      next: (response) => {
        this.analysisData = response;
        this.correctnessScore = response.codeQualityScore;
        this.readabilityScore = response.readabilityScore;
        this.timeComplexity = response.timeComplexity;
        this.spaceComplexity = response.spaceComplexity;
        
        // Push final completion log
        this.scanLogs.push('Analysis complete! Generating interactive report...');
        
        this.finishLoading();
      },
      error: (err) => {
        console.error('Error fetching AI analysis', err);
        this.errorMessage = 'Failed to analyze submission. The AI service may be unavailable.';
        this.finishLoading();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.logTimer) {
      clearInterval(this.logTimer);
    }
  }

  // Scanning simulation log pipeline
  private startLoadingLogs(): void {
    let logIndex = 0;
    this.logTimer = setInterval(() => {
      if (logIndex < this.allLogs.length) {
        this.scanLogs.push(this.allLogs[logIndex]);
        logIndex++;
      }
    }, 400);
  }

  private finishLoading(): void {
    if (this.logTimer) {
      clearInterval(this.logTimer);
    }
    setTimeout(() => {
      this.isLoading = false;
    }, 600);
  }

  // Toggles the chat side panel drawer
  toggleChatDrawer(): void {
    this.isChatOpen = !this.isChatOpen;
  }

  // Toggles Accordions
  toggleAccordion(section: string): void {
    if (this.activeAccordion === section) {
      this.activeAccordion = '';
    } else {
      this.activeAccordion = section;
    }
  }

  // Sends message in the chat
  sendMessage(text: string): void {
    if (!text || text.trim() === '') return;
    
    // User Message
    this.chatMessages.push({
      sender: 'user',
      text: text,
      time: this.getCurrentTime()
    });

    this.chatInput = '';
    this.isTyping = true;

    // Simulate AI response delay
    setTimeout(() => {
      this.isTyping = false;
      const aiReply = this.generateAiReply(text);
      this.chatMessages.push({
        sender: 'ai',
        text: aiReply,
        time: this.getCurrentTime()
      });
    }, 1100);
  }

  private generateAiReply(userText: string): string {
    const text = userText.toLowerCase();

    if (text.includes('optimize')) {
      return this.analysisData?.optimization || 'There are no further optimizations needed at this point.';
    }
    if (text.includes('edge case')) {
      return this.analysisData?.edgeCases ? 'Consider these edge cases: ' + this.analysisData.edgeCases.join(', ') : 'No edge cases specified.';
    }
    if (text.includes('time complexity')) {
      return 'The time complexity is ' + this.timeComplexity;
    }
    if (text.includes('space complexity') || text.includes('space')) {
      return 'The space complexity is ' + this.spaceComplexity;
    }

    return 'That is a great question! For a production implementation, you should always verify constraints, verify input ranges, and add robust exception handling.';
  }

  private getCurrentTime(): string {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  }

  goBack(): void {
    window.history.back();
  }
}
