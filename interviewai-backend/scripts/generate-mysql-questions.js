const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.resolve(__dirname, '..', 'data', 'questions.master.json');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'data', 'mysql-questions.generated.sql');

const escapeSql = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  const str = String(value).replace(/'/g, "''");
  return `'${str}'`;
};

function normalizeTags(tags) {
  if (!tags) return '[]';
  if (Array.isArray(tags)) return JSON.stringify(tags);
  return JSON.stringify(String(tags).split(',').map(t => t.trim()).filter(Boolean));
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`questions.master.json not found at ${INPUT_PATH}`);
  }

  const raw = fs.readFileSync(INPUT_PATH, 'utf-8');
  const payload = JSON.parse(raw);
  const questions = Array.isArray(payload) ? payload : payload.questions || [];

  if (!questions.length) {
    console.log('No questions found in questions.master.json');
    return;
  }

  const lines = [];
  lines.push('-- Auto-generated from questions.master.json');
  lines.push('-- Apply with your MySQL client');
  lines.push('');

  for (const entry of questions) {
    const mysql = entry.mysql || {};
    const mongodb = entry.mongodb || {};
    const id = mysql.id || mongodb.question_id;
    const title = mysql.title || mongodb.title;
    const categoryId = mysql.category_id;
    const difficulty = mysql.difficulty || 'medium';
    const tags = mysql.tags || mongodb.tags || [];
    const isActive = mysql.is_active !== undefined ? (mysql.is_active ? 1 : 0) : 1;

    if (!id || !categoryId || !title) {
      continue;
    }

    lines.push(
      `INSERT INTO questions (id, category_id, title, difficulty, tags, is_active) VALUES (` +
        `${escapeSql(id)}, ${escapeSql(categoryId)}, ${escapeSql(title)}, ${escapeSql(difficulty)}, ${escapeSql(normalizeTags(tags))}, ${escapeSql(isActive)}` +
      `) ON DUPLICATE KEY UPDATE title=VALUES(title), difficulty=VALUES(difficulty), tags=VALUES(tags), is_active=VALUES(is_active);`
    );
  }

  fs.writeFileSync(OUTPUT_PATH, lines.join('\n'));
  console.log(`? SQL generated at ${OUTPUT_PATH}`);
}

try {
  main();
} catch (err) {
  console.error('? Failed to generate SQL:', err.message);
  process.exit(1);
}
