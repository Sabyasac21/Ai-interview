// MongoDB initialization script
// Inserting detailed question content

db = db.getSiblingDB('interviewai');

// Create collections for questions details
db.createCollection('questions', { capped: false });
db.createCollection('code_submissions', { capped: false });

// Insert React Questions Details
db.questions.insertMany([
  {
    question_id: 'react-1',
    title: 'Create a Simple Counter Component',
    type: 'coding',
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
      },
      {
        input: 'User clicks increment',
        output: 'Counter displays 1',
        explanation: 'State updates and component re-renders'
      }
    ],
    constraints: [
      'Use React hooks (useState)',
      'No class components',
      'Pure functional component'
    ],
    hints: [
      'Use the useState hook to store the count value.',
      'Create two buttons and update state in their onClick handlers.',
      'Render the current count inside a <p> or <span>.'
    ],
    starter_code: {
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
    test_cases: [
      { input: 'increment clicked once', expected: '1', hidden: false },
      { input: 'decrement clicked once from 0', expected: '-1', hidden: false },
      { input: 'increment clicked 5 times', expected: '5', hidden: true }
    ],
    solution: `import React, { useState } from 'react';

const Counter: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
};

export default Counter;`,
    solution_explanation: 'We use the useState hook to manage the counter state. The increment button updates state by adding 1, and decrement subtracts 1. React automatically re-renders when state changes.',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-02-01')
  },
  {
    question_id: 'react-2',
    title: 'Understanding React Hooks',
    type: 'mcq',
    description: 'Which hook would you use to perform side effects in a React function component?',
    hints: [
      'Side effects include data fetching and subscriptions.',
      'This hook runs after render by default.',
      'It replaces most uses of componentDidMount/DidUpdate.'
    ],
    options: [
      'useState',
      'useEffect',
      'useContext',
      'useReducer'
    ],
    correct_answer: 1,
    explanation: 'useEffect is the hook used for side effects like data fetching, subscriptions, and manual DOM manipulations in function components.',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-02-01')
  },
  {
    question_id: 'js-1',
    title: 'Array Methods - Filter',
    type: 'coding',
    description: `Write a function that filters an array to only include numbers greater than 5.

Requirements:
- Take an array as input
- Return a new array with only elements > 5
- Don't modify the original array`,
    examples: [
      {
        input: '[1, 3, 5, 7, 9]',
        output: '[7, 9]',
        explanation: 'Only 7 and 9 are greater than 5'
      }
    ],
    starter_code: {
      javascript: `function filterGreaterThanFive(arr) {
  // Your code here
}`,
      python: `def filter_greater_than_five(arr):
    # Your code here
    pass`
    },
    hints: [
      'Iterate through the array and keep numbers > 5.',
      'You can use Array.prototype.filter in JavaScript.',
      'Return a new array; do not mutate the original.'
    ],
    test_cases: [
      { input: '[1, 3, 5, 7, 9]', expected: '[7, 9]', hidden: false },
      { input: '[10, 2, 8]', expected: '[10, 8]', hidden: false },
      { input: '[]', expected: '[]', hidden: true }
    ],
    solution: `function filterGreaterThanFive(arr) {
  return arr.filter(num => num > 5);
}`,
    solution_explanation: 'The filter() method creates a new array with elements that pass the test. We use an arrow function that returns true for numbers > 5.',
    created_at: new Date('2026-01-02'),
    updated_at: new Date('2026-02-02')
  },
  {
    question_id: 'dsa-1',
    title: 'Two Sum Problem',
    type: 'coding',
    description: `Given an array of integers and an integer target, return the indices of the two numbers that add up to the target.

Requirements:
- You cannot use the same element twice
- Return the indices (not the values)
- Assume exactly one solution exists`,
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'nums[0] + nums[1] = 2 + 7 = 9'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9'
    ],
    starter_code: {
      javascript: `function twoSum(nums, target) {
  // Your code here
}`,
      python: `def two_sum(nums, target):
    # Your code here
    pass`
    },
    hints: [
      'A hash map can store value -> index as you scan.',
      'For each number, check if target - number has been seen.',
      'Return indices immediately when a match is found.'
    ],
    test_cases: [
      { input: 'nums=[2,7,11,15], target=9', expected: '[0,1]', hidden: false },
      { input: 'nums=[3,2,4], target=6', expected: '[1,2]', hidden: false },
      { input: 'nums=[3,3], target=6', expected: '[0,1]', hidden: true }
    ],
    solution: `function twoSum(nums, target) {
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
    solution_explanation: 'Use a hash map to store values we\'ve seen. For each number, check if its complement (target - current) exists in the map. Time: O(n), Space: O(n).',
    created_at: new Date('2026-01-03'),
    updated_at: new Date('2026-02-03')
  }
]);

// Create indexes for better query performance
db.questions.createIndex({ question_id: 1 }, { unique: true });
db.questions.createIndex({ type: 1 });
db.code_submissions.createIndex({ session_id: 1 });
db.code_submissions.createIndex({ user_id: 1, created_at: -1 });

print('✅ MongoDB collections initialized with sample questions');
