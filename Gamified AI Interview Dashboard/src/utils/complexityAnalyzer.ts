/**
 * Complexity Analysis Utilities
 * Extracts and analyzes time/space complexity from algorithm code
 */

export interface ComplexityInfo {
  time: string;
  space: string;
  description: string;
}

// Map of algorithm names to their complexities
const algorithmComplexities: Record<string, ComplexityInfo> = {
  'bubble-sort': {
    time: 'O(n²)',
    space: 'O(1)',
    description:
      'Bubble Sort repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. In the worst case, it requires n-1 passes.',
  },
  'quick-sort': {
    time: 'O(n log n) avg, O(n²) worst',
    space: 'O(log n)',
    description:
      'Quick Sort uses a divide-and-conquer approach with a pivot element. Average case is O(n log n), but can degrade to O(n²) with poor pivot selection.',
  },
  'merge-sort': {
    time: 'O(n log n)',
    space: 'O(n)',
    description:
      'Merge Sort divides the array in half recursively and then merges the sorted subarrays. Guaranteed O(n log n) but requires additional space.',
  },
  'binary-search': {
    time: 'O(log n)',
    space: 'O(1)',
    description:
      'Binary Search efficiently finds an element in a sorted array by dividing the search space in half with each comparison.',
  },
  'linear-search': {
    time: 'O(n)',
    space: 'O(1)',
    description:
      'Linear Search iterates through each element until the target is found or the end is reached. Simple but not efficient for large datasets.',
  },
  'insertion-sort': {
    time: 'O(n²)',
    space: 'O(1)',
    description:
      'Insertion Sort builds a sorted array one element at a time by inserting each element into its correct position. Good for nearly sorted data.',
  },
  'selection-sort': {
    time: 'O(n²)',
    space: 'O(1)',
    description:
      'Selection Sort finds the minimum element and places it at the beginning, repeating for remaining elements. Simple but inefficient.',
  },
  'heap-sort': {
    time: 'O(n log n)',
    space: 'O(1)',
    description:
      'Heap Sort uses a heap data structure to sort elements. Consistent O(n log n) time but with higher constant factors than Quick Sort.',
  },
  'dfs': {
    time: 'O(V + E)',
    space: 'O(V)',
    description:
      'Depth-First Search explores as far as possible along each branch before backtracking. V=vertices, E=edges.',
  },
  'bfs': {
    time: 'O(V + E)',
    space: 'O(V)',
    description:
      'Breadth-First Search explores neighbors level by level. Uses a queue and often finds shortest paths in unweighted graphs.',
  },
  'dijkstra': {
    time: 'O((V + E) log V)',
    space: 'O(V)',
    description:
      'Dijkstra\'s algorithm finds shortest paths from a source to all other vertices in a weighted graph.',
  },
  'dynamic-programming': {
    time: 'Varies',
    space: 'O(n) or O(n²)',
    description:
      'Dynamic Programming solves problems by breaking them into overlapping subproblems and storing results to avoid recomputation.',
  },
};

/**
 * Detect algorithm from code and return complexity info
 */
export function analyzeComplexity(code: string): ComplexityInfo | null {
  const lowerCode = code.toLowerCase();

  // Check for explicit algorithm names in comments or strings
  for (const [algorithm, complexity] of Object.entries(algorithmComplexities)) {
    if (
      lowerCode.includes(algorithm.replace('-', ' ')) ||
      lowerCode.includes(algorithm.replace('-', '_')) ||
      code.includes(algorithm)
    ) {
      return complexity;
    }
  }

  // Pattern matching for common code structures
  if (containsNestedLoop(code)) {
    return {
      time: 'O(n²)',
      space: 'O(1)',
      description: 'Code contains nested loops - typical O(n²) complexity.',
    };
  }

  if (containsRecursion(code)) {
    if (lowerCode.includes('divide') || lowerCode.includes('conquer')) {
      return {
        time: 'O(n log n)',
        space: 'O(log n)',
        description: 'Divide-and-conquer recursive algorithm - typically O(n log n).',
      };
    }
    return {
      time: 'Varies (check recursion depth)',
      space: 'O(h) where h is recursion height',
      description: 'Recursive algorithm - space complexity depends on recursion depth.',
    };
  }

  if (containsSingleLoop(code)) {
    return {
      time: 'O(n)',
      space: 'O(1)',
      description: 'Single loop over n elements - linear time complexity.',
    };
  }

  if (lowerCode.includes('binary') || lowerCode.includes('log')) {
    return {
      time: 'O(log n)',
      space: 'O(1)',
      description: 'Algorithm eliminates half of search space each iteration.',
    };
  }

  return null;
}

/**
 * Check if code contains nested loops
 */
function containsNestedLoop(code: string): boolean {
  const loopPattern = /for\s*\(|while\s*\(/g;
  const lines = code.split('\n');
  let maxLoopsInBlock = 0;
  let currentLoopsInBlock = 0;
  let blockDepth = 0;

  for (const line of lines) {
    const loopCount = (line.match(loopPattern) || []).length;
    currentLoopsInBlock += loopCount;
    blockDepth += (line.match(/\{/g) || []).length;
    blockDepth -= (line.match(/\}/g) || []).length;

    if (blockDepth === 0) {
      maxLoopsInBlock = Math.max(maxLoopsInBlock, currentLoopsInBlock);
      currentLoopsInBlock = 0;
    }
  }

  return maxLoopsInBlock >= 2;
}

/**
 * Check if code contains recursion
 */
function containsRecursion(code: string): boolean {
  const functionNamePattern = /function\s+(\w+)|const\s+(\w+)\s*=\s*(?:function|\(|async)/;
  const match = code.match(functionNamePattern);
  if (!match) return false;

  const functionName = match[1] || match[2];
  const functionCallPattern = new RegExp(`\\b${functionName}\\s*\\(`, 'g');
  return functionCallPattern.test(code);
}

/**
 * Check if code contains a single loop
 */
function containsSingleLoop(code: string): boolean {
  const loopPattern = /for\s*\(|while\s*\(/g;
  const loopCount = (code.match(loopPattern) || []).length;
  return loopCount === 1;
}

/**
 * Extract variable declarations to understand algorithm structure
 */
export function extractAlgorithmInfo(code: string): {
  hasArray: boolean;
  hasLinkedList: boolean;
  hasGraph: boolean;
  hasTree: boolean;
  hasRecursion: boolean;
  hasNestedLoops: boolean;
} {
  const lowerCode = code.toLowerCase();

  return {
    hasArray: /array|arr|list|\[\]|\.(push|pop|shift|unshift)/.test(code),
    hasLinkedList:
      /linkedlist|node|\.next|\.prev/.test(code) || /class Node|function Node/.test(code),
    hasGraph: /graph|adjacency|edge|vertex|vertices/.test(lowerCode),
    hasTree: /tree|\.left|\.right|bst|binary/.test(lowerCode),
    hasRecursion: containsRecursion(code),
    hasNestedLoops: containsNestedLoop(code),
  };
}

/**
 * Generate detailed complexity explanation
 */
export function getComplexityExplanation(complexity: ComplexityInfo): string {
  return `
**Time Complexity:** ${complexity.time}
**Space Complexity:** ${complexity.space}

${complexity.description}
  `.trim();
}

/**
 * Common algorithm identifiers for pattern matching
 */
export const ALGORITHM_KEYWORDS = {
  BUBBLE_SORT: ['bubble', 'sort', 'adjacent', 'swap'],
  QUICK_SORT: ['quick', 'sort', 'partition', 'pivot'],
  MERGE_SORT: ['merge', 'sort', 'divide', 'conquer'],
  BINARY_SEARCH: ['binary', 'search', 'sorted', 'log'],
  LINEAR_SEARCH: ['linear', 'search', 'sequential'],
  SELECTION_SORT: ['selection', 'sort', 'minimum'],
  INSERTION_SORT: ['insertion', 'sort', 'shift'],
  HEAP_SORT: ['heap', 'sort', 'priority'],
  DFS: ['dfs', 'depth', 'first', 'stack', 'recursive'],
  BFS: ['bfs', 'breadth', 'first', 'queue'],
  DIJKSTRA: ['dijkstra', 'shortest', 'path', 'weighted'],
};

/**
 * Identify algorithm type from keywords
 */
export function identifyAlgorithmType(code: string): string | null {
  const lowerCode = code.toLowerCase();

  for (const [algorithm, keywords] of Object.entries(ALGORITHM_KEYWORDS)) {
    if (keywords.some(keyword => lowerCode.includes(keyword))) {
      return algorithm;
    }
  }

  return null;
}
