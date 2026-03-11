#!/bin/bash
# Add all missing questions to MongoDB with complete data

docker exec interviewai_mongo mongosh --authenticationDatabase admin -u root -p rootpassword interviewai << 'EOF'

// ===== REACT QUESTIONS =====
db.questions.updateOne(
  {question_id: 'react-1'},
  {$set: {
    description: `Create a React component that displays a counter with increment and decrement buttons.

Requirements:
- Use useState hook to manage count state
- Display the current count value
- Implement an increment button that increases count by 1
- Implement a decrement button that decreases count by 1
- The counter should start at 0
- Buttons should be properly labeled`,
    examples: [{input: 'Initial render', output: 'Counter shows 0 with + and - buttons', explanation: 'Component renders with initial state'}, {input: 'Click + button', output: 'Counter shows 1', explanation: 'Count increases by 1'}, {input: 'Click - button 3 times', output: 'Counter shows -2', explanation: 'Count can go negative'}],
    constraints: ['Use functional component', 'Use React hooks (useState)', 'Buttons must update state'],
    starter_code: {
      javascript: `import React, { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  // TODO: Add increment and decrement handlers\n  return (\n    <div>\n      <p>Count: {count}</p>\n      {/* TODO: Add buttons */}\n    </div>\n  );\n}\n\nexport default Counter;`,
      typescript: `import React, { useState } from 'react';\n\nfunction Counter(): JSX.Element {\n  const [count, setCount] = useState<number>(0);\n  // TODO: Add increment and decrement handlers\n  return (\n    <div>\n      <p>Count: {count}</p>\n      {/* TODO: Add buttons */}\n    </div>\n  );\n}\n\nexport default Counter;`
    },
    test_cases: [
      {input: {action: 'render'}, expected: {hasCount: true, hasIncrementBtn: true, hasDecrementBtn: true}, hidden: false},
      {input: {action: 'increment'}, expected: {countValue: 1}, hidden: false},
      {input: {action: 'decrement_twice'}, expected: {countValue: -1}, hidden: true}
    ]
  }},
  {upsert: true}
);

// React hooks question
db.questions.updateOne(
  {question_id: 'react-2'},
  {$set: {
    description: `Understanding React Hooks - particularly useState and useEffect

React Hooks are functions that let you use state and other React features in functional components. The two most important hooks are:
- useState: for managing component state
- useEffect: for side effects (data fetching, subscriptions, etc.)

Requirements:
- Understand the purpose of each hook
- Know when to use them
- Recognize proper usage patterns
- Identify common pitfalls`,
    examples: [{input: 'useState hook', output: 'const [state, setState] = useState(initialValue)', explanation: 'useState returns state value and function to update it'}, {input: 'useEffect hook', output: 'useEffect(() => { /* effect */ }, [dependencies])', explanation: 'useEffect runs after render with optional dependencies'}],
    constraints: ['Cannot call hooks conditionally', 'Must call from React function components', 'Must follow Rules of Hooks'],
    starter_code: {
      javascript: `// Hooks must be called at top level of component\nimport { useState, useEffect } from 'react';\n\nfunction MyComponent() {\n  // TODO: Implement hooks correctly\n  return <div>Component</div>;\n}`
    },
    test_cases: [
      {input: {question: 'What does useState return?'}, expected: {answer: 'array_with_value_and_setter'}, hidden: false},
      {input: {question: 'When does useEffect run?'}, expected: {answer: 'after_render'}, hidden: false}
    ]
  }},
  {upsert: true}
);

// JavaScript Array Filter
db.questions.updateOne(
  {question_id: 'js-1'},
  {$set: {
    description: `Implement an array filter function that creates a new array with all elements that pass a test.

The filter method is commonly used to:
- Remove items based on conditions
- Get subset of data matching criteria
- Clean data

Requirements:
- Create a function or use Array.prototype.filter()
- Return only elements where callback returns true
- Do not modify the original array
- For each element, call the callback with (element, index, array)`,
    examples: [
      {input: '[1, 2, 3, 4, 5, 6]', output: '[2, 4, 6]', explanation: 'Filter even numbers using filter method'},
      {input: '[10, 15, 20, 25]', output: '[20, 25]', explanation: 'Filter numbers greater than 15'}
    ],
    constraints: ['Return new array', 'Do not mutate original', 'Callback should return boolean'],
    starter_code: {
      javascript: `function filterArray(arr, callback) {\n  // TODO: Implement filter logic\n  return arr;\n}`,
      python: `def filter_array(arr, callback):\n    # TODO: Implement filter logic\n    return arr`
    },
    test_cases: [
      {input: {arr: [1,2,3,4,5], callback: 'x > 2'}, expected: [3,4,5], hidden: false},
      {input: {arr: [2,4,6,8], callback: 'x % 2 === 0'}, expected: [2,4,6,8], hidden: false},
      {input: {arr: [1,2,3,4,5,6], callback: 'x > 10'}, expected: [], hidden: true}
    ]
  }},
  {upsert: true}
);

// DSA - Two Sum
db.questions.updateOne(
  {question_id: 'dsa-1'},
  {$set: {
    description: `Given an array of integers and an integer target, return the indices of the two numbers that add up to the target.

Requirements:
- You cannot use the same element twice
- You may assume that each input has exactly one solution
- You cannot sort the input array
- Return the indices in ascending order [i, j] where i < j
- Time complexity should be O(n) if possible`,
    examples: [
      {input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9'},
      {input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'nums[1] + nums[2] = 2 + 4 = 6'},
      {input: 'nums = [3,3], target = 6', output: '[0,1]', explanation: 'Same value can be used from different positions'}
    ],
    constraints: [
      '2 ≤ nums.length ≤ 10⁴',
      '-10⁹ ≤ nums[i] ≤ 10⁹',
      '-10⁹ ≤ target ≤ 10⁹',
      'Only one valid answer exists'
    ],
    starter_code: {
      javascript: `function twoSum(nums, target) {\n  // TODO: Find two numbers that add to target\n  return [];\n}`,
      python: `def twoSum(nums, target):\n    # TODO: Find two numbers that add to target\n    return []`,
      typescript: `function twoSum(nums: number[], target: number): number[] {\n  // TODO: Find two numbers that add to target\n  return [];\n}`
    },
    test_cases: [
      {input: {nums: [2,7,11,15], target: 9}, expected: [0,1], hidden: false},
      {input: {nums: [3,2,4], target: 6}, expected: [1,2], hidden: false},
      {input: {nums: [3,3], target: 6}, expected: [0,1], hidden: false},
      {input: {nums: [2,5,5,11], target: 10}, expected: [1,2], hidden: true},
      {input: {nums: [-1,-2,-3,5,7], target: 4}, expected: [2,4], hidden: true}
    ]
  }},
  {upsert: true}
);

// DSA - Bubble Sort (already added, update if needed)
db.questions.updateOne(
  {question_id: 'dsa-10'},
  {$set: {
    description: `Implement the Bubble Sort algorithm to sort an array of integers in ascending order.

Bubble Sort is a simple comparison-based sorting algorithm that:
- Repeatedly steps through the list
- Compares adjacent pairs of elements
- Swaps them if they're in wrong order
- Continues until the entire list is sorted

Requirements:
- Sort array in ascending order
- Return sorted array
- Time Complexity: O(n²) average/worst case
- Space Complexity: O(1) - in-place sorting
- Should be able to stop early if no swaps occur in a pass`,
    examples: [
      {input: '[5, 2, 8, 1, 9]', output: '[1, 2, 5, 8, 9]', explanation: 'Multiple passes comparing adjacent elements and swapping'},
      {input: '[1, 2, 3]', output: '[1, 2, 3]', explanation: 'Already sorted - should complete with one pass'},
      {input: '[3, 2, 1]', output: '[1, 2, 3]', explanation: 'Reverse sorted - requires multiple passes'}
    ],
    constraints: [
      '1 ≤ arr.length ≤ 1000',
      '-10⁹ ≤ arr[i] ≤ 10⁹',
      'Do not use built-in sort'
    ],
    starter_code: {
      javascript: `function bubbleSort(arr) {\n  // TODO: Implement bubble sort\n  const n = arr.length;\n  // Compare adjacent elements and swap\n  return arr;\n}`,
      python: `def bubble_sort(arr):\n    # TODO: Implement bubble sort\n    n = len(arr)\n    return arr`,
      typescript: `function bubbleSort(arr: number[]): number[] {\n  // TODO: Implement bubble sort\n  const n = arr.length;\n  return arr;\n}`
    },
    test_cases: [
      {input: {arr: [5,2,8,1,9]}, expected: [1,2,5,8,9], hidden: false},
      {input: {arr: [1,2,3]}, expected: [1,2,3], hidden: false},
      {input: {arr: [3,2,1]}, expected: [1,2,3], hidden: false},
      {input: {arr: [64,34,25,12,22,11,90]}, expected: [11,12,22,25,34,64,90], hidden: true},
      {input: {arr: [1]}, expected: [1], hidden: true}
    ]
  }},
  {upsert: true}
);

print("✅ Updated core questions");

// ===== ADD REMAINING DSA QUESTIONS =====
const dsaQuestions = [
  {
    id: 'dsa-2',
    title: 'Palindrome String Check',
    description: 'Check if a string is a palindrome (reads the same forwards and backwards)',
    examples: [{input: '"racecar"', output: 'true'}, {input: '"hello"', output: 'false'}],
    test_cases: [
      {input: {s: "racecar"}, expected: true, hidden: false},
      {input: {s: "hello"}, expected: false, hidden: false},
      {input: {s: "a"}, expected: true, hidden: false},
      {input: {s: "Aa"}, expected: false, hidden: true}
    ]
  },
  {
    id: 'dsa-3',
    title: 'Array Sum',
    description: 'Calculate the sum of all elements in an array',
    examples: [{input: '[1,2,3,4,5]', output: '15'}],
    test_cases: [
      {input: {arr: [1,2,3,4,5]}, expected: 15, hidden: false},
      {input: {arr: [0]}, expected: 0, hidden: false},
      {input: {arr: [-1, -2, -3]}, expected: -6, hidden: true}
    ]
  },
  {
    id: 'dsa-4',
    title: 'Find Maximum Element',
    description: 'Find the maximum value in an array',
    examples: [{input: '[3, 7, 2, 9, 1]', output: '9'}],
    test_cases: [
      {input: {arr: [3,7,2,9,1]}, expected: 9, hidden: false},
      {input: {arr: [1]}, expected: 1, hidden: false},
      {input: {arr: [-5, -2, -10]}, expected: -2, hidden: true}
    ]
  }
];

dsaQuestions.forEach(q => {
  db.questions.updateOne(
    {question_id: q.id},
    {$set: {
      description: q.description,
      examples: q.examples,
      constraints: ['Do not use built-in max/min functions if possible'],
      starter_code: {
        javascript: `function solve(arr) {\n  // TODO: Implement\n  return null;\n}`,
        python: `def solve(arr):\n    # TODO: Implement\n    return None`
      },
      test_cases: q.test_cases
    }},
    {upsert: true}
  );
});

print("✅ Added DSA questions 2-4");

// ===== ADD SYSTEM DESIGN QUESTIONS =====
db.questions.updateOne(
  {question_id: 'sysdes-1'},
  {$set: {
    description: `Design a URL Shortener System (like bit.ly or tinyurl)

Requirements:
- Convert long URLs to short unique identifiers
- Redirect short URLs to original long URLs
- Track number of redirects/clicks
- Handle concurrent requests efficiently
- Scalable to handle millions of URLs

Key considerations:
- Database schema for storing mappings
- Short code generation algorithm
- Caching strategy for hot URLs
- Handling collisions in short codes`,
    examples: [
      {input: 'POST /shorten url=https://example.com/very/long/path', output: '{shortUrl: "http://short.url/abc123"}', explanation: 'Create short URL'},
      {input: 'GET /abc123', output: 'Redirect to https://example.com/very/long/path', explanation: 'Expand and redirect'}
    ],
    constraints: [
      'Short code should be 6-8 characters',
      'Should support custom short codes',
      'Need analytics (click tracking)',
      'Expiration support'
    ],
    starter_code: {
      javascript: `// Database schema\nconst URL_MAPPING = new Map(); // Map<shortCode, longUrl>\n\nfunction shorten(longUrl) {\n  // TODO: Generate short code and store\n}\n\nfunction expand(shortCode) {\n  // TODO: Retrieve and redirect\n}`
    },
    test_cases: [
      {input: {operation: 'shorten', url: 'https://example.com'}, expected: {hasShortCode: true, length: 'between_6_8'}, hidden: false},
      {input: {operation: 'expand', code: 'abc123'}, expected: {redirectsTo: 'original_url'}, hidden: false}
    ]
  }},
  {upsert: true}
);

print("✅ Added system design questions");

// ===== ADD ALGORITHM QUESTIONS =====
db.questions.updateOne(
  {question_id: 'algo-1'},
  {$set: {
    description: `Implement Linear Search - find an element in an array by checking each element sequentially.

Requirements:
- Search through array element by element
- Return index if found, -1 if not found
- Time Complexity: O(n)
- No pre-processing needed`,
    examples: [
      {input: 'arr=[3,1,4,1,5], target=4', output: '2', explanation: 'Element found at index 2'},
      {input: 'arr=[3,1,4,1,5], target=9', output: '-1', explanation: 'Element not found'}
    ],
    test_cases: [
      {input: {arr: [3,1,4,1,5], target: 4}, expected: 2, hidden: false},
      {input: {arr: [3,1,4,1,5], target: 9}, expected: -1, hidden: false},
      {input: {arr: [5], target: 5}, expected: 0, hidden: true}
    ]
  }},
  {upsert: true}
);

// ===== ADD BEHAVIORAL QUESTIONS =====
db.questions.updateOne(
  {question_id: 'behavioral-1'},
  {$set: {
    description: `Tell me about a conflict you resolved with a colleague or team member.

Structure your answer using the STAR method:
- S (Situation): Set the context and describe the conflict
- T (Task): Explain what needed to be done
- A (Action): Describe the specific actions you took
- R (Result): Share the positive outcome

Key points to cover:
- What was the disagreement about?
- How did you approach the resolution?
- What communication techniques did you use?
- How did the conflict impact the team/project?
- What did you learn from the experience?`,
    examples: [
      {input: 'Code review disagreement', output: 'Walk through STAR method with focus on listening and compromise', explanation: 'Technical disagreement resolved through discussion'},
      {input: 'Schedule conflict', output: 'Show how you prioritized tasks and communicated timeline', explanation: 'Resource conflict resolved through planning'}
    ],
    constraints: [
      'Use STAR method',
      'Focus on your role and contribution',
      'Show emotional intelligence',
      'Demonstrate problem-solving skills',
      'Be specific with details'
    ],
    starter_code: {
      // For behavioral, we just provide structure
      javascript: `// Structure your answer:\n/*\nS (Situation): Describe the context...\nT (Task): Explain what needed to be done...\nA (Action): What specific actions did you take...\nR (Result): What was the positive outcome...\n*/`
    },
    test_cases: [
      {input: {question: 'Tell conflict story'}, expected: {hasSituation: true, hasTask: true, hasAction: true, hasResult: true}, hidden: false},
      {input: {question: 'What did you learn'}, expected: {learningOutcome: true}, hidden: false}
    ]
  }},
  {upsert: true}
);

print("✅ Added behavioral questions");
print("✅✅✅ ALL CORE QUESTIONS UPDATED ✅✅✅");

EOF
