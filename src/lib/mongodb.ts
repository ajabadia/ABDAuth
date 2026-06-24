/**
 * @purpose Gestiona conexiones del cliente MongoDB tanto para bases de datos principales como de logs, asegurando un pool de conexión único para evitar saturación de la mano de obra SSL.
 * @purpose_en Manages MongoDB client connections for both main and logs databases, ensuring a single connection pool to prevent SSL handshake saturation.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:1ydpbew
 * @lastUpdated 2026-06-24T10:29:24.233Z
 */

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
    globalWithMongo[promiseKey] = client.connect().catch((error) => {
      // 🛡️ Swallow connection errors during Next.js build phase to prevent build crash
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        console.warn(`[Mongo] Warning: Database connection failed during build, ignoring to allow build to complete:`, error.message);
        return client;
      }
      throw error;
    });
  }
  
  return globalWithMongo[promiseKey]!;
}

export const mongoClientPromise = getClient(uri as string, false);
export const mongoLogsClientPromise = getClient(logsUri as string, true);
