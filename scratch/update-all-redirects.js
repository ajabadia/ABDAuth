const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/?retryWrites=true&w=majority";
const dbName = "ABDElevators-Auth";

const satellites = [
  {
    name: 'ABDQuiz Federated',
    description: 'Official industrial audit and quiz satellite.',
    clientId: 'abdquiz-industrial-client-id',
    clientSecret: 'abdquiz-industrial-super-secret-key-2026',
    slug: 'quiz',
    redirectUris: [
      'http://localhost:5020/api/auth/federated/callback',
      'http://localhost:5020',
      'https://quiz.abd.vercel.app/api/auth/federated/callback',
      'https://abd-quiz.vercel.app/api/auth/federated/callback',
      'https://abd-quiz.vercel.app'
    ],
    active: true
  },
  {
    name: 'ABDTenantGobernance Federated',
    description: 'Official tenant governance console.',
    clientId: 'abdgov-industrial-client-id',
    clientSecret: 'abdgov-industrial-super-secret-key-2026',
    slug: 'gobernanza',
    redirectUris: [
      'http://localhost:5002/api/auth/federated/callback',
      'http://localhost:5002',
      'https://abd-tenant-gobernance.vercel.app/api/auth/federated/callback',
      'https://abd-tenant-gobernance.vercel.app'
    ],
    active: true
  },
  {
    name: 'ABDLogs Federated',
    description: 'Official centralized logging and auditing console.',
    clientId: 'abdlogs-industrial-client-id',
    clientSecret: 'abdlogs-industrial-super-secret-key-2026',
    slug: 'logs',
    redirectUris: [
      'http://localhost:5003/api/auth/federated/callback',
      'http://localhost:5003',
      'https://abd-logs.vercel.app/api/auth/federated/callback',
      'https://abd-logs.vercel.app'
    ],
    active: true
  }
];

async function main() {
  console.log('Connecting to database...');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected successfully.\n');
    const db = client.db(dbName);

    const collections = ['applications', 'Applications'];

    for (const satellite of satellites) {
      console.log(`--------------------------------------------------`);
      console.log(`Processing satellite: ${satellite.name} (${satellite.clientId})`);
      console.log(`--------------------------------------------------`);
      
      for (const colName of collections) {
        const col = db.collection(colName);
        const existing = await col.findOne({ clientId: satellite.clientId });
        
        if (existing) {
          console.log(`  [Found in ${colName}] Updating...`);
          const result = await col.updateOne(
            { _id: existing._id },
            { 
              $set: { 
                name: satellite.name,
                description: satellite.description,
                clientSecret: satellite.clientSecret,
                slug: satellite.slug,
                redirectUris: satellite.redirectUris,
                active: satellite.active,
                updatedAt: new Date()
              } 
            }
          );
          console.log(`  ✅ Updated in ${colName}:`, result);
        } else {
          console.log(`  [Not found in ${colName}] Inserting new document...`);
          const result = await col.insertOne({
            ...satellite,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log(`  ✅ Inserted in ${colName}:`, result);
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
