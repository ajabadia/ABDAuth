// Fix app slugs + populate tenant allowedApps
import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0) {
    env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
}

const MONGODB_URI = env.MONGODB_URI;
const MONGODB_AUTH_DB = env.MONGODB_AUTH_DB || 'ABD-Auth';

// Slug mapping based on app names
const SLUG_MAP = {
  'ABDQuiz Federated': 'quiz',
  'ABDTenantGobernance Federated': 'gobernanza',
  'ABDLogs Federated': 'logs',
  'ABDAnalytics Federated': 'analytics',
};

async function main() {
  if (!MONGODB_URI) { console.error('MONGODB_URI not found'); return; }

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(MONGODB_AUTH_DB);

    // Step 1: Fix application slugs
    console.log('\n🔧 Step 1: Fixing application slugs...');
    const apps = await db.collection('applications').find({}).toArray();
    
    for (const app of apps) {
      const slug = SLUG_MAP[app.name];
      if (slug && !app.slug) {
        await db.collection('applications').updateOne(
          { _id: app._id },
          { $set: { slug, updatedAt: new Date() } }
        );
        console.log(`  ✅ ${app.name} -> slug: "${slug}"`);
      } else if (app.slug) {
        console.log(`  ⏩ ${app.name} already has slug: "${app.slug}"`);
      } else {
        console.log(`  ⚠️ ${app.name} - no mapping found, skipping`);
      }
    }

    // Step 2: Collect all active slugs
    const updatedApps = await db.collection('applications').find({ active: true }).toArray();
    const activeSlugs = updatedApps.filter(a => a.slug).map(a => a.slug);
    console.log(`\n📋 Active slugs: ${JSON.stringify(activeSlugs)}`);

    // Step 3: Populate allowedApps on all tenants
    console.log('\n🔧 Step 2: Populating tenant allowedApps...');
    const result = await db.collection('tenants').updateMany(
      {},
      { 
        $addToSet: { allowedApps: { $each: activeSlugs } },
        $set: { updatedAt: new Date() } 
      }
    );
    console.log(`  ✅ Updated ${result.modifiedCount} tenants`);

    // Final verification
    console.log('\n📋 Final verification:');
    const tenants = await db.collection('tenants').find({}).toArray();
    for (const t of tenants) {
      console.log(`  - ${t.tenantId} (${t.name}) | allowedApps: ${JSON.stringify(t.allowedApps)}`);
    }

    const finalApps = await db.collection('applications').find({}).toArray();
    console.log('\n🛰️ Applications:');
    for (const a of finalApps) {
      console.log(`  - ${a.name} | slug: ${a.slug} | active: ${a.active}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

main();
