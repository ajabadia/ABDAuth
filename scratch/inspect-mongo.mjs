/**
 * 🔍 Inspect MongoDB Structure
 * Checks what databases, collections, and tenants exist.
 */
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/";

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('✅ Connected\n');

    // List all databases
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    console.log('📚 Databases:');
    for (const db of databases) {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(1)} MB)`);
    }

    // Check ABDElevators-Auth
    console.log('\n🔐 Auth DB (ABDElevators-Auth):');
    const authDb = client.db('ABDElevators-Auth');
    const authCollections = await authDb.listCollections().toArray();
    console.log('   Collections:', authCollections.map(c => c.name).join(', '));
    
    // Check users
    const usersCount = await authDb.collection('users').countDocuments();
    console.log('   Users:', usersCount);
    
    // Check tenants
    const tenantsCol = authDb.collection('tenants');
    const tenants = await tenantsCol.find({}).toArray();
    console.log('   Tenants:', tenants.length);
    for (const t of tenants) {
      console.log(`     - ${t.name} (${t.tenantId}, dbPrefix: ${t.dbPrefix}, isolation: ${t.isolationStrategy})`);
    }

    // Check if there's a user with PROFESSOR role
    const professorUsers = await authDb.collection('users').find({ role: 'PROFESSOR' }).toArray();
    console.log('\n👤 PROFESSOR users:', professorUsers.length);
    for (const u of professorUsers) {
      console.log(`   - ${u.email} (${u._id}, tenant: ${u.tenantId})`);
    }

    // Check for abdelevators_* collections in relevant databases
    console.log('\n🔎 Searching for quizuserroles collections:');
    for (const dbInfo of databases) {
      const db = client.db(dbInfo.name);
      const cols = await db.listCollections().toArray();
      const quizCols = cols.filter(c => c.name.toLowerCase().includes('quizuserrole') || c.name.toLowerCase().includes('quiz'));
      if (quizCols.length > 0) {
        console.log(`   DB: ${dbInfo.name}`);
        for (const c of quizCols) {
          const count = await db.collection(c.name).countDocuments();
          console.log(`     - ${c.name} (${count} docs)`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Done');
  }
}

run();
