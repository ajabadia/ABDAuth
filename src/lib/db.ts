import { MongoClient, type Db } from 'mongodb';

/**
 * 🗄️ MongoDB Connection Engine
 * Handles HMR in development and direct connection in production.
 * Adheres to Zero-Noise and High-Fidelity standards.
 */

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // Use a global variable to preserve the connection across HMR reloads.
  const globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // Direct connection in production.
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * 🔌 Database Accessors
 */
export async function connectDB(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

export async function connectAuthDB(): Promise<Db> {
  const client = await clientPromise;
  const dbName = process.env.MONGODB_AUTH_DB || 'ABD-Auth';
  return client.db(dbName);
}

export default clientPromise;
