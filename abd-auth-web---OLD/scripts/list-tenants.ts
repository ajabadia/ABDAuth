import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_AUTH_DB = process.env.MONGODB_AUTH_DB || 'ABD-Auth';

async function listTenants() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found');
    return;
  }
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(MONGODB_AUTH_DB);
    const tenants = await db.collection('tenants').find({}).toArray();
    console.log(JSON.stringify(tenants, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

listTenants();
