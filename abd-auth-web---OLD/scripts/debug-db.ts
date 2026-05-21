import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_AUTH_DB = process.env.MONGODB_AUTH_DB || 'ABDElevators-Auth';

async function debug() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to Industrial Database');
    
    const db = client.db(MONGODB_AUTH_DB);
    const users = await db.collection('users').find({}).toArray();

    console.log(`\n👥 USERS FOUND: ${users.length}`);
    console.log('--------------------------------------------------');
    
    users.forEach(user => {
      console.log(`- ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Tenant: ${user.tenantId}`);
      console.log('--------------------------------------------------');
    });

  } catch (error) {
    console.error('❌ Debugging Failure:', error);
  } finally {
    await client.close();
  }
}

debug();
