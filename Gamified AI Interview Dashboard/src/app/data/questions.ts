export interface Question {
  id: string;
  number: number;
  topic: 'react' | 'js' | 'dsa' | 'algo' | 'system-design' | 'behavioral';
  type: 'coding' | 'mcq' | 'descriptive' | 'system-design';
  difficulty: 'easy' | 'medium' | 'hard';
  title: string;
  description: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints?: string[];
  tags: string[];
  
  // For coding questions
  starterCode?: {
    javascript: string;
    typescript: string;
    python: string;
  };
  testCases?: Array<{
    input: any;
    expected: any;
    hidden?: boolean;
  }>;
  
  // For MCQ
  options?: string[];
  correctAnswer?: number | number[];
  multipleCorrect?: boolean;
  
  // Metadata
  hints?: string[];
  solution?: string;
  solutionExplanation?: string;
  acceptanceRate?: number;
  xpReward: number;
  isLocked?: boolean;
}

export interface UserProgress {
  questionId: string;
  status: 'solved' | 'attempted' | 'unsolved';
  submissions: Submission[];
  bestSubmission?: Submission;
  timeSpent: number;
  lastAttempted?: Date;
}

export interface Submission {
  questionId: string;
  code?: string;
  answer?: string;
  selectedOptions?: number[];
  language?: 'javascript' | 'typescript' | 'python';
  passed: boolean;
  testsPassed?: number;
  testsTotal?: number;
  feedback: string;
  xpEarned: number;
  timestamp: Date;
  timeSpent: number;
}

export const questions: Question[] = [
  // React Questions
  {
    id: 'react-1',
    number: 1,
    topic: 'react',
    type: 'coding',
    difficulty: 'easy',
    title: 'Create a Simple Counter Component',
    description: `Create a React component that displays a counter with increment and decrement buttons.

Requirements:
- Display the current count
- Implement an increment button that increases the count by 1
- Implement a decrement button that decreases the count by 1
- The counter should start at 0`,
    examples: [
      {
        input: 'Initial render',
        output: 'Counter displays 0',
        explanation: 'The counter starts at 0'
      }
    ],
    tags: ['useState', 'Events', 'Components'],
    starterCode: {
      javascript: `function Counter() {
  // Your code here
  
  return (
    <div>
      {/* Add your JSX here */}
    </div>
  );
}

export default Counter;`,
      typescript: `import React from 'react';

const Counter: React.FC = () => {
  // Your code here
  
  return (
    <div>
      {/* Add your JSX here */}
    </div>
  );
};

export default Counter;`,
      python: '# Python not available for React questions'
    },
    testCases: [
      { input: 'increment clicked once', expected: '1', hidden: false },
      { input: 'decrement clicked once from 0', expected: '-1', hidden: false }
    ],
    hints: ['Use useState hook to manage the counter state', 'Create two button elements with onClick handlers'],
    acceptanceRate: 92.5,
    xpReward: 10
  },
  {
    id: 'react-2',
    number: 2,
    topic: 'react',
    type: 'mcq',
    difficulty: 'easy',
    title: 'Understanding React Hooks',
    description: `Which hook would you use to perform side effects in a React function component?`,
    options: [
      'useState',
      'useEffect',
      'useContext',
      'useReducer'
    ],
    correctAnswer: 1,
    tags: ['Hooks', 'Fundamentals'],
    hints: ['Think about lifecycle methods like componentDidMount'],
    acceptanceRate: 85.3,
    xpReward: 10
  },
  {
    id: 'react-3',
    number: 3,
    topic: 'react',
    type: 'coding',
    difficulty: 'medium',
    title: 'Build a Todo List with Local Storage',
    description: `Create a todo list application that persists data to localStorage.

Requirements:
- Add new todos with an input field and button
- Display all todos in a list
- Mark todos as complete/incomplete
- Delete todos
- Persist data to localStorage
- Load data from localStorage on mount`,
    tags: ['useState', 'useEffect', 'localStorage', 'Lists'],
    starterCode: {
      javascript: `function TodoList() {
  // Your code here
  
  return (
    <div>
      {/* Add your JSX here */}
    </div>
  );
}

export default TodoList;`,
      typescript: `import React from 'react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const TodoList: React.FC = () => {
  // Your code here
  
  return (
    <div>
      {/* Add your JSX here */}
    </div>
  );
};

export default TodoList;`,
      python: '# Python not available for React questions'
    },
    hints: ['Use useEffect to sync with localStorage', 'Use Date.now() or uuid for unique IDs'],
    acceptanceRate: 68.7,
    xpReward: 25
  },

  // JavaScript Questions
  {
    id: 'js-1',
    number: 4,
    topic: 'js',
    type: 'coding',
    difficulty: 'easy',
    title: 'Two Sum',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1]'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]'
      }
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists'],
    tags: ['Array', 'Hash Table'],
    starterCode: {
      javascript: `function twoSum(nums, target) {
  // Your code here
}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  // Your code here
}`,
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    # Your code here
    pass`
    },
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1], hidden: false },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2], hidden: false },
      { input: { nums: [3, 3], target: 6 }, expected: [0, 1], hidden: true }
    ],
    hints: ['Use a hash map to store numbers and their indices', 'For each number, check if target - number exists in the map'],
    acceptanceRate: 49.2,
    xpReward: 10
  },
  {
    id: 'js-2',
    number: 5,
    topic: 'js',
    type: 'mcq',
    difficulty: 'medium',
    title: 'JavaScript Closures',
    description: `What will be the output of the following code?

\`\`\`javascript
for (var i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i);
  }, 1000);
}
\`\`\``,
    options: [
      '0 1 2',
      '3 3 3',
      'undefined undefined undefined',
      '0 0 0'
    ],
    correctAnswer: 1,
    tags: ['Closures', 'Scoping', 'Async'],
    hints: ['Think about var scoping vs let scoping', 'All timeouts share the same i variable'],
    acceptanceRate: 56.8,
    xpReward: 25
  },

  // Data Structures Questions
  {
    id: 'dsa-1',
    number: 6,
    topic: 'dsa',
    type: 'coding',
    difficulty: 'easy',
    title: 'Reverse a Linked List',
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
    examples: [
      {
        input: 'head = [1,2,3,4,5]',
        output: '[5,4,3,2,1]'
      },
      {
        input: 'head = [1,2]',
        output: '[2,1]'
      }
    ],
    tags: ['Linked List', 'Recursion'],
    starterCode: {
      javascript: `function reverseList(head) {
  // Your code here
}`,
      typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null) {
    this.val = (val===undefined ? 0 : val);
    this.next = (next===undefined ? null : next);
  }
}

function reverseList(head: ListNode | null): ListNode | null {
  // Your code here
}`,
      python: `def reverse_list(head):
    # Your code here
    pass`
    },
    testCases: [
      { input: [1, 2, 3, 4, 5], expected: [5, 4, 3, 2, 1], hidden: false },
      { input: [1, 2], expected: [2, 1], hidden: false },
      { input: [], expected: [], hidden: true }
    ],
    hints: ['Use three pointers: prev, current, next', 'Or solve it recursively'],
    acceptanceRate: 72.4,
    xpReward: 10
  },
  {
    id: 'dsa-2',
    number: 7,
    topic: 'dsa',
    type: 'coding',
    difficulty: 'medium',
    title: 'Implement a Stack using Queues',
    description: `Implement a last-in-first-out (LIFO) stack using only two queues.`,
    tags: ['Stack', 'Queue', 'Design'],
    starterCode: {
      javascript: `class MyStack {
  constructor() {
    // Your code here
  }
  
  push(x) {
    // Your code here
  }
  
  pop() {
    // Your code here
  }
  
  top() {
    // Your code here
  }
  
  empty() {
    // Your code here
  }
}`,
      typescript: `class MyStack {
  constructor() {
    // Your code here
  }
  
  push(x: number): void {
    // Your code here
  }
  
  pop(): number {
    // Your code here
  }
  
  top(): number {
    // Your code here
  }
  
  empty(): boolean {
    // Your code here
  }
}`,
      python: `class MyStack:
    def __init__(self):
        # Your code here
        pass
    
    def push(self, x: int) -> None:
        pass
    
    def pop(self) -> int:
        pass
    
    def top(self) -> int:
        pass
    
    def empty(self) -> bool:
        pass`
    },
    hints: ['Use one queue as main and another as helper', 'When pushing, you can rotate elements'],
    acceptanceRate: 64.2,
    xpReward: 25
  },

  // Algorithms Questions
  {
    id: 'algo-1',
    number: 8,
    topic: 'algo',
    type: 'coding',
    difficulty: 'medium',
    title: 'Binary Search',
    description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.`,
    examples: [
      {
        input: 'nums = [-1,0,3,5,9,12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4'
      }
    ],
    tags: ['Binary Search', 'Array'],
    starterCode: {
      javascript: `function search(nums, target) {
  // Your code here
}`,
      typescript: `function search(nums: number[], target: number): number {
  // Your code here
}`,
      python: `def search(nums: list[int], target: int) -> int:
    # Your code here
    pass`
    },
    testCases: [
      { input: { nums: [-1, 0, 3, 5, 9, 12], target: 9 }, expected: 4, hidden: false },
      { input: { nums: [-1, 0, 3, 5, 9, 12], target: 2 }, expected: -1, hidden: false }
    ],
    hints: ['Use left and right pointers', 'Compare middle element with target'],
    acceptanceRate: 55.1,
    xpReward: 25,
    isLocked: true
  },

  // System Design Questions
  {
    id: 'sd-1',
    number: 9,
    topic: 'system-design',
    type: 'system-design',
    difficulty: 'medium',
    title: 'Design a URL Shortener',
    description: `Design a URL shortening service like bit.ly.

Requirements:
1. Given a long URL, generate a short URL
2. Given a short URL, redirect to the original long URL
3. Handle collisions
4. Track analytics (optional)

Considerations:
- How will you generate short URLs?
- How will you store mappings?
- What about scalability?
- How to handle custom URLs?`,
    tags: ['System Design', 'Hashing', 'Database', 'Scalability'],
    hints: [
      'Consider using base62 encoding',
      'Think about database choice (SQL vs NoSQL)',
      'Consider using Redis for caching',
      'Handle collision with increment or regeneration'
    ],
    acceptanceRate: 71.2,
    xpReward: 25
  },
  {
    id: 'sd-2',
    number: 10,
    topic: 'system-design',
    type: 'system-design',
    difficulty: 'hard',
    title: 'Design Instagram',
    description: `Design a photo-sharing platform like Instagram.

Core Features:
1. Upload photos/videos
2. Follow/unfollow users
3. News feed showing posts from followed users
4. Like and comment on posts
5. Search for users

Scale Requirements:
- 500M daily active users
- 100M photos uploaded per day
- Low latency for feed generation

Discuss:
- Database schema
- Feed generation algorithm
- CDN strategy for images
- Caching strategy
- Sharding approach`,
    tags: ['System Design', 'Distributed Systems', 'Database', 'Caching', 'CDN'],
    hints: [
      'Use a graph database or adjacency list for social connections',
      'Consider push vs pull model for feed generation',
      'Store images in object storage (S3) with CDN',
      'Use Redis for caching hot data'
    ],
    acceptanceRate: 45.8,
    xpReward: 50
  },

  // Behavioral Questions
  {
    id: 'beh-1',
    number: 11,
    topic: 'behavioral',
    type: 'descriptive',
    difficulty: 'easy',
    title: 'Tell Me About Yourself',
    description: `Give a brief introduction about yourself, focusing on your professional background and what makes you a good fit for a software engineering role.

Structure your answer using:
- Current role/status
- Past experience highlights
- Why you're interested in this position
- Key strengths

Keep it concise (2-3 minutes when spoken).`,
    tags: ['Introduction', 'Background'],
    hints: [
      'Start with your current role or recent graduation',
      'Highlight 2-3 key achievements',
      'Connect your experience to the role you\'re applying for',
      'End with what you\'re looking for next'
    ],
    acceptanceRate: 88.5,
    xpReward: 10
  },
  {
    id: 'beh-2',
    number: 12,
    topic: 'behavioral',
    type: 'descriptive',
    difficulty: 'medium',
    title: 'Describe a Challenging Technical Problem',
    description: `Describe a time when you faced a challenging technical problem. How did you approach it, and what was the outcome?

Use the STAR method:
- **Situation**: Set the context
- **Task**: Explain the challenge
- **Action**: Detail your approach and actions
- **Result**: Share the outcome and learnings`,
    tags: ['Problem Solving', 'STAR Method', 'Technical Skills'],
    hints: [
      'Choose a real technical challenge you faced',
      'Focus on YOUR actions and decisions',
      'Mention technologies and approaches you used',
      'Highlight what you learned',
      'Quantify the result if possible'
    ],
    acceptanceRate: 76.3,
    xpReward: 25
  },
  {
    id: 'beh-3',
    number: 13,
    topic: 'behavioral',
    type: 'descriptive',
    difficulty: 'medium',
    title: 'Handling Disagreement with a Team Member',
    description: `Tell me about a time you disagreed with a team member or colleague. How did you handle the situation?

Focus on:
- The nature of the disagreement
- How you communicated your perspective
- How you found common ground
- The resolution and outcome
- What you learned about collaboration`,
    tags: ['Teamwork', 'Communication', 'Conflict Resolution', 'STAR Method'],
    hints: [
      'Show you can disagree professionally',
      'Emphasize listening and understanding their perspective',
      'Highlight data-driven or objective decision making',
      'Focus on the positive outcome',
      'Demonstrate emotional intelligence'
    ],
    acceptanceRate: 82.1,
    xpReward: 25
  }
];

// Mock user progress - in real app this would come from backend/localStorage
export const mockUserProgress: Record<string, UserProgress> = {
  'react-1': {
    questionId: 'react-1',
    status: 'solved',
    submissions: [],
    timeSpent: 450,
    lastAttempted: new Date('2026-02-20')
  },
  'react-2': {
    questionId: 'react-2',
    status: 'solved',
    submissions: [],
    timeSpent: 120,
    lastAttempted: new Date('2026-02-21')
  },
  'js-1': {
    questionId: 'js-1',
    status: 'attempted',
    submissions: [],
    timeSpent: 600,
    lastAttempted: new Date('2026-02-22')
  }
};

export const getQuestionsByTopic = (topic: string): Question[] => {
  return questions.filter(q => q.topic === topic);
};

export const getQuestionById = (id: string): Question | undefined => {
  return questions.find(q => q.id === id);
};

export const getQuestionStatus = (questionId: string): 'solved' | 'attempted' | 'unsolved' => {
  return mockUserProgress[questionId]?.status || 'unsolved';
};