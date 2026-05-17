import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const logsUri = process.env.MONGODB_LOGS_URI || uri;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

interface GlobalMongo {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoLogsClientPromise?: Promise<MongoClient>;
}

const globalWithMongo = global as typeof globalThis & GlobalMongo;

/**
 * 🔌 Industrial Singleton Connection Orchestrator
 * Ensures a single connection pool across all repositories to prevent SSL handshake saturation.
 */
async function getClient(connectionUri: string, isLogs: boolean): Promise<MongoClient> {
  const promiseKey = isLogs ? '_mongoLogsClientPromise' : '_mongoClientPromise';
  
  if (!globalWithMongo[promiseKey]) {
    const client = new MongoClient(connectionUri, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      waitQueueTimeoutMS: 30000,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    globalWithMongo[promiseKey] = client.connect();
  }
  
  return globalWithMongo[promiseKey]!;
}

export const mongoClientPromise = getClient(uri as string, false);
export const mongoLogsClientPromise = getClient(logsUri as string, true);
