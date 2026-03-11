const { MongoClient } = require('mongodb');

async function main() {
  const uri = 'mongodb://root:rootpassword@localhost:27017/interviewai?authSource=admin';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('interviewai');
  const q = await db.collection('questions').findOne({ title: 'Two Sum Problem' });
  if (!q) {
    console.log('question not found');
    process.exit(1);
  }
  console.log('before count', q.test_cases.length);
  const extras = [];
  for (let size of [1000, 5000, 10000]) {
    const arr = Array.from({length: size}, () => Math.floor(Math.random()*1e6));
    const [i,j] = [Math.floor(Math.random()*size), Math.floor(Math.random()*size)];
    const target = arr[i] + arr[j];
    extras.push({ input: `nums=${JSON.stringify(arr)}, target=${target}`, expected: `[${i},${j}]`, hidden: true });
  }
  extras.push({ input: 'nums=[100000,200000], target=300000', expected: '[0,1]', hidden: true });
  const r = await db.collection('questions').updateOne({ title: 'Two Sum Problem' }, { $push: { test_cases: { $each: extras } } });
  console.log('modified count', r.modifiedCount);
  const q2 = await db.collection('questions').findOne({ title: 'Two Sum Problem' });
  console.log('after count', q2.test_cases.length);
  console.log('last cases', q2.test_cases.slice(-5));
  await client.close();
}

main().catch(console.error);
