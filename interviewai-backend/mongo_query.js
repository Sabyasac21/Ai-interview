const {MongoClient} = require('mongodb');
(async()=>{
  const client = new MongoClient('mongodb://root:rootpassword@localhost:27017/interviewai?authSource=admin');
  try {
    await client.connect();
    const db = client.db();
    const q = await db.collection('questions').findOne({title:'Two Sum Problem'});
    console.log('mongo test_cases count:', q.test_cases.length);
    console.log('test_cases:', JSON.stringify(q.test_cases, null, 2));
  } catch(e){
    console.error(e);
  } finally {
    await client.close();
  }
})();