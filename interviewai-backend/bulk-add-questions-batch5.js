// Final comprehensive batch - Advanced topics and more coverage

// Dynamic Programming Questions
const dpQuestions = [
  {
    id: 'algo-13',
    title: 'Climbing Stairs - DP',
    description: `You can climb 1 or 2 stairs per step. How many ways to reach n stairs?

DP approach:
- Base: dp[1]=1, dp[2]=2
- Recurrence: dp[n] = dp[n-1] + dp[n-2]
- Space optimized: Only track last 2 values`,
    test_cases: [
      {input: {n: 2}, expected: 2, hidden: false},
      {input: {n: 3}, expected: 3, hidden: true}
    ]
  },
  {
    id: 'algo-14',
    title: 'House Robber - DP',
    description: `Rob houses without robbing adjacent ones.

DP approach:
- Either rob current (+ max from 2 back)
- Or skip current (+ max from previous)
- Take maximum`,
    test_cases: [
      {input: {nums: [1,2,3,1]}, expected: 4, hidden: false}
    ]
  },
  {
    id: 'algo-15',
    title: 'Coin Change - DP',
    description: `Minimum coins needed to make amount.

DP approach:
- dp[i] = minimum coins for amount i
- Try each coin and take minimum`,
    test_cases: [
      {input: {coins: [1,2,5], amount: 5}, expected: 1, hidden: false}
    ]
  }
];

// String algorithms
const stringAlgos = [
  {
    id: 'algo-16',
    title: 'Valid Parentheses Checker',
    description: `Check if parentheses are valid and balanced.

Rules:
- Every open has matching close
- Correct order
- Use stack approach

Types: (), [], {}`,
    test_cases: [
      {input: {s: '()'}, expected: true, hidden: false},
      {input: {s: '([)]'}, expected: false, hidden: true}
    ]
  },
  {
    id: 'algo-17',
    title: 'Palindrome Checking',
    description: `Check if string is palindrome.

Approaches:
- Two pointer from ends
- String reversal
- Ignore spaces and punctuation

Handle:
- Case insensitive
- Non-alphanumeric characters`,
    test_cases: [
      {input: {s: 'A man, a plan, a canal: Panama'}, expected: true, hidden: false}
    ]
  },
  {
    id: 'algo-18',
    title: 'Pattern Matching - Wildcards',
    description: `Match string with . and * wildcards.

Wildcards:
- . matches single character
- * matches 0 or more of previous char

DP solution:
- 2D table: dp[i][j] = pattern[0..i] matches string[0..j]`,
    test_cases: [
      {input: {s: 'aa', p: 'a'}, expected: false, hidden: false}
    ]
  }
];

// More React patterns
const advancedReact = [
  {
    id: 'react-11',
    title: 'Error Boundary Component',
    description: `Create error boundary to catch component errors.

Requirements:
- Implement getDerivedStateFromError
- Implement componentDidCatch
- Catch errors in child components
- Display fallback UI

Limitations:
- Doesn't catch async errors
- Doesn't catch event handlers`,
    test_cases: [
      {input: {childError: true}, expected: {fallbackShown: true}, hidden: false}
    ]
  },
  {
    id: 'react-12',
    title: 'Memoization with useMemo',
    description: `Optimize with useMemo to avoid expensive recalculations.

When to use:
- Complex calculations
- Heavy computations
- Dependency array controls recomputation`,
    test_cases: [
      {input: {deps: 'changed'}, expected: {recomputed: true}, hidden: false}
    ]
  },
  {
    id: 'react-13',
    title: 'Callback Memoization with useCallback',
    description: `Use useCallback to memoize callback functions.

Benefits:
- Prevent child re-renders
- Consistent function reference
- Dependency array critical`,
    test_cases: [
      {input: {action: 'memoize'}, expected: {stable: true}, hidden: false}
    ]
  }
];

// More JavaScript tricky concepts
const trickyJS = [
  {
    id: 'js-11',
    title: 'Hoisting Behavior',
    description: `Understand hoisting of var, let, const and functions.

var:
- Hoisted, initialized as undefined
- Function-scoped

let/const:
- Hoisted but not initialized (TDZ)
- Block-scoped

Functions:
- Function declarations fully hoisted
- Function expressions not hoisted`,
    test_cases: [
      {input: {question: 'hoisting'}, expected: {buggy: true}, hidden: false}
    ]
  },
  {
    id: 'js-12',
    title: 'Event Loop and Callbacks',
    description: `Understand JavaScript event loop.

Order:
1. Synchronous code
2. Microtask queue (Promise, queueMicrotask)
3. Macrotask queue (setTimeout, setInterval)

Non-blocking nature:
- Callbacks execute after microtasks clear`,
    test_cases: [
      {input: {q: 'order'}, expected: {correct: true}, hidden: false}
    ]
  },
  {
    id: 'js-13',
    title: 'Deep vs Shallow Copy',
    description: `Difference and implementation.

Shallow copy:
- Only top level copied
- Nested objects shared

Deep copy:
- Recursive copy
- All levels independent

Methods:
- Spread operator (shallow)
- structuredClone (deep)
- JSON hack for simple objects`,
    test_cases: [
      {input: {type: 'deep'}, expected: {independent: true}, hidden: false}
    ]
  }
];

// Tree problems
const treeProblems = [
  {
    id: 'dsa-26',
    title: 'Binary Tree Level Order Traversal',
    description: `Traverse tree line by line (BFS).

Requirements:
- Return 2D array of level nodes
- Use queue for BFS
- Track queue size per level`,
    test_cases: [
      {input: {tree: [3,9,20,null,null,15,7]}, expected: [[3],[9,20],[15,7]], hidden: false}
    ]
  },
  {
    id: 'dsa-27',
    title: 'Binary Search Tree Validation',
    description: `Validate if tree is valid BST.

Requirements:
- All left children < parent
- All right children > parent
- Optional: unique values rule`,
    test_cases: [
      {input: {tree: [2,1,3]}, expected: true, hidden: false}
    ]
  },
  {
    id: 'dsa-29',
    title: 'Lowest Common Ancestor',
    description: `Find LCA of two nodes in binary tree.

Approaches:
- Recursively search left and right
- If both found in different subtrees, current is LCA
- If one node is another's ancestor`,
    test_cases: [
      {input: {tree: [3,5,1,6,2,0,8,null,null,7,4], p: 5, q: 1}, expected: 3, hidden: false}
    ]
  }
];

// More system design
const systemDesignMore = [
  {
    id: 'sysdes-8',
    title: 'Design TinyURL / URL Shortener',
    description: `Design system to shorten long URLs.

Core:
- encode(longUrl) -> shortUrl
- decode(shortUrl) -> longUrl
- Handle collision
- Unique short codes

Considerations:
- Distributed system
- Database design
- Caching
- Analytics`,
    test_cases: [
      {input: {longUrl: 'http://example.com'}, expected: {isShort: true}, hidden: false}
    ]
  },
  {
    id: 'sysdes-9',
    title: 'Design File Sharing System',
    description: `File sharing with upload/download.

Features:
- Upload file
- Generate share token/link
- Download by token
- Expiration/permissions

Scale:
- Handle large files
- Distributed storage
- Concurrent access`,
    test_cases: [
      {input: {action: 'upload'}, expected: {success: true}, hidden: false}
    ]
  },
  {
    id: 'sysdes-10',
    title: 'Design Social Media Feed',
    description: `Design newsfeed like Twitter/Facebook.

Challenges:
- Real-time updates
- Billions of posts
- Complex filtering

Approach:
- Message queue for posts
- Push vs pull model
- Caching strategies
- Graph database for relationships`,
    test_cases: [
      {input: {userId: 123}, expected: {feed: []}, hidden: false}
    ]
  }
];

// More behavioral
const moreBehavioral = [
  {
    id: 'behavioral-9',
    title: 'How do you handle code reviews?',
    description: `STAR Method Response:

Situation: Describe code review experience
- Technical or cultural challenges?

Task: Your role in the process
- As reviewer or reviewee?

Action: Your approach
- How do you give feedback? (constructive, specific)
- How do you receive feedback? (open-minded, grateful)
- Follow-up improvements

Result: Outcome
- Better code quality?
- Team learning?
- Better relationships?

Key Points:
- Show professionalism
- Growth mindset
- Team collaboration`,
    test_cases: [
      {input: {qtype: 'behavioral'}, expected: {hasSTAR: true}, hidden: false}
    ]
  },
  {
    id: 'behavioral-10',
    title: 'Describe team collaboration example',
    description: `STAR Method Response:

Situation: Team project scenario
- What was the project?
- What were communication challenges?

Task: Your responsibility
- What was your role?

Action: Collaboration approach
- How did you communicate?
- Did you mediate conflicts?
- Community building?

Result: Success metrics
- Project delivered?
- Team morale improved?
- New processes created?

Key Points:
- Emphasize listening
- Show adaptability
- Demonstrate leadership`,
    test_cases: [
      {input: {qtype: 'behavioral'}, expected: {hasSTAR: true}, hidden: false}
    ]
  }
];

let dpCount = 0;
dpQuestions.forEach(q => {
  db.questions.updateOne(
    { question_id: q.id },
    { $set: { description: q.description, title: q.title, test_cases: q.test_cases }},
    { upsert: true }
  );
  dpCount++;
});

let stringCount = 0;
stringAlgos.forEach(q => {
  db.questions.updateOne(
    { question_id: q.id },
    { $set: { description: q.description, title: q.title, test_cases: q.test_cases }},
    { upsert: true }
  );
  stringCount++;
});

let reactCount = 0;
advancedReact.forEach(q => {
  db.questions.updateOne(
    { question_id: q.id },
    { $set: { description: q.description, title: q.title, test_cases: q.test_cases }},
    { upsert: true }
  );
  reactCount++;
});

let jsCount = 0;
trickyJS.forEach(q => {
  db.questions.updateOne(
    { question_id: q.id },
    { $set: { description: q.description, title: q.title, test_cases: q.test_cases }},
    { upsert: true }
  );
  jsCount++;
});

let treeCount = 0;
treeProblems.forEach(q => {
  db.questions.updateOne(
    { question_id: q.id },
    { $set: { description: q.description, title: q.title, test_cases: q.test_cases }},
    { upsert: true }
  );
  treeCount++;
});

let sysdesCount = 0;
systemDesignMore.forEach(q => {
  db.questions.updateOne(
    { question_id: q.id },
    { $set: { description: q.description, title: q.title, test_cases: q.test_cases }},
    { upsert: true }
  );
  sysdesCount++;
});

let behavCount = 0;
moreBehavioral.forEach(q => {
  db.questions.updateOne(
    { question_id: q.id },
    { $set: { description: q.description, title: q.title, test_cases: q.test_cases }},
    { upsert: true }
  );
  behavCount++;
});

print(`✅ Added/Updated ${dpCount} DP questions`);
print(`✅ Added/Updated ${stringCount} String algorithm questions`);
print(`✅ Added/Updated ${reactCount} Advanced React questions`);
print(`✅ Added/Updated ${jsCount} Tricky JavaScript questions`);
print(`✅ Added/Updated ${treeCount} Tree problems`);
print(`✅ Added/Updated ${sysdesCount} System Design questions`);
print(`✅ Added/Updated ${behavCount} Behavioral questions`);

print(`\n✅✅✅ BATCH 5 COMPLETE! Added/Updated ${dpCount + stringCount + reactCount + jsCount + treeCount + sysdesCount + behavCount} questions ✅✅✅`);
print(`Total in DB now: ${db.questions.countDocuments()}`);
