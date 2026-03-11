-- ============================================================
--  InterviewAI - MySQL Schema with Comprehensive Questions
--  This includes 100+ questions across all categories
-- ============================================================

CREATE DATABASE IF NOT EXISTS interviewai;
USE interviewai;

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    email       VARCHAR(255) NOT NULL UNIQUE,
    username    VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name   VARCHAR(255),
    avatar_url  VARCHAR(500),
    plan        ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
    plan_active BOOLEAN DEFAULT FALSE,
    credits_used INT DEFAULT 0,
    credits_limit INT DEFAULT 100,
    streak_days INT DEFAULT 0,
    last_active DATE,
    level       INT DEFAULT 1,
    level_title VARCHAR(100) DEFAULT 'Beginner',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── Skill Categories ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    icon        VARCHAR(50),
    total_questions INT DEFAULT 0,
    is_locked   BOOLEAN DEFAULT FALSE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO skill_categories (name, slug, icon, total_questions, is_locked) VALUES
('React.js',       'reactjs',         'code',           50,  FALSE),
('JavaScript',     'javascript',      'layout',         60,  FALSE),
('System Design',  'system-design',   'server',         30,  FALSE),
('Data Structures','data-structures', 'database',       100, FALSE),
('Algorithms',     'algorithms',      'cpu',            80,  FALSE),
('Behavioral',     'behavioral',      'message-square', 40,  FALSE);

-- ─── User Skill Progress ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_skill_progress (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL,
    category_id     INT NOT NULL,
    questions_solved INT DEFAULT 0,
    score_percentage DECIMAL(5,2) DEFAULT 0.00,
    percentile_rank  DECIMAL(5,2) DEFAULT 0.00,
    last_practiced  DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES skill_categories(id),
    UNIQUE KEY uq_user_category (user_id, category_id)
);

-- ─── Questions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
    id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    category_id INT NOT NULL,
    title       VARCHAR(500) NOT NULL,
    difficulty  ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    tags        JSON,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES skill_categories(id),
    INDEX idx_category_questions (category_id),
    INDEX idx_difficulty (difficulty)
);

-- ═════════════════════════════════════════════════════════════
-- REACT.JS QUESTIONS (50 questions)
-- ═════════════════════════════════════════════════════════════

-- Easy (17 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('react-1', 1, 'Create a Simple Counter Component', 'easy', JSON_ARRAY('useState', 'Events', 'Components'), TRUE),
('react-2', 1, 'Understanding React Hooks', 'easy', JSON_ARRAY('Hooks', 'Fundamentals'), TRUE),
('react-3', 1, 'Conditional Rendering with JSX', 'easy', JSON_ARRAY('JSX', 'Conditionals'), TRUE),
('react-4', 1, 'Pass Props to Child Components', 'easy', JSON_ARRAY('Props', 'Component Communication'), TRUE),
('react-5', 1, 'List Rendering with .map()', 'easy', JSON_ARRAY('Rendering', 'Lists'), TRUE),
('react-6', 1, 'Handle Click Events', 'easy', JSON_ARRAY('Events', 'Handlers'), TRUE),
('react-7', 1, 'Update State with useState', 'easy', JSON_ARRAY('useState', 'State'), TRUE),
('react-8', 1, 'Component Composition Basics', 'easy', JSON_ARRAY('Components', 'Composition'), TRUE),
('react-9', 1, 'useEffect Hook Basics', 'easy', JSON_ARRAY('useEffect', 'Side Effects'), TRUE),
('react-10', 1, 'Form Input Handling', 'easy', JSON_ARRAY('Forms', 'Input'), TRUE),
('react-11', 1, 'Boolean Props and Conditions', 'easy', JSON_ARRAY('Props', 'Conditionals'), TRUE),
('react-12', 1, 'Fragment vs Regular Elements', 'easy', JSON_ARRAY('JSX', 'Fragments'), TRUE),
('react-13', 1, 'Key Prop in List Rendering', 'easy', JSON_ARRAY('Lists', 'Keys'), TRUE),
('react-14', 1, 'Styling with className', 'easy', JSON_ARRAY('Styling', 'CSS'), TRUE),
('react-15', 1, 'Default Props Pattern', 'easy', JSON_ARRAY('Props', 'Defaults'), TRUE),
('react-16', 1, 'Event Handler Binding', 'easy', JSON_ARRAY('Events', 'Binding'), TRUE),
('react-17', 1, 'Basic Component Rendering', 'easy', JSON_ARRAY('Rendering', 'Components'), TRUE);

-- Medium (22 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('react-18', 1, 'Todo List with Add and Delete', 'medium', JSON_ARRAY('useState', 'List Management'), TRUE),
('react-19', 1, 'Form Handling with React', 'medium', JSON_ARRAY('Forms', 'State Management'), TRUE),
('react-20', 1, 'useEffect Cleanup Function', 'medium', JSON_ARRAY('useEffect', 'Cleanup'), TRUE),
('react-21', 1, 'Lifting State Up Pattern', 'medium', JSON_ARRAY('State', 'Patterns'), TRUE),
('react-22', 1, 'Controlled vs Uncontrolled Components', 'medium', JSON_ARRAY('Forms', 'Components'), TRUE),
('react-23', 1, 'Multiple useState Calls', 'medium', JSON_ARRAY('useState', 'State Management'), TRUE),
('react-24', 1, 'useEffect with Dependencies', 'medium', JSON_ARRAY('useEffect', 'Dependencies'), TRUE),
('react-25', 1, 'Filter and Search Functionality', 'medium', JSON_ARRAY('Lists', 'Filtering'), TRUE),
('react-26', 1, 'Conditional Class Names', 'medium', JSON_ARRAY('Styling', 'Conditionals'), TRUE),
('react-27', 1, 'Debouncing Input Changes', 'medium', JSON_ARRAY('Performance', 'Events'), TRUE),
('react-28', 1, 'Array Immutability Patterns', 'medium', JSON_ARRAY('State', 'Immutability'), TRUE),
('react-29', 1, 'Object Immutability Patterns', 'medium', JSON_ARRAY('State', 'Immutability'), TRUE),
('react-30', 1, 'useCallback Performance', 'medium', JSON_ARRAY('useCallback', 'Performance'), TRUE),
('react-31', 1, 'useMemo for Expensive Computations', 'medium', JSON_ARRAY('useMemo', 'Performance'), TRUE),
('react-32', 1, 'useRef for DOM Access', 'medium', JSON_ARRAY('useRef', 'DOM'), TRUE),
('react-33', 1, 'Toggle Visibility Component', 'medium', JSON_ARRAY('State', 'Conditionals'), TRUE),
('react-34', 1, 'Counter with Limits', 'medium', JSON_ARRAY('useState', 'Validation'), TRUE),
('react-35', 1, 'Fetch Data on Mount', 'medium', JSON_ARRAY('useEffect', 'Fetch'), TRUE),
('react-36', 1, 'Loading States Management', 'medium', JSON_ARRAY('State', 'Loading'), TRUE),
('react-37', 1, 'Error Boundaries Basics', 'medium', JSON_ARRAY('Error Handling', 'Components'), TRUE),
('react-38', 1, 'Props Destructuring', 'medium', JSON_ARRAY('Props', 'Destructuring'), TRUE),
('react-39', 1, 'Component Reusability', 'medium', JSON_ARRAY('Components', 'Reusability'), TRUE);

-- Hard (11 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('react-40', 1, 'Custom Hooks - useCounter', 'hard', JSON_ARRAY('Custom Hooks', 'Advanced'), TRUE),
('react-41', 1, 'Custom Hooks - useForm', 'hard', JSON_ARRAY('Custom Hooks', 'Forms'), TRUE),
('react-42', 1, 'Context API for Global State', 'hard', JSON_ARRAY('Context', 'State Management'), TRUE),
('react-43', 1, 'useReducer for Complex State', 'hard', JSON_ARRAY('useReducer', 'State'), TRUE),
('react-44', 1, 'Custom Hook with useEffect', 'hard', JSON_ARRAY('Custom Hooks', 'useEffect'), TRUE),
('react-45', 1, 'Compound Components Pattern', 'hard', JSON_ARRAY('Patterns', 'Advanced'), TRUE),
('react-46', 1, 'Render Props Pattern', 'hard', JSON_ARRAY('Patterns', 'Advanced'), TRUE),
('react-47', 1, 'Higher Order Components (HOC)', 'hard', JSON_ARRAY('HOC', 'Advanced'), TRUE),
('react-48', 1, 'Lazy Loading Components', 'hard', JSON_ARRAY('Performance', 'Lazy Loading'), TRUE),
('react-49', 1, 'Suspense with Code Splitting', 'hard', JSON_ARRAY('Suspense', 'Code Splitting'), TRUE),
('react-50', 1, 'Web Workers in React', 'hard', JSON_ARRAY('Performance', 'Workers'), TRUE);

-- ═════════════════════════════════════════════════════════════
-- JAVASCRIPT QUESTIONS (60 questions)
-- ═════════════════════════════════════════════════════════════

-- Easy (20 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('js-1', 2, 'Array Methods - Filter', 'easy', JSON_ARRAY('Array', 'Methods'), TRUE),
('js-2', 2, 'Array Methods - Map', 'easy', JSON_ARRAY('Array', 'Methods'), TRUE),
('js-3', 2, 'String Methods - Substring vs Slice', 'easy', JSON_ARRAY('String', 'Methods'), TRUE),
('js-4', 2, 'var vs let vs const', 'easy', JSON_ARRAY('Variables', 'Scope'), TRUE),
('js-5', 2, 'Template Literals', 'easy', JSON_ARRAY('Strings', 'ES6'), TRUE),
('js-6', 2, 'Arrow Functions', 'easy', JSON_ARRAY('Functions', 'ES6'), TRUE),
('js-7', 2, 'Object Destructuring', 'easy', JSON_ARRAY('Objects', 'Destructuring'), TRUE),
('js-8', 2, 'Array Destructuring', 'easy', JSON_ARRAY('Arrays', 'Destructuring'), TRUE),
('js-9', 2, 'Spread Operator Basics', 'easy', JSON_ARRAY('Operators', 'ES6'), TRUE),
('js-10', 2, 'Rest Parameters', 'easy', JSON_ARRAY('Functions', 'Parameters'), TRUE),
('js-11', 2, 'typeof Operator', 'easy', JSON_ARRAY('Types', 'Operators'), TRUE),
('js-12', 2, 'Truthy and Falsy Values', 'easy', JSON_ARRAY('Conditionals', 'Types'), TRUE),
('js-13', 2, 'Comparison Operators', 'easy', JSON_ARRAY('Operators', 'Comparison'), TRUE),
('js-14', 2, 'Logical Operators', 'easy', JSON_ARRAY('Operators', 'Logic'), TRUE),
('js-15', 2, 'Ternary Operator', 'easy', JSON_ARRAY('Conditionals', 'Operators'), TRUE),
('js-16', 2, 'Array Methods - Reduce', 'easy', JSON_ARRAY('Array', 'Methods'), TRUE),
('js-17', 2, 'Array Methods - Find', 'easy', JSON_ARRAY('Array', 'Methods'), TRUE),
('js-18', 2, 'String Methods - indexOf', 'easy', JSON_ARRAY('String', 'Methods'), TRUE),
('js-19', 2, 'JSON Methods - Parse and Stringify', 'easy', JSON_ARRAY('JSON', 'Methods'), TRUE),
('js-20', 2, 'for Loop vs forEach', 'easy', JSON_ARRAY('Loops', 'Iteration'), TRUE);

-- Medium (25 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('js-21', 2, 'Closures Concept', 'medium', JSON_ARRAY('Closures', 'Scope'), TRUE),
('js-22', 2, 'this Keyword Binding', 'medium', JSON_ARRAY('this', 'Context'), TRUE),
('js-23', 2, 'Call, Apply, Bind Methods', 'medium', JSON_ARRAY('Functions', 'Context'), TRUE),
('js-24', 2, 'Hoisting in JavaScript', 'medium', JSON_ARRAY('Execution', 'Hoisting'), TRUE),
('js-25', 2, 'Scope Chain Explained', 'medium', JSON_ARRAY('Scope', 'Scoping'), TRUE),
('js-26', 2, 'Promise Basics', 'medium', JSON_ARRAY('Async', 'Promises'), TRUE),
('js-27', 2, 'Promise Chaining', 'medium', JSON_ARRAY('Async', 'Promises'), TRUE),
('js-28', 2, 'Async/Await Syntax', 'medium', JSON_ARRAY('Async', 'Await'), TRUE),
('js-29', 2, 'Try-Catch-Finally', 'medium', JSON_ARRAY('Error Handling', 'Exceptions'), TRUE),
('js-30', 2, 'setTimeout and setInterval', 'medium', JSON_ARRAY('Timing', 'Async'), TRUE),
('js-31', 2, 'Event Loop Explained', 'medium', JSON_ARRAY('Execution', 'Event Loop'), TRUE),
('js-32', 2, 'Callback Functions', 'medium', JSON_ARRAY('Functions', 'Callbacks'), TRUE),
('js-33', 2, 'Array Methods - Some and Every', 'medium', JSON_ARRAY('Array', 'Methods'), TRUE),
('js-34', 2, 'Object Methods - Keys, Values, Entries', 'medium', JSON_ARRAY('Objects', 'Methods'), TRUE),
('js-35', 2, 'Shallow vs Deep Copy', 'medium', JSON_ARRAY('Objects', 'Copying'), TRUE),
('js-36', 2, 'for...in vs for...of', 'medium', JSON_ARRAY('Loops', 'Iteration'), TRUE),
('js-37', 2, 'String Methods - Split and Join', 'medium', JSON_ARRAY('String', 'Methods'), TRUE),
('js-38', 2, 'Regular Expressions Basics', 'medium', JSON_ARRAY('RegEx', 'Patterns'), TRUE),
('js-39', 2, 'Fetch API Basics', 'medium', JSON_ARRAY('API', 'HTTP'), TRUE),
('js-40', 2, 'Error Handling in Async', 'medium', JSON_ARRAY('Error Handling', 'Async'), TRUE),
('js-41', 2, 'Array Flattening', 'medium', JSON_ARRAY('Array', 'Manipulation'), TRUE),
('js-42', 2, 'Object Merging Patterns', 'medium', JSON_ARRAY('Objects', 'Patterns'), TRUE),
('js-43', 2, 'Function Currying', 'medium', JSON_ARRAY('Functions', 'Advanced'), TRUE),
('js-44', 2, 'Memoization Pattern', 'medium', JSON_ARRAY('Performance', 'Patterns'), TRUE),
('js-45', 2, 'Module Pattern in JavaScript', 'medium', JSON_ARRAY('Patterns', 'Modules'), TRUE);

-- Hard (15 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('js-46', 2, 'Prototype and Inheritance', 'hard', JSON_ARRAY('OOP', 'Prototypes'), TRUE),
('js-47', 2, 'Prototype Chain', 'hard', JSON_ARRAY('OOP', 'Prototypes'), TRUE),
('js-48', 2, 'Object.create() vs Constructor', 'hard', JSON_ARRAY('OOP', 'Objects'), TRUE),
('js-49', 2, 'Class Syntax and Inheritance', 'hard', JSON_ARRAY('Classes', 'OOP'), TRUE),
('js-50', 2, 'Static Methods and Properties', 'hard', JSON_ARRAY('Classes', 'Static'), TRUE),
('js-51', 2, 'Generators and Iterators', 'hard', JSON_ARRAY('Advanced', 'Generators'), TRUE),
('js-52', 2, 'Async Generators', 'hard', JSON_ARRAY('Async', 'Generators'), TRUE),
('js-53', 2, 'Proxy and Reflect', 'hard', JSON_ARRAY('Advanced', 'Metaprogramming'), TRUE),
('js-54', 2, 'WeakMap and WeakSet', 'hard', JSON_ARRAY('Collections', 'Advanced'), TRUE),
('js-55', 2, 'Promise.all and Promise.race', 'hard', JSON_ARRAY('Async', 'Promises'), TRUE),
('js-56', 2, 'setTimeout and Promise Execution Order', 'hard', JSON_ARRAY('Event Loop', 'Advanced'), TRUE),
('js-57', 2, 'Decorator Pattern Implementation', 'hard', JSON_ARRAY('Patterns', 'Design'), TRUE),
('js-58', 2, 'Observable Pattern', 'hard', JSON_ARRAY('Patterns', 'Advanced'), TRUE),
('js-59', 2, 'Web Workers and Threading', 'hard', JSON_ARRAY('Performance', 'Workers'), TRUE),
('js-60', 2, 'Service Workers Basics', 'hard', JSON_ARRAY('PWA', 'Service Workers'), TRUE);

-- ═════════════════════════════════════════════════════════════
-- DATA STRUCTURES QUESTIONS (50 questions)
-- ═════════════════════════════════════════════════════════════

-- Easy (15 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('dsa-1', 4, 'Two Sum Problem', 'easy', JSON_ARRAY('Hash Map', 'Array'), TRUE),
('dsa-2', 4, 'Palindrome String Check', 'easy', JSON_ARRAY('String', 'Two Pointers'), TRUE),
('dsa-3', 4, 'Array Sum', 'easy', JSON_ARRAY('Array', 'Math'), TRUE),
('dsa-4', 4, 'Find Maximum Element', 'easy', JSON_ARRAY('Array', 'Iteration'), TRUE),
('dsa-5', 4, 'Count Occurrences', 'easy', JSON_ARRAY('Array', 'Hash Map'), TRUE),
('dsa-6', 4, 'Remove Duplicates from Array', 'easy', JSON_ARRAY('Array', 'Set'), TRUE),
('dsa-7', 4, 'Merge Two Sorted Arrays', 'easy', JSON_ARRAY('Array', 'Merge'), TRUE),
('dsa-8', 4, 'Reverse a String', 'easy', JSON_ARRAY('String', 'Reversal'), TRUE),
('dsa-9', 4, 'Binary Search Basic', 'easy', JSON_ARRAY('Search', 'Sorting'), TRUE),
('dsa-10', 4, 'Bubble Sort Implementation', 'easy', JSON_ARRAY('Sorting', 'Algorithms'), TRUE),
('dsa-11', 4, 'Selection Sort Implementation', 'easy', JSON_ARRAY('Sorting', 'Algorithms'), TRUE),
('dsa-12', 4, 'Valid Parentheses Check', 'easy', JSON_ARRAY('Stack', 'String'), TRUE),
('dsa-13', 4, 'Implement Stack with Array', 'easy', JSON_ARRAY('Stack', 'Implementation'), TRUE),
('dsa-14', 4, 'Implement Queue with Array', 'easy', JSON_ARRAY('Queue', 'Implementation'), TRUE),
('dsa-15', 4, 'Fibonacci Series', 'easy', JSON_ARRAY('Recursion', 'Math'), TRUE);

-- Medium (20 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('dsa-16', 4, 'Linked List Reversal', 'medium', JSON_ARRAY('Linked List', 'Reversal'), TRUE),
('dsa-17', 4, 'Linked List Cycle Detection', 'medium', JSON_ARRAY('Linked List', 'Cycle'), TRUE),
('dsa-18', 4, 'Remove nth Node from Linked List', 'medium', JSON_ARRAY('Linked List', 'Deletion'), TRUE),
('dsa-19', 4, 'Merge Two Sorted Linked Lists', 'medium', JSON_ARRAY('Linked List', 'Merge'), TRUE),
('dsa-20', 4, 'Middle of Linked List', 'medium', JSON_ARRAY('Linked List', 'Traversal'), TRUE),
('dsa-21', 4, 'Binary Tree Traversal - Inorder', 'medium', JSON_ARRAY('Tree', 'Traversal'), TRUE),
('dsa-22', 4, 'Binary Tree Traversal - Preorder', 'medium', JSON_ARRAY('Tree', 'Traversal'), TRUE),
('dsa-23', 4, 'Binary Tree Traversal - Postorder', 'medium', JSON_ARRAY('Tree', 'Traversal'), TRUE),
('dsa-24', 4, 'Binary Tree Level Order', 'medium', JSON_ARRAY('Tree', 'BFS'), TRUE),
('dsa-25', 4, 'Binary Tree Height', 'medium', JSON_ARRAY('Tree', 'Recursion'), TRUE),
('dsa-26', 4, 'Two Sum Sorted Array', 'medium', JSON_ARRAY('Two Pointers', 'Array'), TRUE),
('dsa-27', 4, 'Container with Most Water', 'medium', JSON_ARRAY('Two Pointers', 'Greedy'), TRUE),
('dsa-28', 4, 'Longest Substring without Repeating', 'medium', JSON_ARRAY('Sliding Window', 'String'), TRUE),
('dsa-29', 4, 'Permutations of String', 'medium', JSON_ARRAY('Backtracking', 'Recursion'), TRUE),
('dsa-30', 4, 'Combinations Problem', 'medium', JSON_ARRAY('Backtracking', 'Recursion'), TRUE),
('dsa-31', 4, 'Merge Sort Implementation', 'medium', JSON_ARRAY('Sorting', 'Divide and Conquer'), TRUE),
('dsa-32', 4, 'Quick Sort Implementation', 'medium', JSON_ARRAY('Sorting', 'Divide and Conquer'), TRUE),
('dsa-33', 4, 'Heap Sort Implementation', 'medium', JSON_ARRAY('Sorting', 'Heap'), TRUE),
('dsa-34', 4, 'Min Stack Problem', 'medium', JSON_ARRAY('Stack', 'Design'), TRUE),
('dsa-35', 4, 'Evaluate Reverse Polish Notation', 'medium', JSON_ARRAY('Stack', 'Expression'), TRUE);

-- Hard (15 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('dsa-36', 4, 'LRU Cache Implementation', 'hard', JSON_ARRAY('Design', 'Cache'), TRUE),
('dsa-37', 4, 'Binary Search Tree Implementation', 'hard', JSON_ARRAY('Tree', 'BST'), TRUE),
('dsa-38', 4, 'AVL Tree Balancing', 'hard', JSON_ARRAY('Tree', 'Balanced'), TRUE),
('dsa-39', 4, 'Red-Black Tree Basics', 'hard', JSON_ARRAY('Tree', 'Balanced'), TRUE),
('dsa-40', 4, 'Graph Representation', 'hard', JSON_ARRAY('Graph', 'Representation'), TRUE),
('dsa-41', 4, 'Graph DFS Implementation', 'hard', JSON_ARRAY('Graph', 'DFS'), TRUE),
('dsa-42', 4, 'Graph BFS Implementation', 'hard', JSON_ARRAY('Graph', 'BFS'), TRUE),
('dsa-43', 4, 'Dijkstra Algorithm', 'hard', JSON_ARRAY('Graph', 'Shortest Path'), TRUE),
('dsa-44', 4, 'Floyd-Warshall Algorithm', 'hard', JSON_ARRAY('Graph', 'Shortest Path'), TRUE),
('dsa-45', 4, 'Topological Sort', 'hard', JSON_ARRAY('Graph', 'DAG'), TRUE),
('dsa-46', 4, 'Union Find (Disjoint Set)', 'hard', JSON_ARRAY('Graph', 'Union Find'), TRUE),
('dsa-47', 4, 'Kruskal Algorithm', 'hard', JSON_ARRAY('Graph', 'MST'), TRUE),
('dsa-48', 4, 'Prim Algorithm', 'hard', JSON_ARRAY('Graph', 'MST'), TRUE),
('dsa-49', 4, 'Trie Implementation', 'hard', JSON_ARRAY('Tree', 'Trie'), TRUE),
('dsa-50', 4, 'Segment Tree Implementation', 'hard', JSON_ARRAY('Tree', 'Advanced'), TRUE);

-- ═════════════════════════════════════════════════════════════
-- ALGORITHMS QUESTIONS (40 questions)
-- ═════════════════════════════════════════════════════════════

-- Easy (10 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('algo-1', 5, 'Linear Search', 'easy', JSON_ARRAY('Search', 'Basic'), TRUE),
('algo-2', 5, 'Factorial Calculation', 'easy', JSON_ARRAY('Recursion', 'Math'), TRUE),
('algo-3', 5, 'Prime Number Check', 'easy', JSON_ARRAY('Math', 'Logic'), TRUE),
('algo-4', 5, 'GCD Calculation', 'easy', JSON_ARRAY('Math', 'Euclidean'), TRUE),
('algo-5', 5, 'LCM Calculation', 'easy', JSON_ARRAY('Math', 'Number Theory'), TRUE),
('algo-6', 5, 'Sum of N Natural Numbers', 'easy', JSON_ARRAY('Math', 'Formula'), TRUE),
('algo-7', 5, 'Power Function', 'easy', JSON_ARRAY('Math', 'Exponentiation'), TRUE),
('algo-8', 5, 'Odd or Even Check', 'easy', JSON_ARRAY('Logic', 'Bitwise'), TRUE),
('algo-9', 5, 'Armstrong Number Check', 'easy', JSON_ARRAY('Math', 'Number Theory'), TRUE),
('algo-10', 5, 'Palindrome Number Check', 'easy', JSON_ARRAY('Math', 'Number Theory'), TRUE);

-- Medium (20 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('algo-11', 5, 'Binary Exponentiation', 'medium', JSON_ARRAY('Math', 'Optimization'), TRUE),
('algo-12', 5, 'Modular Arithmetic', 'medium', JSON_ARRAY('Math', 'Number Theory'), TRUE),
('algo-13', 5, 'Sieve of Eratosthenes', 'medium', JSON_ARRAY('Number Theory', 'Optimization'), TRUE),
('algo-14', 5, 'Prime Factorization', 'medium', JSON_ARRAY('Number Theory', 'Math'), TRUE),
('algo-15', 5, 'Extended Euclidean Algorithm', 'medium', JSON_ARRAY('Number Theory', 'Math'), TRUE),
('algo-16', 5, 'Catalan Numbers', 'medium', JSON_ARRAY('Combinatorics', 'DP'), TRUE),
('algo-17', 5, 'Random Shuffle Algorithm', 'medium', JSON_ARRAY('Randomization', 'Shuffle'), TRUE),
('algo-18', 5, 'Counting Sort', 'medium', JSON_ARRAY('Sorting', 'Non-Comparison'), TRUE),
('algo-19', 5, 'Radix Sort', 'medium', JSON_ARRAY('Sorting', 'Non-Comparison'), TRUE),
('algo-20', 5, 'Bucket Sort', 'medium', JSON_ARRAY('Sorting', 'Non-Comparison'), TRUE),
('algo-21', 5, 'Stable Sorting Algorithms', 'medium', JSON_ARRAY('Sorting', 'Stability'), TRUE),
('algo-22', 5, 'Bitwise Operations', 'medium', JSON_ARRAY('Bitwise', 'Logic'), TRUE),
('algo-23', 5, 'Greedy Algorithm Basics', 'medium', JSON_ARRAY('Greedy', 'Optimization'), TRUE),
('algo-24', 5, 'Activity Selection Problem', 'medium', JSON_ARRAY('Greedy', 'Optimization'), TRUE),
('algo-25', 5, 'Fractional Knapsack', 'medium', JSON_ARRAY('Greedy', 'Optimization'), TRUE),
('algo-26', 5, 'Huffman Coding', 'medium', JSON_ARRAY('Greedy', 'Compression'), TRUE),
('algo-27', 5, 'String Matching - KMP', 'medium', JSON_ARRAY('String', 'Matching'), TRUE),
('algo-28', 5, 'String Matching - Boyer-Moore', 'medium', JSON_ARRAY('String', 'Matching'), TRUE),
('algo-29', 5, 'Rabin-Karp Algorithm', 'medium', JSON_ARRAY('String', 'Hashing'), TRUE),
('algo-30', 5, 'Long Common Subsequence', 'medium', JSON_ARRAY('DP', 'String'), TRUE);

-- Hard (10 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('algo-31', 5, 'Edit Distance (Levenshtein)', 'hard', JSON_ARRAY('DP', 'String'), TRUE),
('algo-32', 5, 'Matrix Chain Multiplication', 'hard', JSON_ARRAY('DP', 'Optimization'), TRUE),
('algo-33', 5, 'Travelling Salesman Problem', 'hard', JSON_ARRAY('DP', 'NP-Hard'), TRUE),
('algo-34', 5, 'Knapsack 0/1 Problem', 'hard', JSON_ARRAY('DP', 'Optimization'), TRUE),
('algo-35', 5, 'Coin Change Problem', 'hard', JSON_ARRAY('DP', 'Optimization'), TRUE),
('algo-36', 5, 'Maximum Subarray Sum', 'hard', JSON_ARRAY('DP', 'Kadane'), TRUE),
('algo-37', 5, 'Longest Increasing Subsequence', 'hard', JSON_ARRAY('DP', 'Subsequence'), TRUE),
('algo-38', 5, 'Word Break Problem', 'hard', JSON_ARRAY('DP', 'String'), TRUE),
('algo-39', 5, 'Regex Matching', 'hard', JSON_ARRAY('DP', 'String'), TRUE),
('algo-40', 5, 'First Missing Positive', 'hard', JSON_ARRAY('Array', 'Optimization'), TRUE);

-- ═════════════════════════════════════════════════════════════
-- SYSTEM DESIGN QUESTIONS (30 questions)
-- ═════════════════════════════════════════════════════════════

-- Medium (20 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('sysdes-1', 3, 'Design a URL Shortener', 'medium', JSON_ARRAY('System Design', 'Scalability'), TRUE),
('sysdes-2', 3, 'Design a Chat Application', 'medium', JSON_ARRAY('System Design', 'Real-time'), TRUE),
('sysdes-3', 3, 'Design a Parking Lot', 'medium', JSON_ARRAY('OOAD', 'Design'), TRUE),
('sysdes-4', 3, 'Design an ATM System', 'medium', JSON_ARRAY('OOAD', 'Design'), TRUE),
('sysdes-5', 3, 'Design a Movie Booking System', 'medium', JSON_ARRAY('OOAD', 'Database'), TRUE),
('sysdes-6', 3, 'Design a Library System', 'medium', JSON_ARRAY('OOAD', 'Design'), TRUE),
('sysdes-7', 3, 'Design a Taxi Booking System', 'medium', JSON_ARRAY('System Design', 'Scalability'), TRUE),
('sysdes-8', 3, 'Design a Notification System', 'medium', JSON_ARRAY('System Design', 'Messaging'), TRUE),
('sysdes-9', 3, 'Design a Rate Limiter', 'medium', JSON_ARRAY('System Design', 'Performance'), TRUE),
('sysdes-10', 3, 'Design a File Sharing System', 'medium', JSON_ARRAY('System Design', 'Storage'), TRUE),
('sysdes-11', 3, 'Design a Search Autocomplete', 'medium', JSON_ARRAY('System Design', 'Performance'), TRUE),
('sysdes-12', 3, 'Design a News Feed System', 'medium', JSON_ARRAY('System Design', 'Scalability'), TRUE),
('sysdes-13', 3, 'Design a Key-Value Store', 'medium', JSON_ARRAY('System Design', 'Database'), TRUE),
('sysdes-14', 3, 'Design a Web Crawler', 'medium', JSON_ARRAY('System Design', 'Scalability'), TRUE),
('sysdes-15', 3, 'Design a Video Streaming Platform', 'medium', JSON_ARRAY('System Design', 'Streaming'), TRUE),
('sysdes-16', 3, 'Design a Recommendation Engine', 'medium', JSON_ARRAY('System Design', 'ML'), TRUE),
('sysdes-17', 3, 'Design a Stock Exchange System', 'medium', JSON_ARRAY('System Design', 'High Frequency'), TRUE),
('sysdes-18', 3, 'Design a Distributed Queue', 'medium', JSON_ARRAY('System Design', 'Messaging'), TRUE),
('sysdes-19', 3, 'Design a Publish-Subscribe System', 'medium', JSON_ARRAY('System Design', 'Messaging'), TRUE),
('sysdes-20', 3, 'Design a Comment System', 'medium', JSON_ARRAY('System Design', 'Database'), TRUE);

-- Hard (10 questions)
INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('sysdes-21', 3, 'Cache Service Design', 'hard', JSON_ARRAY('Caching', 'Database'), TRUE),
('sysdes-22', 3, 'Load Balancer Design', 'hard', JSON_ARRAY('Distributed', 'Network'), TRUE),
('sysdes-23', 3, 'Consistent Hashing', 'hard', JSON_ARRAY('Distributed', 'Hashing'), TRUE),
('sysdes-24', 3, 'Database Sharding Strategy', 'hard', JSON_ARRAY('Database', 'Scalability'), TRUE),
('sysdes-25', 3, 'Distributed Consensus (Raft)', 'hard', JSON_ARRAY('Distributed', 'Consensus'), TRUE),
('sysdes-26', 3, 'CAP Theorem Tradeoffs', 'hard', JSON_ARRAY('Distributed', 'Theory'), TRUE),
('sysdes-27', 3, 'Microservices Architecture', 'hard', JSON_ARRAY('Architecture', 'Design'), TRUE),
('sysdes-28', 3, 'Event Sourcing Pattern', 'hard', JSON_ARRAY('Patterns', 'Architecture'), TRUE),
('sysdes-29', 3, 'CQRS Pattern', 'hard', JSON_ARRAY('Patterns', 'Architecture'), TRUE),
('sysdes-30', 3, 'Distributed Transaction Handling', 'hard', JSON_ARRAY('Database', 'Transactions'), TRUE);

-- ═════════════════════════════════════════════════════════════
-- BEHAVIORAL QUESTIONS (40 questions)
-- ═════════════════════════════════════════════════════════════

INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
('behavioral-1', 6, 'Tell me about a conflict you resolved', 'medium', JSON_ARRAY('Communication', 'Teamwork'), TRUE),
('behavioral-2', 6, 'Describe a time you led a project', 'medium', JSON_ARRAY('Leadership', 'Project Management'), TRUE),
('behavioral-3', 6, 'When did you take initiative?', 'easy', JSON_ARRAY('Initiative', 'Proactive'), TRUE),
('behavioral-4', 6, 'Tell me about a failure and what you learned', 'medium', JSON_ARRAY('Growth', 'Learning'), TRUE),
('behavioral-5', 6, 'How do you handle tight deadlines?', 'easy', JSON_ARRAY('Time Management', 'Pressure'), TRUE),
('behavioral-6', 6, 'Describe your ideal work environment', 'easy', JSON_ARRAY('Alignment', 'Culture'), TRUE),
('behavioral-7', 6, 'How do you stay updated with technology?', 'easy', JSON_ARRAY('Learning', 'Growth'), TRUE),
('behavioral-8', 6, 'Tell me about your greatest accomplishment', 'medium', JSON_ARRAY('Achievement', 'Impact'), TRUE),
('behavioral-9', 6, 'How do you handle criticism?', 'easy', JSON_ARRAY('Feedback', 'Growth'), TRUE),
('behavioral-10', 6, 'Describe a time you helped a colleague', 'easy', JSON_ARRAY('Teamwork', 'Collaboration'), TRUE),
('behavioral-11', 6, 'What is your approach to problem-solving?', 'medium', JSON_ARRAY('Problem Solving', 'Thinking'), TRUE),
('behavioral-12', 6, 'Tell me about working with difficult team members', 'medium', JSON_ARRAY('Teamwork', 'Conflict'), TRUE),
('behavioral-13', 6, 'How do you prioritize tasks?', 'easy', JSON_ARRAY('Prioritization', 'Organization'), TRUE),
('behavioral-14', 6, 'Describe your experience with agile methodology', 'medium', JSON_ARRAY('Agile', 'Processes'), TRUE),
('behavioral-15', 6, 'Tell me about your career goals', 'easy', JSON_ARRAY('Goals', 'Career'), TRUE),
('behavioral-16', 6, 'How do you handle scope creep?', 'medium', JSON_ARRAY('Project Management', 'Boundaries'), TRUE),
('behavioral-17', 6, 'Describe a technical debt situation you resolved', 'hard', JSON_ARRAY('Technical', 'Decision Making'), TRUE),
('behavioral-18', 6, 'Tell me about a time you advocated for a technical solution', 'hard', JSON_ARRAY('Technical', 'Leadership'), TRUE),
('behavioral-19', 6, 'How do you onboard new team members?', 'medium', JSON_ARRAY('Mentoring', 'Leadership'), TRUE),
('behavioral-20', 6, 'Describe your approach to code reviews', 'medium', JSON_ARRAY('Code Quality', 'Collaboration'), TRUE),
('behavioral-21', 6, 'Tell me about a production incident you handled', 'hard', JSON_ARRAY('Crisis', 'Technical'), TRUE),
('behavioral-22', 6, 'How do you balance technical excellence and time constraints?', 'hard', JSON_ARRAY('Decision Making', 'Tradeoffs'), TRUE),
('behavioral-23', 6, 'Describe your most complex project', 'hard', JSON_ARRAY('Technical', 'Complexity'), TRUE),
('behavioral-24', 6, 'What would your colleagues say about you?', 'easy', JSON_ARRAY('Self Awareness', 'Perception'), TRUE),
('behavioral-25', 6, 'How do you handle ambiguous requirements?', 'medium', JSON_ARRAY('Clarity', 'Communication'), TRUE),
('behavioral-26', 6, 'Tell me about your technical mentorship experience', 'medium', JSON_ARRAY('Mentoring', 'Growth'), TRUE),
('behavioral-27', 6, 'Describe a time you improved team processes', 'medium', JSON_ARRAY('Improvement', 'Leadership'), TRUE),
('behavioral-28', 6, 'How do you approach learning new technologies?', 'easy', JSON_ARRAY('Learning', 'Growth'), TRUE),
('behavioral-29', 6, 'Tell me about your most important technical decision', 'hard', JSON_ARRAY('Technical', 'Leadership'), TRUE),
('behavioral-30', 6, 'Describe your role in a cross-functional project', 'medium', JSON_ARRAY('Collaboration', 'Project'), TRUE),
('behavioral-31', 6, 'How do you handle disagreement with a senior engineer?', 'hard', JSON_ARRAY('Communication', 'Respect'), TRUE),
('behavioral-32', 6, 'Tell me about a time you broke a production system', 'medium', JSON_ARRAY('Resilience', 'Learning'), TRUE),
('behavioral-33', 6, 'How do you ensure code maintainability?', 'medium', JSON_ARRAY('Technical', 'Best Practices'), TRUE),
('behavioral-34', 6, 'Describe your approach to technical documentation', 'easy', JSON_ARRAY('Documentation', 'Communication'), TRUE),
('behavioral-35', 6, 'Tell me about your open source contributions', 'medium', JSON_ARRAY('Community', 'Open Source'), TRUE),
('behavioral-36', 6, 'How do you stay motivated in long projects?', 'easy', JSON_ARRAY('Motivation', 'Resilience'), TRUE),
('behavioral-37', 6, 'Describe a time you had to learn something quickly', 'medium', JSON_ARRAY('Adaptability', 'Learning'), TRUE),
('behavioral-38', 6, 'How do you approach technical interviews?', 'easy', JSON_ARRAY('Preparation', 'Interview'), TRUE),
('behavioral-39', 6, 'Tell me about your most impressive bug fix', 'medium', JSON_ARRAY('Problem Solving', 'Technical'), TRUE),
('behavioral-40', 6, 'Why are you interested in this position?', 'easy', JSON_ARRAY('Alignment', 'Motivation'), TRUE);

-- ─── Practice Sessions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS practice_sessions (
    id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
    user_id     VARCHAR(36)  NOT NULL,
    category_id INT NOT NULL,
    question_id VARCHAR(36)  NOT NULL,
    status      ENUM('started', 'submitted', 'evaluated') DEFAULT 'started',
    score       DECIMAL(5,2),
    time_spent  INT COMMENT 'seconds',
    started_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES skill_categories(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- ─── Achievements ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    icon        VARCHAR(100),
    badge_color VARCHAR(20),
    condition_type VARCHAR(50) COMMENT 'streak, questions_solved, score, etc.',
    condition_value INT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        VARCHAR(36) NOT NULL,
    achievement_id INT NOT NULL,
    earned_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    UNIQUE KEY uq_user_achievement (user_id, achievement_id)
);

-- Seed some achievements
INSERT INTO achievements (name, description, icon, badge_color, condition_type, condition_value) VALUES
('First Steps',      'Solve your first question',          '🎯', 'green',  'questions_solved', 1),
('On Fire',          'Maintain a 7-day streak',            '🔥', 'orange', 'streak_days',      7),
('Century Club',     'Solve 100 questions',                '💯', 'gold',   'questions_solved', 100),
('Speed Demon',      'Solve a question under 5 minutes',   '⚡', 'yellow', 'time_under',       300),
('Perfectionist',    'Score 100% on any question',         '💎', 'purple', 'perfect_score',    100);
