const fs = require('fs');
const path = require('path');

const masterPath = path.resolve(__dirname, '..', 'data', 'questions.master.json');
const incomingPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '..', 'data', 'questions.incoming.json');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));

const ensureArray = (payload) => (Array.isArray(payload) ? payload : payload.questions || []);

const mergeDeep = (base, patch) => {
  if (!patch) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (!out[key] || (Array.isArray(out[key]) && out[key].length === 0)) {
        out[key] = value;
      }
    } else if (typeof value === 'object') {
      out[key] = mergeDeep(out[key] || {}, value);
    } else {
      if (out[key] === undefined || out[key] === null || out[key] === '') {
        out[key] = value;
      }
    }
  }
  return out;
};

const normalize = (entry) => {
  const mysql = entry.mysql || {};
  const mongodb = entry.mongodb || {};
  if (!mongodb.question_id && mysql.id) mongodb.question_id = mysql.id;
  if (!mongodb.title && mysql.title) mongodb.title = mysql.title;
  if (Array.isArray(mongodb.hints)) mongodb.hints = mongodb.hints.slice(0, 3);
  return { mysql, mongodb };
};

if (!fs.existsSync(masterPath)) throw new Error(`Missing master file: ${masterPath}`);
if (!fs.existsSync(incomingPath)) throw new Error(`Missing incoming file: ${incomingPath}`);

const masterPayload = readJson(masterPath);
const incomingPayload = readJson(incomingPath);

const masterQuestions = ensureArray(masterPayload).map(normalize);
const incomingQuestions = ensureArray(incomingPayload).map(normalize);

const byId = new Map();
for (const q of masterQuestions) {
  if (q.mongodb?.question_id) byId.set(q.mongodb.question_id, q);
}

let added = 0;
let merged = 0;

for (const incoming of incomingQuestions) {
  const qid = incoming.mongodb?.question_id;
  if (!qid) continue;
  const existing = byId.get(qid);
  if (!existing) {
    byId.set(qid, incoming);
    added += 1;
    continue;
  }

  const mergedMysql = mergeDeep(existing.mysql || {}, incoming.mysql || {});
  const mergedMongo = mergeDeep(existing.mongodb || {}, incoming.mongodb || {});
  if (Array.isArray(mergedMongo.hints)) mergedMongo.hints = mergedMongo.hints.slice(0, 3);

  byId.set(qid, { mysql: mergedMysql, mongodb: mergedMongo });
  merged += 1;
}

const mergedQuestions = Array.from(byId.values()).sort((a, b) => {
  const aid = a.mongodb?.question_id || '';
  const bid = b.mongodb?.question_id || '';
  return aid.localeCompare(bid, undefined, { numeric: true });
});

const output = { questions: mergedQuestions };
fs.writeFileSync(masterPath, JSON.stringify(output, null, 2));
console.log(`? Merge complete. Added: ${added}, merged: ${merged}, total: ${mergedQuestions.length}`);
