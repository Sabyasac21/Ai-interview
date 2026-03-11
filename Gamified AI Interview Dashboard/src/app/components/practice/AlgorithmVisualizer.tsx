import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Zap } from 'lucide-react';

// Types definitions
interface AnimationStep {
  stepNumber: number;
  description: string;
  array: (number | null)[];
  highlightedIndices: number[];
  highlightColor: 'compare' | 'swap' | 'sorted' | 'active' | 'pivot';
  code?: string;
  values?: Record<string, any>;
}

interface AlgorithmAnimation {
  name: string;
  steps: AnimationStep[];
  input: any;
  output: any;
  complexity: {
    time: string;
    space: string;
  };
}

interface ComplexityInfo {
  time: string;
  space: string;
  description: string;
}

interface AlgorithmVisualizerProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  questionTitle?: string;
}

// Improved algorithm detection with pattern matching
function detectAlgorithm(code: string, questionTitle: string = ''): string {
  const lowerCode = code.toLowerCase();
  const fullContext = (lowerCode + ' ' + questionTitle.toLowerCase());

  // Explicit keyword matching (highest priority)
  if (fullContext.includes('bubble sort')) return 'bubble';
  if (fullContext.includes('selection sort')) return 'selection';
  if (fullContext.includes('insertion sort')) return 'insertion';
  if (fullContext.includes('quick sort')) return 'quick';
  if (fullContext.includes('merge sort')) return 'merge';
  if (fullContext.includes('heap sort')) return 'heap';
  if (fullContext.includes('binary search')) return 'binary_search';

  // Single word keyword matching
  if (lowerCode.includes('bubble')) return 'bubble';
  if (lowerCode.includes('selection')) return 'selection';
  if (lowerCode.includes('insertion')) return 'insertion';
  if (lowerCode.includes('quick')) return 'quick';
  if (lowerCode.includes('merge')) return 'merge';
  if (lowerCode.includes('heap')) return 'heap';
  
  // Pattern-based detection for Selection Sort
  // Look for: finding minimum index in remaining array
  if (
    (lowerCode.includes('minindex') || lowerCode.includes('min_index') || lowerCode.includes('minimumidx')) &&
    lowerCode.includes('for') &&
    !lowerCode.includes('binary') &&
    !lowerCode.includes('search')
  ) {
    return 'selection';
  }

  // Pattern-based detection: nested loop with min/minimum
  if (
    (lowerCode.includes(' min') || lowerCode.includes('minimum')) &&
    lowerCode.match(/for.*for/) &&
    !lowerCode.includes('binary')
  ) {
    // Check if it's finding minimum (selection) vs comparing adjacent (bubble)
    if (lowerCode.includes('minindex') || lowerCode.includes('min_index') || lowerCode.includes('swap.*min')) {
      return 'selection';
    }
    // Check for adjacent comparison pattern (bubble)
    if (lowerCode.includes('[j+1]') || lowerCode.includes('[j-1]')) {
      return 'bubble';
    }
  }

  // Pattern-based detection for Insertion Sort
  if (
    (lowerCode.includes('insert') || lowerCode.includes('shift')) &&
    lowerCode.includes('for') &&
    !lowerCode.includes('binary')
  ) {
    return 'insertion';
  }

  // Pattern-based detection for search algorithms
  if (lowerCode.includes('binary') && lowerCode.includes('search')) return 'binary_search';
  if (lowerCode.includes('linear') && lowerCode.includes('search')) return 'linear_search';
  if ((lowerCode.includes('for') && lowerCode.includes('search')) || (lowerCode.includes('find') && lowerCode.includes('for'))) {
    return 'linear_search';
  }

  // Default fallback
  return 'unknown';
}

function generateSelectionSortAnimation(arr: number[]): AlgorithmAnimation {
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

  const n = workingArr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;

    steps.push({
      stepNumber: stepNum++,
      description: `Starting pass ${i + 1}, assuming index ${i} (${workingArr[i]}) is current minimum`,
      array: [...workingArr],
      highlightedIndices: [i],
      highlightColor: 'active',
    });

    for (let j = i + 1; j < n; j++) {
      steps.push({
        stepNumber: stepNum++,
        description: `Comparing current minimum arr[${minIndex}]=${workingArr[minIndex]} with arr[${j}]=${workingArr[j]}`,
        array: [...workingArr],
        highlightedIndices: [minIndex, j],
        highlightColor: 'compare',
      });

      if (workingArr[j] < workingArr[minIndex]) {
        minIndex = j;
        steps.push({
          stepNumber: stepNum++,
          description: `New minimum found at index ${minIndex} (${workingArr[minIndex]})`,
          array: [...workingArr],
          highlightedIndices: [minIndex],
          highlightColor: 'active',
        });
      }
    }

    if (minIndex !== i) {
      [workingArr[i], workingArr[minIndex]] = [workingArr[minIndex], workingArr[i]];
      steps.push({
        stepNumber: stepNum++,
        description: `Swapping minimum element into position: swap arr[${i}] and arr[${minIndex}]`,
        array: [...workingArr],
        highlightedIndices: [i, minIndex],
        highlightColor: 'swap',
      });
    }

    steps.push({
      stepNumber: stepNum++,
      description: `Position ${i} fixed as part of the sorted prefix`,
      array: [...workingArr],
      highlightedIndices: [i],
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
    name: 'Selection Sort',
    steps,
    input: arr,
    output: workingArr,
    complexity: { time: 'O(n²)', space: 'O(1)' },
  };
}

function generateBubbleSortAnimation(arr: number[]): AlgorithmAnimation {
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

  const n = workingArr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        stepNumber: stepNum++,
        description: `Comparing arr[${j}]=${workingArr[j]} and arr[${j + 1}]=${workingArr[j + 1]}`,
        array: [...workingArr],
        highlightedIndices: [j, j + 1],
        highlightColor: 'compare',
      });

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
    complexity: { time: 'O(n²)', space: 'O(1)' },
  };
}

function generateAnimation(algorithm: string, input: any): AlgorithmAnimation | null {
  const defaultArray = [64, 34, 25, 12, 22, 11, 90, 88];
  const defaultTarget = 22;

  switch (algorithm) {
    case 'selection':
      return generateSelectionSortAnimation(input?.array || defaultArray);
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
      return generateBubbleSortAnimation(defaultArray);
  }
}

function generateQuickSortAnimation(arr: number[]): AlgorithmAnimation {
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
    complexity: { time: 'O(n log n) avg, O(n²) worst', space: 'O(log n)' },
  };
}

function generateMergeSortAnimation(arr: number[]): AlgorithmAnimation {
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

    while (i < leftArr.length) workingArr[k++] = leftArr[i++];
    while (j < rightArr.length) workingArr[k++] = rightArr[j++];

    steps.push({
      stepNumber: stepNum++,
      description: `Merge complete`,
      array: [...workingArr],
      highlightedIndices: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
      highlightColor: 'sorted',
    });
  };

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
    complexity: { time: 'O(n log n)', space: 'O(n)' },
  };
}

function generateLinearSearchAnimation(arr: number[], target: number): AlgorithmAnimation {
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
    complexity: { time: 'O(n)', space: 'O(1)' },
  };
}

function generateBinarySearchAnimation(arr: number[], target: number): AlgorithmAnimation {
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

  let left = 0, right = sortedArr.length - 1, foundIndex = -1;

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
    complexity: { time: 'O(log n)', space: 'O(1)' },
  };
}

function analyzeComplexity(code: string): ComplexityInfo | null {
  const lowerCode = code.toLowerCase();

  // Algorithm complexities map
  const complexities: Record<string, ComplexityInfo> = {
    'selection': {
      time: 'O(n²)',
      space: 'O(1)',
      description: 'Selection Sort repeatedly selects the minimum element from the unsorted portion and swaps it into the next position of the sorted prefix.',
    },
    'bubble': {
      time: 'O(n²)',
      space: 'O(1)',
      description: 'Bubble Sort repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
    },
    'quick': {
      time: 'O(n log n) avg, O(n²) worst',
      space: 'O(log n)',
      description: 'Quick Sort uses a divide-and-conquer approach with a pivot element. Average case is O(n log n), but can degrade to O(n²) with poor pivot selection.',
    },
    'merge': {
      time: 'O(n log n)',
      space: 'O(n)',
      description: 'Merge Sort divides the array in half recursively and then merges the sorted subarrays. Guaranteed O(n log n) but requires additional space.',
    },
    'binary': {
      time: 'O(log n)',
      space: 'O(1)',
      description: 'Binary Search efficiently finds an element in a sorted array by dividing the search space in half with each comparison.',
    },
    'linear': {
      time: 'O(n)',
      space: 'O(1)',
      description: 'Linear Search iterates through each element until the target is found or the end is reached. Simple but not efficient for large datasets.',
    },
  };

  for (const [key, complexity] of Object.entries(complexities)) {
    if (lowerCode.includes(key)) {
      return complexity;
    }
  }

  // Pattern matching
  if (lowerCode.match(/for\s*\(.*for\s*\(/)) {
    return {
      time: 'O(n²)',
      space: 'O(1)',
      description: 'Code contains nested loops - typical O(n²) complexity.',
    };
  }

  return {
    time: 'Varies',
    space: 'Varies',
    description: 'Unable to determine complexity. Check the algorithm documentation.',
  };
}

export const AlgorithmVisualizer: React.FC<AlgorithmVisualizerProps> = ({
  isOpen,
  onClose,
  code,
  questionTitle,
}) => {
  const [animation, setAnimation] = useState<AlgorithmAnimation | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [complexity, setComplexity] = useState<ComplexityInfo | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(1000);

  // Initialize animation on component mount or when code changes
  useEffect(() => {
    if (isOpen && code) {
      const algorithm = detectAlgorithm(code, questionTitle);
      const anim = generateAnimation(algorithm, undefined);
      setAnimation(anim);

      const comp = analyzeComplexity(code);
      setComplexity(comp);

      setCurrentStepIndex(0);
      setIsPlaying(false);
    }
  }, [isOpen, code]);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying || !animation) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < animation.steps.length - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, animationSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, animation, animationSpeed]);

  if (!isOpen || !animation) return null;

  const currentStep = animation.steps[currentStepIndex];

  const getHighlightColor = (color: string): string => {
    switch (color) {
      case 'compare':
        return 'bg-yellow-500/50';
      case 'swap':
        return 'bg-red-500/50';
      case 'sorted':
        return 'bg-emerald-500/50';
      case 'active':
        return 'bg-blue-500/50';
      case 'pivot':
        return 'bg-purple-500/50';
      default:
        return 'bg-slate-600/50';
    }
  };

  const getColorLabel = (color: string): string => {
    switch (color) {
      case 'compare':
        return 'Comparing';
      case 'swap':
        return 'Swapping';
      case 'sorted':
        return 'Sorted';
      case 'active':
        return 'Active';
      case 'pivot':
        return 'Pivot';
      default:
        return 'Highlighted';
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleNextStep = () => {
    if (currentStepIndex < animation.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setIsPlaying(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/10 border-b border-slate-800 p-6">
          <h2 className="text-2xl font-bold text-white mb-1">{animation.name} Visualizer</h2>
          {questionTitle && <p className="text-sm text-slate-400">Question: {questionTitle}</p>}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Complexity Info */}
          {complexity && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-slate-300">Time Complexity</span>
                </div>
                <p className="text-lg font-mono font-bold text-yellow-400">{complexity.time}</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-slate-300">Space Complexity</span>
                </div>
                <p className="text-lg font-mono font-bold text-blue-400">{complexity.space}</p>
              </div>
            </div>
          )}

          {/* Complexity Description */}
          {complexity && (
            <div className="bg-slate-950/50 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-300 leading-relaxed">{complexity.description}</p>
            </div>
          )}

          {/* Visualization Area */}
          <div className="bg-slate-950 border border-slate-700 rounded-lg p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-3">Array Visualization</p>
              <div className="flex items-end gap-2 h-48 justify-center bg-slate-900 rounded p-4">
                {currentStep.array.map((value, idx) => {
                  const isHighlighted = currentStep.highlightedIndices.includes(idx);
                  const maxValue = Math.max(...currentStep.array.filter((v) => v !== null)) || 1;
                  const heightPercent = ((value || 0) / maxValue) * 100;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div
                        className={`${
                          isHighlighted
                            ? getHighlightColor(currentStep.highlightColor)
                            : 'bg-indigo-500/30'
                        } transition-all duration-300 rounded-sm`}
                        style={{ width: '30px', height: `${Math.max(heightPercent, 10)}px` }}
                      />
                      <span className="text-xs text-slate-400 font-mono">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Description */}
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-2">Step Information</p>
              <div className="bg-slate-900 border border-slate-700 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    Step {currentStep.stepNumber} / {animation.steps.length - 1}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    currentStep.highlightColor === 'sorted'
                      ? 'bg-emerald-500/30 text-emerald-400'
                      : currentStep.highlightColor === 'swap'
                      ? 'bg-red-500/30 text-red-400'
                      : currentStep.highlightColor === 'compare'
                      ? 'bg-yellow-500/30 text-yellow-400'
                      : 'bg-blue-500/30 text-blue-400'
                  }`}>
                    {getColorLabel(currentStep.highlightColor)}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{currentStep.description}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                title="Previous Step"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handlePlayPause}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded flex items-center gap-2 transition-colors"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" /> Play
                  </>
                )}
              </button>

              <button
                onClick={handleNextStep}
                disabled={currentStepIndex === animation.steps.length - 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                title="Next Step"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Speed:</label>
              <select
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1"
              >
                <option value={2000}>Slow</option>
                <option value={1000}>Normal</option>
                <option value={500}>Fast</option>
                <option value={200}>Very Fast</option>
              </select>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                style={{
                  width: `${((currentStepIndex + 1) / animation.steps.length) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-400 text-center">
              {((currentStepIndex + 1) / animation.steps.length * 100).toFixed(0)}% Complete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
