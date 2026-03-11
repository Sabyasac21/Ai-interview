# Adding Real Questions Data

## Overview

Your system has **two databases**:
- **MySQL**: Stores question metadata (title, difficulty, tags, category)
- **MongoDB**: Stores question details (description, examples, test cases, solution code)

---

## Method 1: Automatic Data Seeding (Docker)

When you run `docker-compose up`, the initialization scripts automatically populate both databases:

```bash
cd interviewai-backend
docker-compose up -d
```

This runs:
1. `docker/mysql-init.sql` → Creates tables and inserts sample questions
2. `docker/mongo-init.js` → Inserts detailed question content

---

## Method 2: Manual Data Entry (After Docker is Running)

### Add Questions to MySQL

Connect to MySQL:
```bash
docker exec -it interviewai_mysql mysql -u root -p
# Password: rootpassword
```

Then use:
```sql
USE interviewai;

INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES
(
  'your-question-id',
  1,  -- category_id: 1=React, 2=JavaScript, 3=System Design, 4=Data Structures, 5=Algorithms, 6=Behavioral
  'Your Question Title',
  'easy',  -- easy, medium, hard
  JSON_ARRAY('tag1', 'tag2', 'tag3'),
  TRUE
);

-- Verify insertion
SELECT * FROM questions WHERE id = 'your-question-id';
```

---

### Add Question Details to MongoDB

Connect to MongoDB:
```bash
docker exec -it interviewai_mongo mongosh -u root -p
# Password: rootpassword
```

Then use:
```javascript
use interviewai;

db.questions.insertOne({
  question_id: 'your-question-id',  // Must match the MySQL question ID
  title: 'Your Question Title',
  type: 'coding',  // coding, mcq, descriptive, system-design
  description: 'Detailed problem description',
  examples: [
    {
      input: 'Example input',
      output: 'Expected output',
      explanation: 'Why this is the expected output'
    }
  ],
  constraints: ['Constraint 1', 'Constraint 2'],
  starter_code: {
    javascript: 'function solution() { }',
    python: 'def solution(): pass',
    typescript: 'const solution = () => {};'
  },
  test_cases: [
    { input: 'test input', expected: 'expected output', hidden: false },
    { input: 'test input 2', expected: 'expected output 2', hidden: true }
  ],
  solution: 'Complete solution code',
  solution_explanation: 'Explanation of the solution',
  created_at: new Date(),
  updated_at: new Date()
});

// Verify insertion
db.questions.findOne({ question_id: 'your-question-id' });
```

---

## Method 3: Bulk Insert with Python Script

Use the provided `bulk-insert.py` script:

```bash
cd interviewai-backend
python bulk-insert.py
```

This script reads from `questions-data.json` and inserts into both databases.

---

## Method 4: Using the API (During Runtime)

If you want to add questions through the API (recommended for production):

```bash
# First, get an auth token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'

# Add a question (requires admin role)
curl -X POST http://localhost:8000/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "category_id": 1,
    "title": "Your Question",
    "difficulty": "easy",
    "tags": ["tag1", "tag2"],
    "description": "...",
    "examples": [...],
    "test_cases": [...]
  }'
```

---

## Category IDs Reference

| ID | Category |
|----|----------|
| 1  | React.js |
| 2  | JavaScript |
| 3  | System Design |
| 4  | Data Structures |
| 5  | Algorithms |
| 6  | Behavioral |

---

## Sample Question Structure

### Coding Question Example
```javascript
{
  question_id: 'array-sum-1',
  title: 'Array Sum Calculation',
  type: 'coding',
  description: 'Write a function that calculates the sum of all elements in an array.',
  examples: [
    {
      input: '[1, 2, 3, 4]',
      output: '10',
      explanation: '1+2+3+4 = 10'
    }
  ],
  constraints: [
    'Array length: 1 to 10000',
    'Elements: -1000 to 1000'
  ],
  starter_code: {
    javascript: 'function arraySum(arr) { }',
    python: 'def array_sum(arr): pass'
  },
  test_cases: [
    { input: '[1,2,3]', expected: '6', hidden: false },
    { input: '[-1,0,1]', expected: '0', hidden: false },
    { input: '[100,200,300]', expected: '600', hidden: true }
  ],
  solution: 'return arr.reduce((sum, n) => sum + n, 0);',
  solution_explanation: 'Use reduce() to accumulate the sum of array elements.'
}
```

### MCQ Question Example
```javascript
{
  question_id: 'react-hooks-1',
  title: 'React Hooks - useState',
  type: 'mcq',
  description: 'What does useState return?',
  options: [
    'An object with state values',
    'An array with [state, setState]',
    'A function that updates state',
    'A boolean indicating state change'
  ],
  correct_answer: 1,
  explanation: 'useState returns an array with the current state and a function to update it.'
}
```

---

## Quick Commands

List all questions:
```bash
docker exec -it interviewai_mysql mysql -u root -p -e "USE interviewai; SELECT id, title, difficulty FROM questions LIMIT 10;"
```

Count questions by category:
```bash
docker exec -it interviewai_mysql mysql -u root -p -e "USE interviewai; SELECT c.name, COUNT(q.id) as count FROM questions q JOIN skill_categories c ON q.category_id = c.id GROUP BY c.id;"
```

View MongoDB questions:
```bash
docker exec -it interviewai_mongo mongosh -u root -p --eval "db.getSiblingDB('interviewai').questions.find().pretty()"
```

---

## Troubleshooting

**Questions not appearing in app?**
- Check MySQL: `SELECT * FROM questions;`
- Check MongoDB: `db.questions.find();`
- Ensure question_id matches between MySQL and MongoDB
- Verify category_id exists in skill_categories

**Docker containers not starting?**
```bash
docker-compose logs mysql
docker-compose logs mongodb
```

**Need to reset database?**
```bash
docker-compose down -v  # Remove volume data
docker-compose up -d    # Restart with fresh data
```
