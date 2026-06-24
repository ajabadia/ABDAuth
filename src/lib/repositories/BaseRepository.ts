/**
 * @purpose Gestiona operaciones MongoDB con soporte automático para auditoria de entidades.
 * @purpose_en Manages MongoDB operations with automatic auditing support for entities.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:2,sig:1swsf55
 * @lastUpdated 2026-06-23T22:41:54.673Z
 */

import { type Collection, type Document, type Filter, type OptionalUnlessRequiredId, type UpdateFilter, type UpdateOptions, type ObjectId } from 'mongodb';
import { AppError } from '../errors';

/**
 * 🔒 SafeFilter
 * Helper type to ensure filter keys match entity properties.
 */
export type SafeFilter<T> = Filter<T>;

/**
 * 🏛️ BaseRepository
 * Industrial abstraction for MongoDB operations with automatic auditing support.
 */
export abstract class BaseRepository<T extends Document> {
  private dbName: string;
  private collectionName: string;
  private dbType: 'AUTH' | 'DATA' | 'LOGS';

  constructor(collectionName: string, dbType: 'AUTH' | 'DATA' | 'LOGS' = 'AUTH') {
    this.dbType = dbType;
    if (dbType === 'LOGS') {
      this.dbName = process.env.MONGODB_LOGS_DB || 'ABDElevators-Logs';
    } else if (dbType === 'DATA') {
      this.dbName = process.env.MONGODB_DATA_DB || 'ABDElevators';
    } else {
      this.dbName = process.env.MONGODB_AUTH_DB || 'ABDElevators-Auth';
    }
    this.collectionName = collectionName;
  }

  /**
   * 🔌 Connection Orchestrator (Singleton Industrial)
   */
  protected async getCollection(): Promise<Collection<T>> {
    const { mongoClientPromise, mongoLogsClientPromise } = await import('../mongodb');
    const clientPromise = this.dbType === 'LOGS' ? mongoLogsClientPromise : mongoClientPromise;
    
    try {
      const client = await clientPromise;
      return client.db(this.dbName).collection<T>(this.collectionName);
    } catch (error) {
      throw new AppError(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findOne(filter: SafeFilter<T>): Promise<T | null> {
    const col = await this.getCollection();
    return await col.findOne(filter) as T | null;
  }

  async list(filter: SafeFilter<T> = {}): Promise<T[]> {
    const col = await this.getCollection();
    const cursor = col.find(filter);
    return (await cursor.toArray()) as T[];
  }

  async create(data: OptionalUnlessRequiredId<T>): Promise<string> {
    const col = await this.getCollection();
    const doc = {
      ...data,
      createdAt: data.createdAt || new Date(),
      timestamp: data.timestamp || new Date(),
    } as OptionalUnlessRequiredId<T>;
    const result = await col.insertOne(doc);
    return result.insertedId.toString();
  }

  async update(id: string | ObjectId, data: UpdateFilter<T>, filter: SafeFilter<T> = {}, options: UpdateOptions = {}): Promise<boolean> {
    const { ObjectId } = await import('mongodb');
    const col = await this.getCollection();
    
    // 🛡️ Bulletproof ID conversion
    let queryId = id;
    if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        queryId = new ObjectId(id);
      } catch {
        queryId = id;
      }
    }

    const query = { _id: queryId, ...filter } as Filter<T>;
    
    // Industrial Smart Update
    let updateDoc: UpdateFilter<T> = data;
    if (!Object.keys(data).some(k => k.startsWith('$'))) {
      updateDoc = { $set: data as Partial<T> } as UpdateFilter<T>;
    }

    const result = await col.updateOne(query, updateDoc, options);
    return result.modifiedCount > 0;
  }

  async softDelete(id: string | ObjectId): Promise<boolean> {
    const col = await this.getCollection();
    const query = { _id: id } as Filter<T>;
    const update = { $set: { active: false, updatedAt: new Date() } as unknown as Partial<T> } as UpdateFilter<T>;
    
    const result = await col.updateOne(query, update);
    return result.modifiedCount > 0;
  }

  async deleteMany(filter: SafeFilter<T>): Promise<number> {
    const col = await this.getCollection();
    const result = await col.deleteMany(filter);
    return result.deletedCount;
  }

  async count(filter: SafeFilter<T> = {}): Promise<number> {
    const col = await this.getCollection();
    return await col.countDocuments(filter);
  }
}
