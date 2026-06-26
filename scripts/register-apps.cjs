const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const uri = "mongodb://ajabadia03_db_user:Ajabafan1974@ac-qse2cs0-shard-00-00.xarmew0.mongodb.net:27017,ac-qse2cs0-shard-00-01.xarmew0.mongodb.net:27017,ac-qse2cs0-shard-00-02.xarmew0.mongodb.net:27017/ABDElevators-Auth?replicaSet=atlas-p1mu7m-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority";
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });

const apps = [
  {
    name: "ABDAuth",
    description: "Identity Provider - Central Auth Service",
    clientId: "auth",
    clientSecret: "abd-auth-industrial-client-secret-" + crypto.randomBytes(16).toString('hex'),
    redirectUris: [
      "http://localhost:5001/api/auth/federated/callback",
      "https://auth.abdia.es/api/auth/federated/callback"
    ],
    slug: "auth",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "ABDAnalytics",
    description: "Analytics Satellite",
    clientId: "analytics",
    clientSecret: "dev-analytics-client-secret-" + crypto.randomBytes(16).toString('hex'),
    redirectUris: [
      "https://abdia.es/analytics/api/abd-auth/federated/callback",
      "https://abdia.es/analytics/api/auth/federated/callback",
      "https://abdia.es/analytics",
      "https://analytics.abdia.es/api/abd-auth/federated/callback",
      "https://analytics.abdia.es/api/auth/federated/callback",
      "https://analytics.abdia.es",
      "http://localhost:5004/api/auth/federated/callback",
    ],
    slug: "analytics",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "ABDLogs",
    description: "Logging Service Satellite",
    clientId: "logs",
    clientSecret: "dev-logs-client-secret-" + crypto.randomBytes(16).toString('hex'),
    redirectUris: [
      "https://abdia.es/logs/api/abd-auth/federated/callback",
      "https://abdia.es/logs/api/auth/federated/callback",
      "https://abdia.es/logs",
      "https://logs.abdia.es/api/abd-auth/federated/callback",
      "https://logs.abdia.es/api/auth/federated/callback",
      "https://logs.abdia.es",
      "http://localhost:5003/api/auth/federated/callback",
    ],
    slug: "logs",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "ABDQuiz",
    description: "Quiz Satellite App",
    clientId: "quiz",
    clientSecret: "abdquiz-industrial-client-secret-" + crypto.randomBytes(16).toString('hex'),
    redirectUris: [
      "https://abdia.es/quiz/api/abd-auth/federated/callback",
      "https://abdia.es/quiz/api/auth/federated/callback",
      "https://abdia.es/quiz",
      "https://quiz.abdia.es/api/abd-auth/federated/callback",
      "https://quiz.abdia.es/api/auth/federated/callback",
      "https://quiz.abdia.es",
      "http://localhost:5020/api/auth/federated/callback",
    ],
    slug: "quiz",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "ABDFiles",
    description: "Document Manager Satellite",
    clientId: "files",
    clientSecret: "dev-files-client-secret-" + crypto.randomBytes(16).toString('hex'),
    redirectUris: [
      "https://abdia.es/files/api/abd-auth/federated/callback",
      "https://abdia.es/files/api/auth/federated/callback",
      "https://abdia.es/files",
      "https://files.abdia.es/api/abd-auth/federated/callback",
      "https://files.abdia.es/api/auth/federated/callback",
      "https://files.abdia.es",
      "http://localhost:5005/api/auth/federated/callback",
    ],
    slug: "files",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "ABDtenantGobernance",
    description: "Tenant Governance Satellite",
    clientId: "gobernanza",
    clientSecret: "dev-gobernanza-client-secret-" + crypto.randomBytes(16).toString('hex'),
    redirectUris: [
      "https://abdia.es/gobernanza/api/abd-auth/federated/callback",
      "https://abdia.es/gobernanza/api/auth/federated/callback",
      "https://abdia.es/gobernanza",
      "https://tenantgobernance.abdia.es/api/abd-auth/federated/callback",
      "https://tenantgobernance.abdia.es/api/auth/federated/callback",
      "https://tenantgobernance.abdia.es",
      "http://localhost:5002/api/auth/federated/callback",
    ],
    slug: "gobernanza",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "ABDLanding",
    description: "Landing Page & Portal",
    clientId: "landing",
    clientSecret: "dev-landing-client-secret-" + crypto.randomBytes(16).toString('hex'),
    redirectUris: [
      "https://abdia.es/api/abd-auth/federated/callback",
      "https://abdia.es/api/auth/federated/callback",
      "https://abdia.es",
      "https://www.abdia.es/api/abd-auth/federated/callback",
      "https://www.abdia.es/api/auth/federated/callback",
      "https://www.abdia.es",
      "https://abd-landing.vercel.app/api/abd-auth/federated/callback",
      "https://abd-landing.vercel.app/api/auth/federated/callback",
      "https://abd-landing.vercel.app",
      "http://localhost:5000/api/abd-auth/federated/callback",
      "http://localhost:5000/api/auth/federated/callback",
      "http://localhost:5000",
      "http://localhost:3000/api/abd-auth/federated/callback",
      "http://localhost:3000/api/auth/federated/callback"
    ],
    slug: "landing",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function registerApps() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('ABDElevators-Auth');
    const collection = db.collection('applications');
    
    // Check existing
    const existing = await collection.find({}).toArray();
    console.log(`Found ${existing.length} existing applications`);
    existing.forEach(app => console.log(`  - ${app.name} (${app.clientId})`));
    
    for (const app of apps) {
      const existingApp = await collection.findOne({ clientId: app.clientId });
      if (existingApp) {
        console.log(`Updating ${app.name}...`);
        await collection.updateOne(
          { clientId: app.clientId },
          { $set: { ...app, updatedAt: new Date() } }
        );
      } else {
        console.log(`Inserting ${app.name}...`);
        await collection.insertOne(app);
      }
    }
    
    console.log('\nDone! All applications registered with redirect URIs.');
    
    // Verify
    const all = await collection.find({}).toArray();
    console.log(`\nTotal applications: ${all.length}`);
    all.forEach(app => {
      console.log(`\n${app.name} (${app.clientId}):`);
      console.log(`  Client Secret: ${app.clientSecret}`);
      console.log(`  Redirect URIs:`);
      app.redirectUris.forEach(uri => console.log(`    - ${uri}`));
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

registerApps();