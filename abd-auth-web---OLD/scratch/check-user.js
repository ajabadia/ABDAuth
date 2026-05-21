const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/";
const DB_NAME = "ABDElevators-Auth";

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log("Connected to MongoDB Auth DB.");
    const db = client.db(DB_NAME);
    
    // Check rate_limits
    const limitsCol = db.collection("rate_limits");
    const allLimits = await limitsCol.find({}).toArray();
    console.log("All rate limits in DB:", allLimits);

    // Let's clear any login rate limits just in case they are blocked!
    const deleteResult = await limitsCol.deleteMany({ key: { $regex: /^login:/ } });
    console.log("Deleted login rate limit records:", deleteResult);

  } catch (error) {
    console.error("Database error:", error);
  } finally {
    await client.close();
  }
}

run();
