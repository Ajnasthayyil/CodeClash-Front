import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

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
    'Parsing abstract syntax tree (AST)...',
    'Analyzing code metrics and line structures...',
    'Evaluating Time Complexity: O(n) average...',
    'Evaluating Space Complexity: O(n) auxiliary...',
    'Scanning readability index: 88/100...',
    'Analysis complete! Generating interactive report...'
  ];

  // Problem metadata
  problemName = 'Two Sum';
  language = 'Python';
  submissionTime = 'Submitted 2 minutes ago';

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
    'What happens with duplicates?',
    'Explain the space complexity',
    'Rewrite in C++'
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.simulateScanning();
  }

  ngOnDestroy(): void {
    if (this.logTimer) {
      clearInterval(this.logTimer);
    }
  }

  // Scanning simulation log pipeline
  private simulateScanning(): void {
    let logIndex = 0;
    this.logTimer = setInterval(() => {
      if (logIndex < this.allLogs.length) {
        this.scanLogs.push(this.allLogs[logIndex]);
        logIndex++;
      } else {
        clearInterval(this.logTimer);
        setTimeout(() => {
          this.isLoading = false;
        }, 400);
      }
    }, 280);
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
      return 'Your hash map approach is already optimal at O(n) time and O(n) space. You could make minor syntactic improvements (like adding type hints: "def two_sum(nums: List[int], target: int) -> List[int]:"), but algorithmically it cannot be faster.';
    }
    if (text.includes('duplicate')) {
      return 'If there are duplicate values, "seen[n] = i" will overwrite the previous index. However, since we check "if comp in seen" before inserting, we will correctly find the complement pair if the duplicates sum to the target. For example, with nums = [3, 3] and target = 6, it matches correctly.';
    }
    if (text.includes('space complexity') || text.includes('space')) {
      return 'The space complexity is O(n) because in the worst case (where the complement is only found at the very end of the array), you will store all n elements in the "seen" hash map.';
    }
    if (text.includes('c++') || text.includes('cpp')) {
      return 'Here is the C++ equivalent using std::unordered_map:\n\n```cpp\n#include <vector>\n#include <unordered_map>\n\nstd::vector<int> twoSum(std::vector<int>& nums, int target) {\n    std::unordered_map<int, int> seen;\n    for (int i = 0; i < nums.size(); ++i) {\n        int comp = target - nums[i];\n        if (seen.count(comp)) {\n            return {seen[comp], i};\n        }\n        seen[nums[i]] = i;\n    }\n    return {};\n}\n```';
    }

    return 'That is a great question! For a production implementation, you should also verify constraints, verify input ranges, and add robust exception handling.';
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
    this.router.navigate(['/arena/result']);
  }
}
