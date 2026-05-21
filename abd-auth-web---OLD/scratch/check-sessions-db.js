const { MongoClient } = require('mongodb');

const MONGODB_LOGS_URI = "mongodb+srv://ajabadia04_db_user:Ajabafan1974@logs.epv9qr8.mongodb.net/";
const DB_NAME = "ABDElevators-Logs";

async function run() {
  const client = new MongoClient(MONGODB_LOGS_URI);
  try {
    await client.connect();
    console.log("Connected to MongoDB Logs Cluster.");
    const db = client.db(DB_NAME);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log("Collections in DB:", collections.map(c => c.name));

    // Get sessions
    const sessionsCol = db.collection("sessions");
    const allSessions = await sessionsCol.find({}).toArray();
    console.log("Total sessions:", allSessions.length);
    console.log("Sessions:", JSON.stringify(allSessions, null, 2));

  } catch (error) {
    console.error("Database error:", error);
  } finally {
    await client.close();
  }
}

run();
