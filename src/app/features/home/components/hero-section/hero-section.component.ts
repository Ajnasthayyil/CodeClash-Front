import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

interface CodeSample {
  language: string;
  code: string;
  output: string;
  testCases: string[];
}

@Component({
  selector: 'app-hero-section',
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.scss']
})
export class HeroSectionComponent implements OnInit {
  languages = ['JavaScript', 'Python', 'C++', 'Go'];
  selectedLanguage = 'JavaScript';

  constructor(private authService: AuthService) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }
  
  codeSamples: { [key: string]: CodeSample } = {
    'JavaScript': {
      language: 'JavaScript',
      code: `function findTwoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      output: `> Running tests...
✓ Test Case 1: findTwoSum([2, 7, 11, 15], 9) -> [0, 1] (Passed)
✓ Test Case 2: findTwoSum([3, 2, 4], 6) -> [1, 2] (Passed)
✓ Test Case 3: findTwoSum([3, 3], 6) -> [0, 1] (Passed)

🚀 SUCCESS: All tests passed! Score: +100 XP`,
      testCases: [
        'Test Case 1: Target 9, Array [2,7,11,15] - Passed',
        'Test Case 2: Target 6, Array [3,2,4] - Passed',
        'Test Case 3: Target 6, Array [3,3] - Passed'
      ]
    },
    'Python': {
      language: 'Python',
      code: `def find_two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      output: `> Running tests...
✓ Test Case 1: find_two_sum([2, 7, 11, 15], 9) -> [0, 1] (Passed)
✓ Test Case 2: find_two_sum([3, 2, 4], 6) -> [1, 2] (Passed)
✓ Test Case 3: find_two_sum([3, 3], 6) -> [0, 1] (Passed)

🚀 SUCCESS: All tests passed! Score: +100 XP`,
      testCases: [
        'Test Case 1: Target 9, Array [2,7,11,15] - Passed',
        'Test Case 2: Target 6, Array [3,2,4] - Passed',
        'Test Case 3: Target 6, Array [3,3] - Passed'
      ]
    },
    'C++': {
      language: 'C++',
      code: `#include <vector>
#include <unordered_map>

std::vector<int> twoSum(std::vector<int>& nums, int target) {
    std::unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (map.find(complement) != map.end()) {
            return {map[complement], i};
        }
        map[nums[i]] = i;
    }
    return {};
}`,
      output: `> Running tests...
✓ Test Case 1: twoSum([2, 7, 11, 15], 9) -> [0, 1] (Passed)
✓ Test Case 2: twoSum([3, 2, 4], 6) -> [1, 2] (Passed)
✓ Test Case 3: twoSum([3, 3], 6) -> [0, 1] (Passed)

🚀 SUCCESS: All tests passed! Score: +100 XP`,
      testCases: [
        'Test Case 1: Target 9, Array [2,7,11,15] - Passed',
        'Test Case 2: Target 6, Array [3,2,4] - Passed',
        'Test Case 3: Target 6, Array [3,3] - Passed'
      ]
    },
    'Go': {
      language: 'Go',
      code: `func twoSum(nums []int, target int) []int {
    m := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if idx, ok := m[complement]; ok {
            return []int{idx, i}
        }
        m[num] = i
    }
    return nil
}`,
      output: `> Running tests...
✓ Test Case 1: twoSum([2, 7, 11, 15], 9) -> [0, 1] (Passed)
✓ Test Case 2: twoSum([3, 2, 4], 6) -> [1, 2] (Passed)
✓ Test Case 3: twoSum([3, 3], 6) -> [0, 1] (Passed)

🚀 SUCCESS: All tests passed! Score: +100 XP`,
      testCases: [
        'Test Case 1: Target 9, Array [2,7,11,15] - Passed',
        'Test Case 2: Target 6, Array [3,2,4] - Passed',
        'Test Case 3: Target 6, Array [3,3] - Passed'
      ]
    }
  };

  currentCode = '';
  terminalOutput = 'Click "Run Challenge" to execute unit tests.';
  isRunning = false;

  ngOnInit() {
    this.selectLanguage('JavaScript');
  }

  selectLanguage(lang: string) {
    this.selectedLanguage = lang;
    this.currentCode = this.codeSamples[lang].code;
    this.terminalOutput = 'Ready to execute... Click "Run Challenge" button.';
  }

  runCode() {
    this.isRunning = true;
    this.terminalOutput = 'Compiling and spinning up sandbox container...\n';
    
    setTimeout(() => {
      this.terminalOutput += 'Analyzing security policy & imports...\n';
    }, 400);

    setTimeout(() => {
      this.terminalOutput += 'Executing unit tests:\n';
    }, 850);

    setTimeout(() => {
      this.terminalOutput += '✓ Test Case 1: Input target=9 -> Passed (0.04ms)\n';
    }, 1300);

    setTimeout(() => {
      this.terminalOutput += '✓ Test Case 2: Input target=6 -> Passed (0.01ms)\n';
    }, 1750);

    setTimeout(() => {
      this.terminalOutput += '✓ Test Case 3: Edge Case (Duplicate elements) -> Passed (0.02ms)\n\n';
      this.terminalOutput += '🎉 ---------------------------------------------------- 🎉\n';
      this.terminalOutput += '🚀 SUCCESS: All test cases successfully solved!\n';
      this.terminalOutput += 'Execution completed in 0.12s. Memory: 1.4 MB.\n';
      this.isRunning = false;
    }, 2200);
  }
}
