export type DsaSubtopicKey =
  | 'arrays'
  | 'strings'
  | 'linked-list'
  | 'stack-queue'
  | 'trees'
  | 'graphs'
  | 'hashing'
  | 'heap'
  | 'dp'
  | 'greedy'
  | 'sorting-search'
  | 'math-bit'
  | 'other';

export const DSA_SUBTOPICS: { key: DsaSubtopicKey; label: string; keywords: string[] }[] = [
  { key: 'arrays', label: 'Arrays', keywords: ['array', 'two sum', 'subarray', 'prefix', 'sliding window'] },
  { key: 'strings', label: 'Strings', keywords: ['string', 'substring', 'palindrome', 'anagram', 'regex'] },
  { key: 'linked-list', label: 'Linked List', keywords: ['linked list', 'list node', 'linkedlist'] },
  { key: 'stack-queue', label: 'Stacks & Queues', keywords: ['stack', 'queue', 'monotonic', 'deque'] },
  { key: 'trees', label: 'Trees', keywords: ['tree', 'binary tree', 'bst', 'trie', 'traversal', 'heap'] },
  { key: 'graphs', label: 'Graphs', keywords: ['graph', 'bfs', 'dfs', 'dijkstra', 'topological', 'union find', 'disjoint'] },
  { key: 'hashing', label: 'Hashing', keywords: ['hash', 'map', 'dictionary', 'set'] },
  { key: 'heap', label: 'Heap', keywords: ['heap', 'priority queue'] },
  { key: 'dp', label: 'Dynamic Programming', keywords: ['dp', 'dynamic', 'memo', 'tabulation', 'knapsack'] },
  { key: 'greedy', label: 'Greedy', keywords: ['greedy', 'interval', 'activity selection'] },
  { key: 'sorting-search', label: 'Sorting & Search', keywords: ['sort', 'search', 'binary search', 'merge', 'quick'] },
  { key: 'math-bit', label: 'Math & Bit', keywords: ['math', 'bit', 'xor', 'gcd', 'prime'] },
  { key: 'other', label: 'Other', keywords: [] },
];

