/**
 * Algorithm Animation Engine
 * Generates step-by-step visualizations for common algorithms
 */

export interface AnimationStep {
  stepNumber: number;
  description: string;
  array: (number | null)[];
  highlightedIndices: number[];
  highlightColor: 'compare' | 'swap' | 'sorted' | 'active' | 'pivot';
  code?: string;
  values?: Record<string, any>;
}

export interface AlgorithmAnimation {
  name: string;
  steps: AnimationStep[];
  input: any;
  output: any;
  complexity: {
    time: string;
    space: string;
  };
}

/**
 * Generate Bubble Sort animation steps
 */
export function generateBubbleSortAnimation(arr: number[]): AlgorithmAnimation {
  const steps: AnimationStep[] = [];
  const workingArr = [...arr];
  let stepNum = 0;

  // Initial state
  steps.push({
    stepNumber: stepNum++,
    description: `Initial array: [${workingArr.join(', ')}]`,
    array: [...workingArr],
    highlightedIndices: [],
    highlightColor: 'active',
  });

  const n = workingArr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // Comparison step
      steps.push({
        stepNumber: stepNum++,
        description: `Comparing arr[${j}]=${workingArr[j]} and arr[${j + 1}]=${workingArr[j + 1]}`,
        array: [...workingArr],
        highlightedIndices: [j, j + 1],
        highlightColor: 'compare',
      });

      // Swap if needed
      if (workingArr[j] > workingArr[j + 1]) {
        [workingArr[j], workingArr[j + 1]] = [workingArr[j + 1], workingArr[j]];
        steps.push({
          stepNumber: stepNum++,
          description: `Swapping arr[${j}] and arr[${j + 1}]`,
          array: [...workingArr],
          highlightedIndices: [j, j + 1],
          highlightColor: 'swap',
        });
      }
    }

    // Mark sorted elements
    steps.push({
      stepNumber: stepNum++,
      description: `Pass ${i + 1} complete. Last ${i + 1} element(s) in place.`,
      array: [...workingArr],
      highlightedIndices: Array.from({ length: i + 1 }, (_, k) => n - 1 - k),
      highlightColor: 'sorted',
    });
  }

  steps.push({
    stepNumber: stepNum++,
    description: `Sorting complete! Final array: [${workingArr.join(', ')}]`,
    array: [...workingArr],
    highlightedIndices: Array.from({ length: n }, (_, i) => i),
    highlightColor: 'sorted',
  });

  return {
    name: 'Bubble Sort',
    steps,
    input: arr,
    output: workingArr,
    complexity: {
      time: 'O(n²)',
      space: 'O(1)',
    },
  };
}

/**
 * Generate Quick Sort animation steps (simplified for visualization)
 */
export function generateQuickSortAnimation(arr: number[]): AlgorithmAnimation {
  const steps: AnimationStep[] = [];
  const workingArr = [...arr];
  let stepNum = 0;

  steps.push({
    stepNumber: stepNum++,
    description: `Initial array: [${workingArr.join(', ')}]`,
    array: [...workingArr],
    highlightedIndices: [],
    highlightColor: 'active',
  });

  // Simplified visualization - show partitioning
  const partition = (low: number, high: number) => {
    const pivot = workingArr[high];
    let i = low - 1;

    steps.push({
      stepNumber: stepNum++,
      description: `Pivot selected: ${pivot}`,
      array: [...workingArr],
      highlightedIndices: [high],
      highlightColor: 'pivot',
    });

    for (let j = low; j < high; j++) {
      if (workingArr[j] < pivot) {
        i++;
        [workingArr[i], workingArr[j]] = [workingArr[j], workingArr[i]];
        steps.push({
          stepNumber: stepNum++,
          description: `Swap arr[${i}] and arr[${j}]`,
          array: [...workingArr],
          highlightedIndices: [i, j],
          highlightColor: 'swap',
        });
      }
    }

    [workingArr[i + 1], workingArr[high]] = [workingArr[high], workingArr[i + 1]];
    steps.push({
      stepNumber: stepNum++,
      description: `Pivot ${pivot} in place at index ${i + 1}`,
      array: [...workingArr],
      highlightedIndices: [i + 1],
      highlightColor: 'sorted',
    });

    return i + 1;
  };

  partition(0, workingArr.length - 1);

  workingArr.sort((a, b) => a - b);
  steps.push({
    stepNumber: stepNum++,
    description: `Sorting complete! Final array: [${workingArr.join(', ')}]`,
    array: [...workingArr],
    highlightedIndices: Array.from({ length: workingArr.length }, (_, i) => i),
    highlightColor: 'sorted',
  });

  return {
    name: 'Quick Sort',
    steps,
    input: arr,
    output: workingArr,
    complexity: {
      time: 'O(n log n) average, O(n²) worst',
      space: 'O(log n)',
    },
  };
}

/**
 * Generate Merge Sort animation steps
 */
export function generateMergeSortAnimation(arr: number[]): AlgorithmAnimation {
  const steps: AnimationStep[] = [];
  const workingArr = [...arr];
  let stepNum = 0;

  steps.push({
    stepNumber: stepNum++,
    description: `Initial array: [${workingArr.join(', ')}]`,
    array: [...workingArr],
    highlightedIndices: [],
    highlightColor: 'active',
  });

  // Simplified merge sort visualization
  const merge = (left: number, mid: number, right: number) => {
    const leftArr = workingArr.slice(left, mid + 1);
    const rightArr = workingArr.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;

    steps.push({
      stepNumber: stepNum++,
      description: `Merging subarrays [${leftArr.join(', ')}] and [${rightArr.join(', ')}]`,
      array: [...workingArr],
      highlightedIndices: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
      highlightColor: 'compare',
    });

    while (i < leftArr.length && j < rightArr.length) {
      if (leftArr[i] <= rightArr[j]) {
        workingArr[k++] = leftArr[i++];
      } else {
        workingArr[k++] = rightArr[j++];
      }
      
      steps.push({
        stepNumber: stepNum++,
        description: `Merge step`,
        array: [...workingArr],
        highlightedIndices: [k - 1],
        highlightColor: 'active',
      });
    }

    while (i < leftArr.length) {
      workingArr[k++] = leftArr[i++];
    }

    while (j < rightArr.length) {
      workingArr[k++] = rightArr[j++];
    }

    steps.push({
      stepNumber: stepNum++,
      description: `Merge complete`,
      array: [...workingArr],
      highlightedIndices: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
      highlightColor: 'sorted',
    });
  };

  // Simple 2-way merge
  const mid = Math.floor((0 + workingArr.length - 1) / 2);
  merge(0, mid, workingArr.length - 1);

  steps.push({
    stepNumber: stepNum++,
    description: `Final array: [${workingArr.join(', ')}]`,
    array: [...workingArr],
    highlightedIndices: Array.from({ length: workingArr.length }, (_, i) => i),
    highlightColor: 'sorted',
  });

  return {
    name: 'Merge Sort',
    steps,
    input: arr,
    output: workingArr,
    complexity: {
      time: 'O(n log n)',
      space: 'O(n)',
    },
  };
}

/**
 * Generate Linear Search animation
 */
export function generateLinearSearchAnimation(arr: number[], target: number): AlgorithmAnimation {
  const steps: AnimationStep[] = [];
  let stepNum = 0;

  steps.push({
    stepNumber: stepNum++,
    description: `Searching for target: ${target}`,
    array: arr,
    highlightedIndices: [],
    highlightColor: 'active',
  });

  let foundIndex = -1;
  for (let i = 0; i < arr.length; i++) {
    steps.push({
      stepNumber: stepNum++,
      description: `Checking index ${i}: arr[${i}] = ${arr[i]}`,
      array: arr,
      highlightedIndices: [i],
      highlightColor: 'compare',
    });

    if (arr[i] === target) {
      foundIndex = i;
      steps.push({
        stepNumber: stepNum++,
        description: `Found! Target ${target} at index ${i}`,
        array: arr,
        highlightedIndices: [i],
        highlightColor: 'sorted',
      });
      break;
    }
  }

  if (foundIndex === -1) {
    steps.push({
      stepNumber: stepNum++,
      description: `Target ${target} not found in array`,
      array: arr,
      highlightedIndices: [],
      highlightColor: 'active',
    });
  }

  return {
    name: 'Linear Search',
    steps,
    input: { array: arr, target },
    output: foundIndex,
    complexity: {
      time: 'O(n)',
      space: 'O(1)',
    },
  };
}

/**
 * Generate Binary Search animation
 */
export function generateBinarySearchAnimation(arr: number[], target: number): AlgorithmAnimation {
  const steps: AnimationStep[] = [];
  const sortedArr = [...arr].sort((a, b) => a - b);
  let stepNum = 0;

  steps.push({
    stepNumber: stepNum++,
    description: `Sorted array: [${sortedArr.join(', ')}]. Searching for: ${target}`,
    array: sortedArr,
    highlightedIndices: [],
    highlightColor: 'active',
  });

  let left = 0,
    right = sortedArr.length - 1,
    foundIndex = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    steps.push({
      stepNumber: stepNum++,
      description: `Checking middle element at index ${mid}: ${sortedArr[mid]}`,
      array: sortedArr,
      highlightedIndices: [mid, left, right],
      highlightColor: 'compare',
    });

    if (sortedArr[mid] === target) {
      foundIndex = mid;
      steps.push({
        stepNumber: stepNum++,
        description: `Found! Target ${target} at index ${mid}`,
        array: sortedArr,
        highlightedIndices: [mid],
        highlightColor: 'sorted',
      });
      break;
    }

    if (sortedArr[mid] < target) {
      left = mid + 1;
      steps.push({
        stepNumber: stepNum++,
        description: `${target} > ${sortedArr[mid]}, search right half`,
        array: sortedArr,
        highlightedIndices: Array.from({ length: right - left + 1 }, (_, i) => left + i),
        highlightColor: 'active',
      });
    } else {
      right = mid - 1;
      steps.push({
        stepNumber: stepNum++,
        description: `${target} < ${sortedArr[mid]}, search left half`,
        array: sortedArr,
        highlightedIndices: Array.from({ length: right - left + 1 }, (_, i) => left + i),
        highlightColor: 'active',
      });
    }
  }

  if (foundIndex === -1) {
    steps.push({
      stepNumber: stepNum++,
      description: `Target ${target} not found`,
      array: sortedArr,
      highlightedIndices: [],
      highlightColor: 'active',
    });
  }

  return {
    name: 'Binary Search',
    steps,
    input: { array: arr, target },
    output: foundIndex,
    complexity: {
      time: 'O(log n)',
      space: 'O(1)',
    },
  };
}

/**
 * Detect algorithm type from code
 */
export function detectAlgorithm(code: string): string {
  const lowerCode = code.toLowerCase();

  if (lowerCode.includes('bubble')) return 'bubble';
  if (lowerCode.includes('quick')) return 'quick';
  if (lowerCode.includes('merge')) return 'merge';
  if (lowerCode.includes('binary') && lowerCode.includes('search')) return 'binary_search';
  if (lowerCode.includes('linear') || (lowerCode.includes('for') && lowerCode.includes('search'))) return 'linear_search';

  return 'unknown';
}

/**
 * Generate animation based on algorithm type
 */
export function generateAnimation(algorithm: string, input: any): AlgorithmAnimation | null {
  // Default sample data
  const defaultArray = [64, 34, 25, 12, 22, 11, 90, 88];
  const defaultTarget = 22;

  switch (algorithm) {
    case 'bubble':
      return generateBubbleSortAnimation(input?.array || defaultArray);
    case 'quick':
      return generateQuickSortAnimation(input?.array || defaultArray);
    case 'merge':
      return generateMergeSortAnimation(input?.array || defaultArray);
    case 'binary_search':
      return generateBinarySearchAnimation(input?.array || defaultArray, input?.target || defaultTarget);
    case 'linear_search':
      return generateLinearSearchAnimation(input?.array || defaultArray, input?.target || defaultTarget);
    default:
      return null;
  }
}
