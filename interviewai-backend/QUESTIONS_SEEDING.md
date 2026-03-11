# Questions Seeding (Single Source of Truth)

This repo now supports a single canonical questions file:

- `interviewai-backend/data/questions.master.json`

Use it to add or update questions across all topics safely.

## Files

- `data/questions.master.json` -> canonical question data
- `scripts/seed-mongo-questions.js` -> upserts Mongo `questions`
- `scripts/generate-mysql-questions.js` -> generates SQL for MySQL `questions`

## Workflow

1) Add or update questions in `data/questions.master.json`.

2) Upsert into MongoDB:

```powershell
node interviewai-backend/scripts/seed-mongo-questions.js
```

3) Generate MySQL inserts:

```powershell
node interviewai-backend/scripts/generate-mysql-questions.js
```

This creates:

- `interviewai-backend/data/mysql-questions.generated.sql`

Apply the SQL with your MySQL client.

## Notes

- Mongo hints are capped to 3 (`hints` array).
- If a question has both `mysql` and `mongodb` blocks, both are used.
- If `mysql.id` is missing, `mongodb.question_id` is used.
