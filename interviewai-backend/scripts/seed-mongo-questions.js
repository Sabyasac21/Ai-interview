const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://root:rootpassword@localhost:27017/interviewai?authSource=admin';
const INPUT_PATH = path.resolve(__dirname, '..', 'data', 'questions.master.json');

function normalizeQuestion(q) {
  const mongo = q.mongodb || {};
  const mysql = q.mysql || {};

  if (!mongo.question_id && mysql.id) mongo.question_id = mysql.id;
  if (!mongo.title && mysql.title) mongo.title = mysql.title;

  if (Array.isArray(mongo.hints)) {
    mongo.hints = mongo.hints.slice(0, 3);
  }

  return { mysql, mongodb: mongo };
}

async function seedMongo() {
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

  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db('interviewai');
  const collection = db.collection('questions');

  let upserts = 0;

  for (const entry of questions) {
    const { mongodb } = normalizeQuestion(entry);
    if (!mongodb.question_id) {
      console.log('Skipping entry without mongodb.question_id');
      continue;
    }

    await collection.updateOne(
      { question_id: mongodb.question_id },
      { $set: mongodb },
      { upsert: true }
    );
    upserts += 1;
  }

  await client.close();
  console.log(`? Mongo upsert complete. Records processed: ${upserts}`);
}

seedMongo().catch((err) => {
  console.error('? Seed failed:', err.message);
  process.exit(1);
});
