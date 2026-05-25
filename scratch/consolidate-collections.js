const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/?retryWrites=true&w=majority";
const dbName = "ABDElevators-Auth";

async function main() {
  console.log('Connecting to database...');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected successfully.\n');
    const db = client.db(dbName);

    // 1. Verify 'applications' (lowercase) contains the 3 clients
    const colLower = db.collection('applications');
    const appsLower = await colLower.find({}).toArray();
    console.log(`🔍 Checking 'applications' collection (lowercase):`);
    console.log(`Found ${appsLower.length} documents.`);
    
    const requiredClients = [
      'abdquiz-industrial-client-id',
      'abdgov-industrial-client-id',
      'abdlogs-industrial-client-id'
    ];
    
    const missing = requiredClients.filter(
      id => !appsLower.some(app => app.clientId === id)
    );

    if (missing.length > 0) {
      console.error(`❌ Error: 'applications' collection is missing required clients:`, missing);
      console.log('Aborting consolidation to prevent data loss!');
      return;
    }

    console.log('✅ All 3 client definitions are present in the lowercase "applications" collection.');

    // 2. Drop the 'Applications' (uppercase) collection
    console.log('\n🧹 Dropping "Applications" collection (uppercase)...');
    try {
      const colUpper = db.collection('Applications');
      const dropResult = await colUpper.drop();
      console.log('✅ Collection "Applications" dropped successfully:', dropResult);
    } catch (err) {
      console.error('⚠️ Could not drop "Applications" collection (maybe it does not exist?):', err.message);
    }

    // 3. Print final collections list
    const collections = await db.listCollections().toArray();
    const colNames = collections.map(c => c.name);
    console.log('\n📋 Final collections in database:', colNames);

  } catch (error) {
    console.error('Error during consolidation:', error);
  } finally {
    await client.close();
  }
}

main();
