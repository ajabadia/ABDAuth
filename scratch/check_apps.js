const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/";

async function test() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("ABDElevators-Auth");
    const apps = await db.collection("applications").find({}).toArray();
    console.log("All Applications in DB:", JSON.stringify(apps, null, 2));
    
    const tenants = await db.collection("tenants").find({}).toArray();
    console.log("All Tenants in DB:", JSON.stringify(tenants.map(t => ({ name: t.name, tenantId: t.tenantId, allowedApps: t.allowedApps })), null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

test();
