// Script to add missing DSA questions to MongoDB
const uri = 'mongodb://root:rootpassword@localhost:27017/interviewai?authSource=admin';
const MongoClient = require('mongodb').MongoClient;

const questionsData = [
  {
    question_id: 'dsa-10',
    title: 'Bubble Sort Implementation',
    description: `Implement the Bubble Sort algorithm to sort an array of integers in ascending order.

Bubble Sort is a simple sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. This process continues until the list is sorted.

Requirements:
- Implement the bubble sort algorithm
- Sort the array in ascending order
- Return the sorted array
- Time Complexity: O(n²) in worst and average case
- Space Complexity: O(1) as it sorts in place`,
    examples: [
      {
        input: '[5, 2, 8, 1, 9]',
        output: '[1, 2, 5, 8, 9]',
        explanation: 'The array is sorted by repeatedly comparing adjacent elements and swapping them.'
      },
      {
        input: '[1, 2, 3]',
        output: '[1, 2, 3]',
        explanation: 'Already sorted array returns as is after comparison passes.'
      }
    ],
    constraints: [
      '1 ≤ arr.length ≤ 1000',
      '-10⁹ ≤ arr[i] ≤ 10⁹'
    ],
    starter_code: {
      javascript: `function bubbleSort(arr) {\n  // TODO: Implement bubble sort\n  return arr;\n}`,
      python: `def bubbleSort(arr):\n    # TODO: Implement bubble sort\n    return arr`,
      typescript: `function bubbleSort(arr: number[]): number[] {\n  // TODO: Implement bubble sort\n  return arr;\n}`
    },
    hints: [
      'Use two nested loops to compare adjacent elements.',
      'Swap elements when the left is greater than the right.',
      'After each outer pass, the largest element is in place.'
    ],
    test_cases: [
      { input: { arr: [5, 2, 8, 1, 9] }, expected: [1, 2, 5, 8, 9], hidden: false },
      { input: { arr: [1, 2, 3] }, expected: [1, 2, 3], hidden: false },
      { input: { arr: [3, 2, 1] }, expected: [1, 2, 3], hidden: false },
      { input: { arr: [64, 34, 25, 12, 22, 11, 90] }, expected: [11, 12, 22, 25, 34, 64, 90], hidden: true }
    ]
  },
  {
    question_id: 'dsa-11',
    title: 'Selection Sort Implementation',
    description: `Implement the Selection Sort algorithm to sort an array of integers in ascending order.

Selection Sort is an in-place comparison sorting algorithm that divides the input into a sorted and unsorted region. It repeatedly finds the minimum element from the unsorted region and moves it to the sorted region.

Requirements:
- Implement the selection sort algorithm
- Sort the array in ascending order
- Return the sorted array`,
    examples: [
      {
        input: '[5, 2, 8, 1, 9]',
        output: '[1, 2, 5, 8, 9]',
        explanation: 'Find min from unsorted, swap with first unsorted element, repeat.'
      }
    ],
    constraints: [
      '1 ≤ arr.length ≤ 1000',
      '-10⁹ ≤ arr[i] ≤ 10⁹'
    ],
    starter_code: {
      javascript: `function selectionSort(arr) {\n  // TODO: Implement selection sort\n  return arr;\n}`,
      python: `def selectionSort(arr):\n    # TODO: Implement selection sort\n    return arr`,
      typescript: `function selectionSort(arr: number[]): number[] {\n  // TODO: Implement selection sort\n  return arr;\n}`
    },
    hints: [
      'Find the minimum element in the unsorted part.',
      'Swap it with the first unsorted position.',
      'Move the boundary and repeat.'
    ],
    test_cases: [
      { input: { arr: [5, 2, 8, 1, 9] }, expected: [1, 2, 5, 8, 9], hidden: false },
      { input: { arr: [1] }, expected: [1], hidden: false },
      { input: { arr: [3, 1, 2] }, expected: [1, 2, 3], hidden: true }
    ]
  }
];

async function addQuestions() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('interviewai');
    const collection = db.collection('questions');
    
    for (const question of questionsData) {
      const existing = await collection.findOne({ question_id: question.question_id });
      
      if (!existing) {
        const result = await collection.insertOne(question);
        console.log(`✅ Added ${question.title} (${question.question_id})`);
      } else {
        const hasHints = Array.isArray(existing.hints) && existing.hints.length > 0;
        if (!hasHints && question.hints) {
          await collection.updateOne(
            { question_id: question.question_id },
            { $set: { hints: question.hints } }
          );
          console.log(`✅ Updated hints for ${question.title} (${question.question_id})`);
        } else {
          console.log(`ℹ️  ${question.title} already exists, skipping...`);
        }
      }
    }
    
    console.log('✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
  }
}

addQuestions();
