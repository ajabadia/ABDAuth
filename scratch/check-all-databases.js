const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/?retryWrites=true&w=majority";
const databases = ['ABDElevators-Auth', 'ABD-Auth', 'test'];
const collections = ['applications', 'Applications'];

async function main() {
  console.log('Connecting to database...');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected successfully.\n');

    for (const dbName of databases) {
      console.log(`=========================================`);
      console.log(`📂 Database: ${dbName}`);
      console.log(`=========================================`);
      const db = client.db(dbName);
      
      const dbCollections = await db.listCollections().toArray();
      const colNames = dbCollections.map(c => c.name);
      console.log('Collections present:', colNames);
      
      for (const colName of collections) {
        if (colNames.includes(colName)) {
          console.log(`\n  --- Collection: ${colName} ---`);
          const col = db.collection(colName);
          const apps = await col.find({}).toArray();
          for (const app of apps) {
            console.log({
              clientId: app.clientId,
              name: app.name,
              redirectUris: app.redirectUris,
              active: app.active
            });
          }
        }
      }
      console.log('\n');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

main();
