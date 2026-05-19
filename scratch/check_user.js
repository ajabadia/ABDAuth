const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/";

async function test() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("ABDElevators-Auth");
    const user = await db.collection("users").findOne({ email: "ajabadia@gmail.com" });
    console.log("User details:", JSON.stringify(user, null, 2));
    
    if (user.tenantId) {
      const tenant = await db.collection("tenants").findOne({ tenantId: user.tenantId });
      console.log("Primary Tenant:", JSON.stringify(tenant, null, 2));
    }
    
    const allApps = await db.collection("applications").find({}).toArray();
    console.log("Applications in DB:", allApps.map(a => ({ name: a.name, slug: a.slug })));
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

test();
