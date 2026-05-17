import { MongoClient, type Db } from 'mongodb';

/**
 * 🗄️ MongoDB Connection Engine
 * Handles HMR in development and direct connection in production.
 * Adheres to Zero-Noise and High-Fidelity standards.
 */

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) return clientPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      // Mock promise during build to prevent crash
      return Promise.resolve({} as unknown as MongoClient);
    }
    throw new Error('Please add your Mongo URI to .env.local');
  }

  const options = {
    connectTimeoutMS: 20000,
    socketTimeoutMS: 60000,
    family: 4,
  };

  if (process.env.NODE_ENV === 'development') {
    const globalWithMongo = globalThis as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}

/**
 * 🔌 Database Accessors
 */
export async function connectDB(): Promise<Db> {
  const promise = await getClientPromise();
  return promise.db();
}

export async function connectAuthDB(): Promise<Db> {
  const promise = await getClientPromise();
  const dbName = process.env.MONGODB_AUTH_DB || 'ABD-Auth';
  return promise.db(dbName);
}

export default getClientPromise();
