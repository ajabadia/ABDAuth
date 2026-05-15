import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

async function check() {
  // 🔍 Manual .env.local parsing
  let uri = '';
  try {
    const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
    const match = envContent.match(/MONGODB_URI=["']?(.+?)["']?(\s|$)/);
    if (match) uri = match[1];
  } catch (e) {
    console.error('⚠️ Could not read .env.local');
  }

  if (!uri) {
    console.error('❌ MONGODB_URI not found');
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const dbName = 'ABDElevators-Auth';
    const db = client.db(dbName);
    
    const users = await db.collection('users').find({}).toArray();
    console.log(`\n--- USERS IN ${dbName} ---`);
    if (users.length === 0) {
      console.log('⚠️ No users found in this database!');
    } else {
      users.forEach(u => {
        console.log(`- Email: ${u.email} | ID: ${u._id} | Role: ${u.role} | Tenant: ${u.tenantId}`);
      });
    }

    const apps = await db.collection('Applications').find({}).toArray();
    console.log(`\n--- APPLICATIONS IN ${dbName} ---`);
    apps.forEach(a => {
      console.log(`- Name: ${a.name} | ClientID: ${a.clientId} | Active: ${a.active}`);
    });

    const codes = await db.collection('FederatedCodes').find({}).sort({ expiresAt: -1 }).limit(5).toArray();
    console.log(`\n--- LAST 5 FEDERATED CODES IN ${dbName} ---`);
    if (codes.length === 0) {
      console.log('⚠️ No codes found.');
    } else {
      codes.forEach(c => {
        console.log(`- Code: ${c.code.substring(0, 8)}... | UserID: ${c.userId} | Used: ${c.used} | Expires: ${c.expiresAt}`);
      });
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
  }
}

check();
