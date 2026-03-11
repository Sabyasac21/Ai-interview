# API Integration Guide - Real Questions from Backend

## Overview

Your frontend now fetches real questions from the backend API. This is the most scalable approach as it:
- ✅ Dynamically loads questions from the database
- ✅ Supports unlimited questions without code changes  
- ✅ Works with both MySQL and MongoDB
- ✅ Handles loading/error states gracefully
- ✅ Automatically syncs question data  

---

## Architecture

```
┌─────────────────────┐
│  Frontend (React)   │
│ ┌─────────────────┐ │
│ │  QuestionsListPage (fetches questions)  │
│ │  PracticeSessionPage (fetches details)  │
│ │  App (fetches categories)               │
│ └─────────────────┘ │
└──────────┬──────────┘
           │ API Calls
           ▼
┌─────────────────────┐
│  API Gateway        │
│  (:8000/api/...)    │
└──────────┬──────────┘
           │
  ┌────────▼────────┐
  │ Practice Service│
  │   (:8002)       │
  └────────┬────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
 MySQL         MongoDB
```

---

## API Endpoints Used

### 1. **Fetch Categories**
```
GET /api/categories
Headers: Authorization: Bearer {token}

# `total_questions` is calculated on‑the‑fly by counting active
# questions in the database; it no longer relies solely on a static
# value seeded during initialization.  Similarly, `questions_solved`
# is derived from the user's practice sessions so the frontend and the
# `/categories/{id}/solved` endpoint always agree.

Response:
[
  {
    "id": 1,
    "name": "React.js",
    "slug": "reactjs",
    "total_questions": 50,
    "questions_solved": 5,
    "score_percentage": 60,
    "is_locked": false
  }
]
```

### 2. **Fetch Questions by Category**
```
GET /api/categories/{category_id}/questions?difficulty=easy
Headers: Authorization: Bearer {token}

Response:
[
  {
    "id": "react-1",
    "title": "Create a Counter Component",
    "difficulty": "easy",
    "tags": ["useState", "Hooks"]
  }
]
```

### 3. **Fetch Question Details**
```
GET /api/questions/{question_id}
Headers: Authorization: Bearer {token}

Response:
{
  "id": "react-1",
  "title": "Create a Counter Component",
  "difficulty": "easy",
  "type": "coding",
  "description": "...",
  "examples": [...],
  "starter_code": {...},
  "test_cases": [...],
  "constraints": [...]
}
```

### 4. **Start Practice Session**
```
POST /api/sessions/start
Headers: Authorization: Bearer {token}
Body: { "question_id": "react-1" }

Response:
{
  "session_id": "uuid",
  "started_at": "2026-02-26T10:30:00Z"
}
```

### 5. **Submit Answer**
```
POST /api/sessions/submit
Headers: Authorization: Bearer {token}
Body: {
  "session_id": "uuid",
  "code": "const x = 5;",
  "language": "javascript",
  "time_spent": 300
}
```

---

## Updated Components

### **App.tsx**
Now fetches categories from API and falls back to mock data:
```tsx
const loadCategories = async () => {
  if (!token) return;
  
  const data = await fetchCategories(token);
  const mapped = data.map(c => ({
    id: c.slug,
    title: c.name,
    totalQuestions: c.total_questions,
    completedQuestions: c.questions_solved,
    strength: c.score_percentage,
    status: c.is_locked ? 'locked' : 'unlocked',
  }));
  setTopics(mapped);
};
```

### **QuestionsListPage.tsx**
Fetches questions for selected category:
```tsx
useEffect(() => {
  const loadQuestions = async () => {
    const questions = await fetchQuestionsByCategory(topic, token);
    setTopicQuestions(questions);
  };
  loadQuestions();
}, [topic, token]);
```

### **PracticeSessionPage.tsx**
Fetches detailed question content:
```tsx
useEffect(() => {
  const loadQuestion = async () => {
    const question = await fetchQuestionDetail(questionId, token);
    setQuestion(question);
    
    const session = await startPracticeSession(questionId, token);
    setSessionId(session.session_id);
  };
  loadQuestion();
}, [questionId, token]);
```

---

## API Service File

Created: `src/api/questions.ts`

Contains functions:
- `fetchCategories()` - Get all skill categories
- `fetchQuestionsByCategory()` - Get questions for a topic
- `fetchQuestionDetail()` - Get full question details
- `startPracticeSession()` - Start a new practice session
- `submitAnswer()` - Submit code/answer for evaluation
- `fetchPracticeHistory()` - Get user's practice history

---

## Step-by-Step Setup

### 1. **Ensure Backend is Running**
```bash
cd interviewai-backend
docker-compose up -d
```

Verify services:
```bash
curl http://localhost:8000/api/health
```

### 2. **Verify API Responses**
```bash
# Get auth token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Fetch categories with token
curl http://localhost:8000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. **Start Frontend**
```bash
cd "Gamified AI Interview Dashboard"
npm install
npm run dev
```

### 4. **Test the Flow**
1. Register/Login in frontend
2. Navigate to Practice section
3. Click on topic (React, JavaScript, etc.)
4. Questions load from API ✅
5. Click a question to practice
6. Question details load from MongoDB ✅
7. Submit code/answer (sent to backend) ✅

---

## Error Handling

The components include error handling:

```tsx
{loading ? (
  <Loader animate /> // Shows loading spinner
) : error ? (
  <ErrorMessage retry /> // Shows error with retry button
) : (
  <QuestionsList /> // Shows data
)}
```

---

## Data Flow Diagram

```
User clicks "Practice"
    ↓
App fetches /api/categories
    ↓
Categories display (React, JS, etc)
    ↓
User clicks "React.js"
    ↓
QuestionsListPage fetches /api/categories/1/questions
    ↓
Questions list displays
    ↓
User clicks "Question 1"
    ↓
PracticeSessionPage fetches /api/questions/react-1
    ↓
Question details display (description, examples, starter code)
    ↓
User runs code → /api/sessions/submit
    ↓
Get results
    ↓
Display pass/fail with XP earned
```

---

## Troubleshooting

### Questions not appearing?
```bash
# Check MySQL questions
docker exec interviewai_mysql mysql -u root -proot rootpassword \
  -e "SELECT COUNT(*) FROM interviewai.questions;"

# Check MongoDB questions
docker exec interviewai_mongo mongosh -u root -p rootpassword \
  --eval "db.getSiblingDB('interviewai').questions.countDocuments()"
```

### API returns 401 Unauthorized?
- Ensure token is sent in Authorization header
- Token format: `Authorization: Bearer {token}`
- Verify user is authenticated

### Questions load but details are blank?
- MongoDB may not have question details
- Run the `mongo-init.js` script to seed data
- Or use the `bulk-insert.py` script to add questions

### Slow API responses?
- Check if MySQL/MongoDB containers are healthy
- Add database indexes on question_id, category_id
- Monitor container logs: `docker-compose logs -f`

---

## Performance Tips

1. **Cache Questions**: (Optional) Implement caching to reduce API calls
2. **Pagination**: Add pagination for large question lists
3. **Lazy Loading**: Load question details only when clicked
4. **Database Indexes**: Ensure indexes exist on frequently queried fields

---

## Next Steps

1. ✅ API endpoints working
2. ✅ Frontend fetching real data
3. ⏭️ **Next**: Implement code evaluation backend
4. ⏭️ **Next**: Add user progress tracking
5. ⏭️ **Next**: Implement achievements system

---

## File Summary

| File | Purpose |
|------|---------|
| `src/api/questions.ts` | API service functions |
| `src/api/config.js` | API configuration |
| `src/app/App.tsx` | Fetches categories |
| `src/app/pages/QuestionsListPage.tsx` | Fetches questions |
| `src/app/pages/PracticeSessionPage.tsx` | Fetches question details |
| `src/app/data/mockTopics.ts` | Fallback mock data |
| `interviewai-backend/docker/mysql-init.sql` | MySQL sample data |
| `interviewai-backend/docker/mongo-init.js` | MongoDB sample data |
