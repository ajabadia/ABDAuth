import { MongoClient } from 'mongodb';
import fs from 'fs';

try {
  const env = fs.readFileSync('.env.local', 'utf8');
  env.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
} catch (e) {
  console.warn('⚠️ Could not load .env.local');
}

async function checkSatellites() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not found');

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('ABDElevators-Auth');
    const apps = await db.collection('applications').find({}).toArray();

    console.log('--- 🛰️ Registered Satellites ---');
    apps.forEach(app => {
      console.log(`- Name: ${app.name}`);
      console.log(`  Client ID: ${app.clientId}`);
      console.log(`  Redirect URIs:`, app.redirectUris);
      console.log(`  Active: ${app.active}`);
    });
  } finally {
    await client.close();
  }
}

checkSatellites().catch(console.error);
