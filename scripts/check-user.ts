import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import fs from 'fs';

// 🏗️ Industrial Native Env Loading (Node 22+)
try {
  // @ts-ignore - native in Node 22
  if (process.loadEnvFile) {
    // @ts-ignore
    process.loadEnvFile('.env.local');
  } else {
    // Fallback for older node if needed
    const env = fs.readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) process.env[key.trim()] = value.trim();
    });
  }
} catch (e) {
  console.warn('⚠️ Could not load .env.local natively, assuming env is already set');
}

async function checkUser() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not found');

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('ABDElevators-Auth');
    const user = await db.collection('users').findOne({ email: 'ajabadia@gmail.com' });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('🔐 MFA Enabled:', user.mfaEnabled);
    
    const isMatch = await bcrypt.compare('11111111', user.password);
    console.log('🔑 Password "11111111" match:', isMatch);
    
    if (!isMatch) {
      const newHash = await bcrypt.hash('11111111', 10);
      console.log('⚠️ Password mismatch! Suggested fix: update hash to', newHash);
    }
  } finally {
    await client.close();
  }
}

checkUser().catch(console.error);
