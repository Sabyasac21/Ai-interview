// Add more React, JavaScript, DSA, and Algorithms

// More React Hooks and Advanced Patterns
const moreReactQuestions = [
  {
    id: 'react-8',
    title: 'useEffect Hook - Data Fetching',
    description: `Fetch data from API using useEffect.

Requirements:
- Fetch on component mount
- Handle loading and error states
- Clean up subscriptions
- Add dependency array

Common mistakes:
- Missing dependency array (runs every render)
- Not handling cleanup
- Race conditions with state updates`,
    test_cases: [
      {input: {trigger: 'mount'}, expected: {fetched: true}, hidden: false}
    ]
  },
  {
    id: 'react-9',
    title: 'useReducer Hook Pattern',
    description: `Use useReducer for complex state logic.

When to use:
- Multiple state variables
- Complex state transitions
- State depends on previous state
- Share state between functions

Structure:
- Initial state
- Reducer function (state, action) -> new state
- Dispatch actions from components`,
    test_cases: [
      {input: {action: 'increment'}, expected: {count: 1}, hidden: false}
    ]
  },
  {
    id: 'react-10',
    title: 'Custom React Hook',
    description: `Create custom hook for reusable logic.

Rules:
- Start with 'use' prefix
- Can use other hooks
- Can be called in multiple components
- Each call gets its own state

Example: useFormInput, useFetch, useWindowSize`,
    test_cases: [
      {input: {hookUsed: true}, expected: {works: true}, hidden: false}
    ]
  }
];

// More JavaScript Core Concepts
const moreJSQuestions = [
  {
    id: 'js-7',
    title: 'Closures and Lexical Scope',
    description: `Understand closures in JavaScript.

Closure: Function that has access to outer function's variables
- Even after outer function returns
- Created whenever function is created
- Useful for data privacy and callbacks

Example:
- Counter with private state
- Event listeners with closure
- Module pattern`,
    test_cases: [
      {input: {scope: 'lexical'}, expected: {canAccess: true}, hidden: false}
    ]
  },
  {
    id: 'js-8',
    title: 'Promise Resolution and Rejection',
    description: `Handle promises with then/catch/finally.

Promise states:
- Pending: Initial state
- Fulfilled: resolve() called
- Rejected: reject() called

Handling:
- .then(onFulfilled, onRejected)
- .catch(onRejected)
- .finally(cleanup)
- Promise chaining`,
    test_cases: [
      {input: {state: 'resolved'}, expected: {handled: true}, hidden: false}
    ]
  },
  {
    id: 'js-9',
    title: 'Async/Await Patterns',
    description: `Write async code with async/await.

Advantages:
- Cleaner than promise chains
- Error handling with try/catch
- Sequential or parallel execution
- Works with any Promise

Patterns:
- Sequential: await each operation
- Parallel: Promise.all()
- Error handling: try/catch blocks`,
    test_cases: [
      {input: {async: true}, expected: {executed: true}, hidden: false}
    ]
  },
  {
    id: 'js-10',
    title: 'This Keyword Context',
    description: `Understand 'this' in different contexts.

Context of 'this':
- Global context: window/global
- Method call: object that owns method
- Constructor function: new instance
- Arrow function: parent scope
- call/apply/bind: explicit binding

How to test: print this or use debugger`,
    test_cases: [
      {input: {context: 'method'}, expected: {isObject: true}, hidden: false}
    ]
  }
];

// More DSA - Arrays and Hash Maps
const moreArrayQuestions = [
  {
    id: 'dsa-9',
    title: 'Contains Duplicate Check',
    description: `Check if array contains duplicate elements.

Requirements:
- Return true if duplicate exists
- False if all unique
- Use hash set for O(n) solution
- Compare with O(n log n) sorting approach`,
    test_cases: [
      {input: {nums: [1,2,3,1]}, expected: true, hidden: false},
      {input: {nums: [1,2,3,4]}, expected: false, hidden: true}
    ]
  },
  {
    id: 'dsa-12',
    title: 'Remove Duplicates from Sorted Array',
    description: `Remove duplicates keeping relative order.

Requirements:
- Modify in-place
- Return number of unique elements
- O(1) space complexity
- Don't use extra array`,
    test_cases: [
      {input: {nums: [1,1,2]}, expected: 2, hidden: false},
      {input: {nums: [0,0,1,1,1,2,2,3,3,4]}, expected: 5, hidden: true}
    ]
  },
  {
    id: 'dsa-13',
    title: 'Rotate Array',
    description: `Rotate array right by k positions.

Approaches:
- Brute force: k shifts - O(n*k)
- Reverse method: O(n) - reverse all, reverse first k, reverse rest
- Cyclic rotations: Move elements

Example: [1,2,3,4,5] rotated by 2 = [4,5,1,2,3]`,
    test_cases: [
      {input: {nums: [1,2,3,4,5], k: 2}, expected: [4,5,1,2,3], hidden: false}
    ]
  },
  {
    id: 'dsa-14',
    title: 'Best Time to Buy and Sell Stock',
    description: `Find max profit from buying and selling stock once.

Requirements:
- Must buy before sell
- Find best buy and sell prices
- Single transaction only
- Return max profit

Approach:
- Track minimum price seen
- For each price, calculate profit
- Keep track of max profit`,
    test_cases: [
      {input: {prices: [7,1,5,3,6,4]}, expected: 5, hidden: false}
    ]
  },
  {
    id: 'dsa-15',
    title: 'Maximum Product Subarray',
    description: `Find contiguous subarray with largest product.

Requirements:
- Can include negative numbers
- Single number also valid
- Handle zeros
- O(n) solution

Approach:
- Track max and min at each position
- Min important because negative * negative = positive`,
    test_cases: [
      {input: {nums: [2,3,-2,4]}, expected: 6, hidden: false}
    ]
  }
];

// Graph algorithms
const graphQuestions = [
  {
    id: 'algo-10',
    title: 'Depth First Search (DFS)',
    description: `Traverse graph using DFS.

Approach:
- Use stack (recursion) or explicit stack
- Visit vertex, mark visited
- Explore adjacent unvisited vertices
- Time: O(V+E)

Use cases:
- Topological sort
- Cycle detection
- Path finding`,
    test_cases: [
      {input: {graph: [[1,2],[3],[3],[]]}, expected: [0,1,3,2], hidden: false}
    ]
  },
  {
    id: 'algo-11',
    title: 'Breadth First Search (BFS)',
    description: `Traverse graph using BFS.

Approach:
- Use queue (FIFO)
- Visit starts vertex, add to queue
- Visit each vertex from queue
- Time: O(V+E)

Use cases:
- Shortest path (unweighted)
- Level-order traversal
- Connected components`,
    test_cases: [
      {input: {graph: [[1,2],[2],[]]}, expected: [0,1,2], hidden: false}
    ]
  },
  {
    id: 'algo-12',
    title: 'Topological Sort',
    description: `Order vertices in directed acyclic graph.

Requirements:
- All edges point same direction in order
- Only applies to DAG
- Multiple valid orderings possible
- Kahn\'s algorithm or DFS

Use:
- Task scheduling
- Dependency resolution
- Compiler design`,
    test_cases: [
      {input: {numCourses: 2, prerequisites: [[1,0]]}, expected: [0,1], hidden: false}
    ]
  }
];

let reactCount = 0;
moreReactQuestions.forEach(q => {
  db.questions.updateOne(
    { question_id: q.id },
    { $set: {
      description: q.description,
      title: q.title,
      constraints: ['Use hooks', 'Functional components'],
      test_cases: q.test_cases
    }},
    { upsert: true }
  );
  reactCount++;
});

let jsCount = 0;
moreJSQuestions.forEach(q => {
  db.questions.updateOne(
    { question_id: q.id },
    { $set: {
      description: q.description,
      title: q.title,
      constraints: ['ES6+'],
      test_cases: q.test_cases
    }},
    { upsert: true }
  );
  jsCount++;
});

let arrayCount = 0;
moreArrayQuestions.forEach(q => {
  db.questions.updateOne(
    { question_id: q.id },
    { $set: {
      description: q.description,
      title: q.title,
      test_cases: q.test_cases
    }},
    { upsert: true }
  );
  arrayCount++;
});

let graphCount = 0;
graphQuestions.forEach(q => {
  db.questions.updateOne(
    { question_id: q.id },
    { $set: {
      description: q.description,
      title: q.title,
      test_cases: q.test_cases
    }},
    { upsert: true }
  );
  graphCount++;
});

print(`✅ Added/Updated ${reactCount} React questions`);
print(`✅ Added/Updated ${jsCount} JavaScript questions`);
print(`✅ Added/Updated ${arrayCount} Array/DSA questions`);
print(`✅ Added/Updated ${graphCount} Graph questions`);

print(`\n✅✅✅ BATCH 4 COMPLETE! Added/Updated ${reactCount + jsCount + arrayCount + graphCount} questions ✅✅✅`);
print(`Total in DB now: ${db.questions.countDocuments()}`);
