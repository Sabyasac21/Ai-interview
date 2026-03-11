// Backfill hints for existing questions in MongoDB
const uri = 'mongodb://root:rootpassword@localhost:27017/interviewai?authSource=admin';
const MongoClient = require('mongodb').MongoClient;

const HINTS_BY_ID = {
  'react-1': [
    'Use the useState hook to store the count value.',
    'Create two buttons and update state in their onClick handlers.',
    'Render the current count inside a <p> or <span>.',
  ],
  'react-2': [
    'Side effects include data fetching and subscriptions.',
    'This hook runs after render by default.',
    'It replaces most uses of componentDidMount/DidUpdate.',
  ],
  'js-1': [
    'Iterate through the array and keep numbers > 5.',
    'You can use Array.prototype.filter in JavaScript.',
    'Return a new array; do not mutate the original.',
  ],
  'dsa-1': [
    'A hash map can store value -> index as you scan.',
    'For each number, check if target - number has been seen.',
    'Return indices immediately when a match is found.',
  ],
  'dsa-10': [
    'Use two nested loops to compare adjacent elements.',
    'Swap elements when the left is greater than the right.',
    'After each outer pass, the largest element is in place.',
  ],
  'dsa-11': [
    'Find the minimum element in the unsorted part.',
    'Swap it with the first unsorted position.',
    'Move the boundary and repeat.',
  ],
};

async function updateHints() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('interviewai');
    const collection = db.collection('questions');

    for (const [question_id, hints] of Object.entries(HINTS_BY_ID)) {
      const result = await collection.updateOne(
        { question_id },
        { $set: { hints } }
      );
      if (result.matchedCount === 0) {
        console.log(`ℹ️  ${question_id}: not found, skipping`);
      } else {
        console.log(`✅ ${question_id}: hints updated`);
      }
    }

    console.log('✅ Hint backfill complete');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
  }
}

updateHints();
