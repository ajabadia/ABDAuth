const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/?retryWrites=true&w=majority";
const dbName = "ABDElevators-Auth";
const clientId = "abdquiz-industrial-client-id";

const correctRedirectUris = [
  'http://localhost:5020/api/auth/federated/callback',
  'http://localhost:5020',
  'https://quiz.abd.vercel.app/api/auth/federated/callback',
  'https://abd-quiz.vercel.app/api/auth/federated/callback',
  'https://abd-quiz.vercel.app'
];

async function main() {
  console.log('Connecting to database...');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected successfully.');
    const db = client.db(dbName);

    const collections = ['applications', 'Applications'];

    for (const colName of collections) {
      console.log(`\nUpdating collection: ${colName}...`);
      const col = db.collection(colName);
      
      const app = await col.findOne({ clientId });
      if (app) {
        console.log(`Found application: "${app.name}". Current redirectUris:`, app.redirectUris);
        const result = await col.updateOne(
          { _id: app._id },
          { $set: { redirectUris: correctRedirectUris } }
        );
        console.log(`Update result:`, result);
        
        const updatedApp = await col.findOne({ _id: app._id });
        console.log(`Updated redirectUris:`, updatedApp.redirectUris);
      } else {
        console.log(`Application with clientId "${clientId}" not found in ${colName}.`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

main();
