/**
 * Backfill Mongo `questions` content for all SQL-seeded practice questions.
 *
 * Why:
 * - SQL stores the question catalog (id/title/difficulty/category)
 * - Mongo stores detailed content (description, examples, test_cases, starter_code)
 * - Many questions may exist in SQL but have incomplete/missing Mongo content.
 *
 * What this script does:
 * - Parses docker/mysql-init-comprehensive.sql for all INSERTed questions
 * - For each question_id, ensures Mongo doc has complete practice content
 * - Preserves already-complete docs (description + >=2 test cases)
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const MONGO_URL =
  process.env.MONGO_URL ||
  'mongodb://root:rootpassword@localhost:27017/interviewai?authSource=admin';
const DB_NAME = process.env.MONGO_DB_NAME || 'interviewai';
const SQL_FILE =
  process.env.SQL_FILE ||
  path.join(__dirname, 'docker', 'mysql-init-comprehensive.sql');

const CATEGORY_BY_ID = {
  1: { slug: 'reactjs', type: 'coding' },
  2: { slug: 'javascript', type: 'coding' },
  3: { slug: 'system-design', type: 'system-design' },
  4: { slug: 'data-structures', type: 'coding' },
  5: { slug: 'algorithms', type: 'coding' },
  6: { slug: 'behavioral', type: 'descriptive' },
};

const STARTER_CODE = {
  javascript: `function solve(input) {\n  // TODO: implement\n  return null;\n}`,
  typescript: `function solve(input: any): any {\n  // TODO: implement\n  return null;\n}`,
  python: `def solve(input):\n    # TODO: implement\n    return None`,
};

function parseQuestionsFromSql(sqlText) {
  const rows = [];
  // Matches tuples like: ('dsa-1', 4, 'Two Sum Problem', 'easy', JSON_ARRAY(...), TRUE)
  const tupleRegex = /\('([^']+)',\s*(\d+),\s*'((?:[^']|''|\\')*)',\s*'(easy|medium|hard)',\s*JSON_ARRAY\((.*?)\),\s*TRUE\)/gms;
  let m;
  while ((m = tupleRegex.exec(sqlText)) !== null) {
    const id = m[1];
    const categoryId = Number(m[2]);
    const title = m[3].replace(/''/g, "'");
    const difficulty = m[4];
    const tagsRaw = m[5] || '';
    const tags = [...tagsRaw.matchAll(/'([^']+)'/g)].map((x) => x[1]);
    rows.push({ id, categoryId, title, difficulty, tags });
  }
  return rows;
}

function hasCompleteContent(doc) {
  if (!doc) return false;
  const hasDescription = typeof doc.description === 'string' && doc.description.trim().length > 40;
  const hasTests = Array.isArray(doc.test_cases) && doc.test_cases.length >= 2;
  const hasStarter =
    doc.starter_code &&
    (typeof doc.starter_code.javascript === 'string' ||
      typeof doc.starter_code.python === 'string');
  return hasDescription && hasTests && hasStarter;
}

function buildCodingContent(q) {
  const title = q.title.toLowerCase();

  if (title.includes('two sum')) {
    return {
      description:
        'Given an integer array and a target, return indices of two numbers whose sum equals target. Use an efficient approach.',
      constraints: [
        '2 <= nums.length <= 10^4',
        'Exactly one valid answer exists',
        'Do not use the same element twice',
      ],
      examples: [
        { input: 'nums=[2,7,11,15], target=9', output: '[0,1]', explanation: '2+7=9' },
        { input: 'nums=[3,2,4], target=6', output: '[1,2]', explanation: '2+4=6' },
      ],
      test_cases: [
        { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1], hidden: false },
        { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2], hidden: false },
        { input: { nums: [3, 3], target: 6 }, expected: [0, 1], hidden: true },
      ],
      starter_code: {
        javascript: `function solve(nums, target) {\n  // return [i, j]\n  return [];\n}`,
        typescript: `function solve(nums: number[], target: number): number[] {\n  // return [i, j]\n  return [];\n}`,
        python: `def solve(nums, target):\n    # return [i, j]\n    return []`,
      },
    };
  }

  if (title.includes('sort')) {
    return {
      description:
        `Implement ${q.title}. Return the array sorted in ascending order. Aim for clean logic and edge-case handling.`,
      constraints: ['Handle empty/single-element arrays', 'Return sorted output', 'Do not use built-in sort'],
      examples: [
        { input: '[5,2,8,1,9]', output: '[1,2,5,8,9]', explanation: 'Ascending order' },
      ],
      test_cases: [
        { input: { arr: [5, 2, 8, 1, 9] }, expected: [1, 2, 5, 8, 9], hidden: false },
        { input: { arr: [1, 2, 3] }, expected: [1, 2, 3], hidden: false },
        { input: { arr: [3, 2, 1] }, expected: [1, 2, 3], hidden: true },
      ],
      starter_code: {
        javascript: `function solve(arr) {\n  // return sorted array\n  return arr;\n}`,
        typescript: `function solve(arr: number[]): number[] {\n  // return sorted array\n  return arr;\n}`,
        python: `def solve(arr):\n    # return sorted array\n    return arr`,
      },
    };
  }

  if (title.includes('palindrome')) {
    const isNumber = title.includes('number');
    return {
      description: isNumber
        ? 'Check whether the given number reads the same forward and backward.'
        : 'Check whether the given string reads the same forward and backward.',
      constraints: ['Handle edge cases cleanly', 'Return true/false'],
      examples: [
        { input: isNumber ? '121' : '"racecar"', output: 'true', explanation: 'Symmetric sequence' },
      ],
      test_cases: isNumber
        ? [
            { input: { n: 121 }, expected: true, hidden: false },
            { input: { n: 10 }, expected: false, hidden: false },
            { input: { n: 0 }, expected: true, hidden: true },
          ]
        : [
            { input: { s: 'racecar' }, expected: true, hidden: false },
            { input: { s: 'hello' }, expected: false, hidden: false },
            { input: { s: 'a' }, expected: true, hidden: true },
          ],
      starter_code: {
        javascript: isNumber
          ? `function solve(n) {\n  // return boolean\n  return false;\n}`
          : `function solve(s) {\n  // return boolean\n  return false;\n}`,
        typescript: isNumber
          ? `function solve(n: number): boolean {\n  // return boolean\n  return false;\n}`
          : `function solve(s: string): boolean {\n  // return boolean\n  return false;\n}`,
        python: isNumber
          ? `def solve(n):\n    # return boolean\n    return False`
          : `def solve(s):\n    # return boolean\n    return False`,
      },
    };
  }

  if (title.includes('binary search') || title.includes('search')) {
    return {
      description:
        'Find target in an array and return its index, or -1 if not found. Use binary search for sorted arrays.',
      constraints: ['Return index on success', 'Return -1 when absent'],
      examples: [{ input: 'arr=[1,3,5,7], target=5', output: '2', explanation: 'Found at index 2' }],
      test_cases: [
        { input: { arr: [1, 3, 5, 7], target: 5 }, expected: 2, hidden: false },
        { input: { arr: [1, 3, 5, 7], target: 2 }, expected: -1, hidden: false },
        { input: { arr: [9], target: 9 }, expected: 0, hidden: true },
      ],
      starter_code: {
        javascript: `function solve(arr, target) {\n  // return index or -1\n  return -1;\n}`,
        typescript: `function solve(arr: number[], target: number): number {\n  // return index or -1\n  return -1;\n}`,
        python: `def solve(arr, target):\n    # return index or -1\n    return -1`,
      },
    };
  }

  if (title.includes('fibonacci')) {
    return {
      description: 'Return the nth Fibonacci number. Optimize for time when possible.',
      constraints: ['n >= 0', 'Handle n=0 and n=1'],
      examples: [{ input: 'n=5', output: '5', explanation: 'Sequence: 0,1,1,2,3,5' }],
      test_cases: [
        { input: { n: 0 }, expected: 0, hidden: false },
        { input: { n: 1 }, expected: 1, hidden: false },
        { input: { n: 10 }, expected: 55, hidden: true },
      ],
      starter_code: {
        javascript: `function solve(n) {\n  // return nth fibonacci\n  return 0;\n}`,
        typescript: `function solve(n: number): number {\n  // return nth fibonacci\n  return 0;\n}`,
        python: `def solve(n):\n    # return nth fibonacci\n    return 0`,
      },
    };
  }

  // Generic coding fallback
  return {
    description:
      `${q.title}: solve the problem according to the prompt. Focus on correctness, clarity, and edge-case handling.`,
    constraints: ['Return the expected output format', 'Handle typical edge cases'],
    examples: [{ input: 'See test case format', output: 'Expected value', explanation: 'Match expected output' }],
    test_cases: [
      { input: { value: 1 }, expected: 1, hidden: false },
      { input: { value: 2 }, expected: 2, hidden: false },
      { input: { value: 5 }, expected: 5, hidden: true },
    ],
    starter_code: STARTER_CODE,
  };
}

function buildDescriptiveContent(q) {
  return {
    description:
      `${q.title}. Answer using a clear structure (Situation, Task, Action, Result where relevant) and include measurable impact.`,
    constraints: ['Use STAR format where applicable', 'Be concise and specific', 'Include outcomes'],
    examples: [
      {
        input: 'Describe a challenge',
        output: 'Structured response with outcome',
        explanation: 'Strong answers show context + measurable impact',
      },
    ],
    test_cases: [
      { input: { qtype: 'behavioral' }, expected: { hasSTAR: true }, hidden: false },
      { input: { qtype: 'behavioral' }, expected: { hasOutcome: true }, hidden: true },
    ],
    starter_code: {
      javascript:
        '// Write your response in STAR format:\n// Situation\n// Task\n// Action\n// Result',
      python:
        '# Write your response in STAR format:\n# Situation\n# Task\n# Action\n# Result',
      typescript:
        '// Write your response in STAR format:\n// Situation\n// Task\n// Action\n// Result',
    },
  };
}

function buildSystemDesignContent(q) {
  return {
    description:
      `${q.title}. Design a scalable system, describe core components, APIs, data model, bottlenecks, and trade-offs.`,
    constraints: [
      'Cover scalability and reliability',
      'Discuss data model and APIs',
      'Mention bottlenecks and mitigations',
    ],
    examples: [
      {
        input: 'High-level architecture request',
        output: 'Components + data flow + trade-offs',
        explanation: 'Use a layered approach and justify choices',
      },
    ],
    test_cases: [
      { input: { section: 'requirements' }, expected: { complete: true }, hidden: false },
      { input: { section: 'architecture' }, expected: { hasComponents: true }, hidden: false },
      { input: { section: 'scalability' }, expected: { hasTradeoffs: true }, hidden: true },
    ],
    starter_code: {
      javascript:
        '// Provide sections:\n// 1) Functional / Non-functional requirements\n// 2) APIs\n// 3) Data model\n// 4) Architecture\n// 5) Scaling and trade-offs',
      typescript:
        '// Provide sections:\n// 1) Functional / Non-functional requirements\n// 2) APIs\n// 3) Data model\n// 4) Architecture\n// 5) Scaling and trade-offs',
      python:
        '# Provide sections:\n# 1) Functional / Non-functional requirements\n# 2) APIs\n# 3) Data model\n# 4) Architecture\n# 5) Scaling and trade-offs',
    },
  };
}

function buildContentForQuestion(q) {
  const meta = CATEGORY_BY_ID[q.categoryId] || { slug: 'general', type: 'coding' };
  if (meta.type === 'descriptive') {
    return { type: 'descriptive', ...buildDescriptiveContent(q) };
  }
  if (meta.type === 'system-design') {
    return { type: 'system-design', ...buildSystemDesignContent(q) };
  }
  return { type: 'coding', ...buildCodingContent(q) };
}

async function run() {
  if (!fs.existsSync(SQL_FILE)) {
    throw new Error(`SQL file not found: ${SQL_FILE}`);
  }

  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  const questions = parseQuestionsFromSql(sql);
  if (!questions.length) {
    throw new Error('No questions found while parsing SQL file.');
  }

  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection('questions');

  let skippedComplete = 0;
  let updated = 0;
  let inserted = 0;

  for (const q of questions) {
    const existing = await collection.findOne({ question_id: q.id });
    if (hasCompleteContent(existing)) {
      skippedComplete++;
      continue;
    }

    const generated = buildContentForQuestion(q);
    const payload = {
      question_id: q.id,
      title: q.title,
      difficulty: q.difficulty,
      tags: q.tags,
      updated_at: new Date(),
      ...generated,
    };

    const res = await collection.updateOne(
      { question_id: q.id },
      {
        $set: payload,
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true }
    );

    if (res.upsertedCount > 0) inserted++;
    else updated++;
  }

  await client.close();
  console.log('✅ Practice content backfill complete');
  console.log(
    JSON.stringify(
      {
        totalSqlQuestions: questions.length,
        inserted,
        updated,
        skippedComplete,
      },
      null,
      2
    )
  );
}

run().catch((err) => {
  console.error('❌ Backfill failed:', err.message);
  process.exit(1);
});
