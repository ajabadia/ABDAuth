import { MongoClient, type Collection, type Document, type Filter, type OptionalUnlessRequiredId, type UpdateFilter, type UpdateOptions, type ObjectId } from 'mongodb';
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
  private client: MongoClient | null = null;
  private dbName: string;
  private collectionName: string;

  constructor(collectionName: string, dbType: 'AUTH' | 'DATA' = 'AUTH') {
    this.dbName = dbType === 'AUTH' 
      ? (process.env.MONGODB_AUTH_DB || 'ABDElevators-Auth') 
      : (process.env.MONGODB_DATA_DB || 'ABDElevators');
    this.collectionName = collectionName;
  }

  /**
   * 🔌 Connection Orchestrator
   */
  protected async getCollection(): Promise<Collection<T>> {
    if (!this.client) {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        if (process.env.NEXT_PHASE === 'phase-production-build') {
          // Silent mock during build
          return {} as unknown as Collection<T>;
        }
        throw new AppError('MONGODB_URI is not defined in environment');
      }
      this.client = new MongoClient(uri);
    }

    try {
      await this.client.connect();
      return this.client.db(this.dbName).collection<T>(this.collectionName);
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
    return (await cursor.toArray()) as unknown as T[];
  }

  async create(data: OptionalUnlessRequiredId<T>): Promise<string> {
    const col = await this.getCollection();
    const result = await col.insertOne(data);
    return result.insertedId.toString();
  }

  async update(id: string | ObjectId, data: UpdateFilter<T>, filter: SafeFilter<T> = {}, options: UpdateOptions = {}): Promise<boolean> {
    const col = await this.getCollection();
    const query = { _id: id, ...filter } as Filter<T>;
    
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
    const update = { $set: { active: false, updatedAt: new Date() } } as unknown as UpdateFilter<T>;
    
    const result = await col.updateOne(query, update);
    return result.modifiedCount > 0;
  }
}
