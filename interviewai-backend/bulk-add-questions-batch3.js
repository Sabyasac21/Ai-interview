// Add System Design, Algorithms, and Behavioral questions

// Advanced Algorithms Questions
const algorithmQuestions = [
  {
    id: 'algo-5',
    title: 'Fibonacci Number',
    description: `Calculate the nth Fibonacci number efficiently.

Fibonacci: 0, 1, 1, 2, 3, 5, 8, 13...

Approaches:
- Recursive: Simple but O(2^n)
- DP: O(n) time, O(n) space
- Space optimized: O(1) space with 2 vars
- Matrix exponentiation: O(log n)`,
    test_cases: [
      {input: {n: 0}, expected: 0, hidden: false},
      {input: {n: 5}, expected: 5, hidden: false},
      {input: {n: 10}, expected: 55, hidden: true}
    ]
  },
  {
    id: 'algo-6',
    title: 'Binary Search',
    description: `Search sorted array for target value using binary search.

Requirements:
- Return index if found, -1 if not
- O(log n) time complexity
- Works only on sorted array
- Compare mid with target and adjust bounds`,
    test_cases: [
      {input: {arr: [-1,0,3,5,9,12], target: 9}, expected: 4, hidden: false},
      {input: {arr: [-1,0,3,5,9,12], target: 13}, expected: -1, hidden: true}
    ]
  },
  {
    id: 'algo-7',
    title: 'Power Function - mod 10^9+7',
    description: `Calculate x^n mod 10^9+7 efficiently.

Requirements:
- Handle large numbers using modulo arithmetic
- Use fast exponentiation
- Time: O(log n)
- Handle negative exponents`,
    test_cases: [
      {input: {x: 2, n: 10}, expected: 1024, hidden: false},
      {input: {x: 2.0, n: -2}, expected: 0.25, hidden: true}
    ]
  },
  {
    id: 'algo-8',
    title: 'Two Sum Solution Variations',
    description: `Solve two-sum problem with multiple constraints.

Variations:
- Sorted array: Use two pointers
- Unsorted array: Use hash map
- Return indices vs values
- Handle duplicates`,
    test_cases: [
      {input: {nums: [2,7,11,15], target: 9}, expected: [0,1], hidden: false}
    ]
  },
  {
    id: 'algo-9',
    title: 'Longest Common Subsequence (LCS)',
    description: `Find length of longest common subsequence between two strings.

Requirements:
- LCS doesn't need to be contiguous
- DP approach: 2D table
- Time: O(m*n), Space: O(m*n)`,
    test_cases: [
      {input: {text1: 'abc', text2: 'abc'}, expected: 3, hidden: false},
      {input: {text1: 'ace', text2: 'abc'}, expected: 2, hidden: true}
    ]
  }
];

let algoCount = 0;
algorithmQuestions.forEach(q => {
  try {
    db.questions.updateOne(
      { question_id: q.id },
      {
        $set: {
          description: q.description,
          title: q.title,
          constraints: ['Optimize for time complexity'],
          starter_code: {
            javascript: `function solve(input) {\n  // TODO: Implement\n  return null;\n}`
          },
          test_cases: q.test_cases,
          examples: q.test_cases.slice(0, 1).map(tc => ({
            input: JSON.stringify(tc.input),
            output: JSON.stringify(tc.expected)
          }))
        }
      },
      { upsert: true }
    );
    algoCount++;
  } catch (e) {
    print(`Error with ${q.id}: ${e.message}`);
  }
});

print(`✅ Added/Updated ${algoCount} algorithm questions`);

// System Design Questions
const systemDesignQuestions = [
  {
    id: 'sysdes-3',
    title: 'Design a Cache System (LRU or LFU)',
    description: `Design a cache system with eviction policy.

Requirements:
- Implement get() and put() operations
- LRU: Evict least recently used when full
- LFU: Evict least frequently used when full
- Both operations should be O(1)
- Handle capacity limits

Consider:
- Data structure choice (HashMap + LinkedList)
- Frequency tracking
- Timestamp tracking`,
    test_cases: [
      {input: {action: 'put', key: 1, val: 1}, expected: {success: true}, hidden: false}
    ]
  },
  {
    id: 'sysdes-4',
    title: 'Design Rate Limiter',
    description: `Design a rate limiter for API requests.

Requirements:
- Allow N requests per M seconds
- Use token bucket or sliding window
- Thread-safe implementation
- Handle distributed scenarios

Algorithm options:
- Token Bucket: Generates tokens at fixed rate
- Leaky Bucket: Requests leak out at fixed rate
- Sliding Window Log: Track request timestamps
- Sliding Window Counter: Efficient approximation`,
    test_cases: [
      {input: {calls: 3, period: 1000}, expected: {allowed: 3}, hidden: false}
    ]
  },
  {
    id: 'sysdes-5',
    title: 'Design Parking Lot System',
    description: `Design a parking lot management system.

Classes needed:
- ParkingLot
- Level
- ParkingSpot
- Ticket
- Vehicle

Features:
- Track available spaces
- Assign spots by size (compact, regular, large)
- Handle different vehicle types
- Get available space count`,
    test_cases: [
      {input: {action: 'addLevel', size: 10}, expected: {success: true}, hidden: false}
    ]
  },
  {
    id: 'sysdes-6',
    title: 'Design Key-Value Store',
    description: `Design a distributed key-value store.

Core methods:
- put(key, value)
- get(key)
- delete(key)

Features:
- Consistent hashing for scaling
- Replication for fault tolerance
- Partitioning strategy
- Cache layer considerations`,
    test_cases: [
      {input: {op: 'put', k: 'key1', v: 'val1'}, expected: true, hidden: false}
    ]
  },
  {
    id: 'sysdes-7',
    title: 'Design Autocomplete System',
    description: `Design an autocomplete search system.

Requirements:
- Given prefix, return top K suggestions
- Track frequency of searches
- Handle real-time updates
- Optimize for speed

Data structures:
- Trie for prefix matching
- Heap for top K
- HashMap for frequency tracking`,
    test_cases: [
      {input: {prefix: 'he'}, expected: {count: -1}, hidden: false}
    ]
  }
];

let sysdesCount = 0;
systemDesignQuestions.forEach(q => {
  try {
    db.questions.updateOne(
      { question_id: q.id },
      {
        $set: {
          description: q.description,
          title: q.title,
          constraints: ['Design with scalability in mind', 'Consider trade-offs'],
          starter_code: {
            javascript: `class SystemComponent {\n  constructor(params) {\n    // TODO: Initialize\n  }\n  \n  execute(action) {\n    // TODO: Implement\n  }\n}`
          },
          test_cases: q.test_cases,
          examples: q.test_cases.slice(0, 1).map(tc => ({
            input: JSON.stringify(tc.input),
            output: JSON.stringify(tc.expected)
          }))
        }
      },
      { upsert: true }
    );
    sysdesCount++;
  } catch (e) {
    print(`Error with ${q.id}: ${e.message}`);
  }
});

print(`✅ Added/Updated ${sysdesCount} system design questions`);

// Behavioral Questions with STAR Method
const behavioralQuestions = [
  {
    id: 'behavioral-3',
    title: 'Tell me about a time you failed',
    description: `STAR Method Response:

Situation: Set the scene with relevant details
- When did this happen?
- What was your role?
- What was the goal?

Task: Explain what you were responsible for
- What were you trying to achieve?
- Why was it important?

Action: Describe your specific actions
- What did you do to address the failure?
- How did you recover quickly?
- What did you learn?

Result: Show the positive outcome
- What was the outcome?
- What did you learn from it?
- How did it change future actions?

Key Points:
- Show humility and growth mindset
- Focus on solution and learning
- Specific metrics/outcomes if possible`,
    test_cases: [
      {input: {qtype: 'behavioral'}, expected: {hasSTAR: true}, hidden: false}
    ]
  },
  {
    id: 'behavioral-4',
    title: 'Describe a conflict with teammate',
    description: `STAR Method Response:

Situation: Describe the conflict objectively
- When and where did it happen?
- What was the disagreement about?
- Who was involved?

Task: Explain the stakes
- Why was resolving this important?
- What was your responsibility?

Action: Show leadership and communication
- How did you initiate conversation?
- What was your approach to resolving?
- Did you listen to their perspective?
- How did you find common ground?

Result: Demonstrate positive resolution
- How was it resolved?
- What did you learn about yourself?
- Did it improve team dynamics?

Key Points:
- Show emotional intelligence
- Focus on collaboration, not blame
- Demonstrate problem-solving skills`,
    test_cases: [
      {input: {qtype: 'behavioral'}, expected: {hasSTAR: true}, hidden: false}
    ]
  },
  {
    id: 'behavioral-6',
    title: 'Describe your biggest achievement',
    description: `STAR Method Response:

Situation: Paint the picture
- What was the context?
- What challenge did you face?
- What made it difficult?

Task: Clarify your role
- What were you personally responsible for?
- What were the goals/metrics?

Action: Highlight your contributions
- Specific steps you took
- Skills you used
- Initiative you showed
- How you overcame obstacles

Result: Quantify the success
- Measurable outcomes (revenue, efficiency, etc)
- What you learned
- Recognition received
- Impact on team/company

Key Points:
- Use numbers and metrics
- Show leadership and ownership
- Demonstrate business impact`,
    test_cases: [
      {input: {qtype: 'behavioral'}, expected: {hasSTAR: true}, hidden: false}
    ]
  },
  {
    id: 'behavioral-7',
    title: 'Tell me about a gap in your skillset',
    description: `STAR Method Response:

Situation: Admit a limitation honestly
- What skill was needed?
- Why did you lack it initially?

Task: Show self-awareness
- How did you recognize the gap?
- What was the impact?

Action: Demonstrate growth mindset
- How did you work to improve?
- Specific courses, mentors, projects?
- How did you apply learning?
- Timeline for improvement

Result: Show progress
- Current proficiency level
- How it benefited your work
- What you'd do differently now
- Commitment to continuous learning

Key Points:
- Never say "I have no weaknesses"
- Show real effort to improve
- Demonstrate humility and growth`,
    test_cases: [
      {input: {qtype: 'behavioral'}, expected: {hasSTAR: true}, hidden: false}
    ]
  },
  {
    id: 'behavioral-8',
    title: 'How do you prioritize when overwhelmed?',
    description: `STAR Method Response:

Situation: Describe high-pressure scenario
- Multiple priorities at once?
- Unexpected urgent issue?
- Resource constraints?

Task: Explain the challenge
- What was the impact of mis-prioritization?
- Why was this high-stakes?

Action: Share your process
- How do you assess urgency vs importance?
- Who do you consult?
- How do you communicate delays?
- What frameworks do you use? (Matrix, etc)

Result: Positive outcome
- What was accomplished?
- Did you meet deadlines?
- Team satisfaction?
- What system do you use now?

Key Points:
- Show strategic thinking
- Demonstrate communication skills
- Provide specific framework`,
    test_cases: [
      {input: {qtype: 'behavioral'}, expected: {hasSTAR: true}, hidden: false}
    ]
  }
];

let behavCount = 0;
behavioralQuestions.forEach(q => {
  try {
    db.questions.updateOne(
      { question_id: q.id },
      {
        $set: {
          description: q.description,
          title: q.title,
          constraints: ['Use STAR Method', 'Be specific with examples'],
          test_cases: q.test_cases,
          examples: [{
            input: 'Behavioral Question',
            output: 'Use STAR Method with specific examples'
          }]
        }
      },
      { upsert: true }
    );
    behavCount++;
  } catch (e) {
    print(`Error with ${q.id}: ${e.message}`);
  }
});

print(`✅ Added/Updated ${behavCount} behavioral questions`);

print(`\n✅✅✅ BATCH 3 COMPLETE! Added/Updated ${algoCount + sysdesCount + behavCount} questions ✅✅✅`);
print(`Total in DB now: ${db.questions.countDocuments()}`);
