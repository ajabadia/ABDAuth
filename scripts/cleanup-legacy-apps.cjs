const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/ABDElevators-Auth";
const client = new MongoClient(uri);

// Legacy clientIds to REMOVE (old naming convention)
const legacyClientIds = [
  'abdquiz-industrial-client-id',
  'abdgov-industrial-client-id', 
  'abdlogs-industrial-client-id',
  'abdanalytics-industrial-client-id',
  'base'
];

// Current valid clientIds to KEEP
const validClientIds = [
  'landing',
  'auth',
  'analytics',
  'logs',
  'quiz',
  'files',
  'gobernanza'
];

async function cleanupLegacy() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('ABDElevators-Auth');
    const collection = db.collection('applications');
    
    // Show current state
    const before = await collection.find({}).toArray();
    console.log(`\nBefore cleanup: ${before.length} applications`);
    before.forEach(app => console.log(`  - ${app.name} (${app.clientId})`));
    
    // Delete legacy entries
    console.log('\nDeleting legacy applications...');
    for (const clientId of legacyClientIds) {
      const result = await collection.deleteOne({ clientId });
      if (result.deletedCount > 0) {
        console.log(`  ✓ Deleted: ${clientId}`);
      } else {
        console.log(`  - Not found: ${clientId}`);
      }
    }
    
    // Verify final state
    const after = await collection.find({}).toArray();
    console.log(`\nAfter cleanup: ${after.length} applications`);
    after.forEach(app => console.log(`  - ${app.name} (${app.clientId})`));
    
    // Verify all valid ones exist
    console.log('\nVerifying valid clientIds...');
    for (const clientId of validClientIds) {
      const app = await collection.findOne({ clientId });
      if (app) {
        console.log(`  ✓ ${clientId} - OK (${app.redirectUris.length} redirect URIs)`);
      } else {
        console.log(`  ✗ ${clientId} - MISSING!`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

cleanupLegacy();