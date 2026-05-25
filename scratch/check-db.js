const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/?retryWrites=true&w=majority";
const dbName = "ABDElevators-Auth";

async function main() {
  console.log('Connecting to database...');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected successfully.');
    const db = client.db(dbName);
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    for (const colName of ['applications', 'Applications']) {
      if (collections.some(c => c.name === colName)) {
        console.log(`\n--- Inspecting collection: ${colName} ---`);
        const col = db.collection(colName);
        const apps = await col.find({}).toArray();
        for (const app of apps) {
          console.log({
            _id: app._id,
            name: app.name,
            clientId: app.clientId,
            redirectUris: app.redirectUris,
            active: app.active
          });
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

main();
