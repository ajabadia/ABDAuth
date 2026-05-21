import { BaseRepository } from './BaseRepository';
import type { RateLimit } from '../schemas/rate-limit';

export class RateLimitRepository extends BaseRepository<RateLimit> {
  constructor() {
    super('rate_limits');
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.findOneAndUpdate(
      { key },
      { 
        $inc: { points: 1 },
        $setOnInsert: { expireAt: new Date(Date.now() + ttlSeconds * 1000) }
      },
      { upsert: true, returnDocument: 'after' }
    );
    return result?.points || 0;
  }

  async get(key: string): Promise<RateLimit | null> {
    const collection = await this.getCollection();
    return collection.findOne({ key, expireAt: { $gt: new Date() } });
  }

  async reset(key: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.deleteOne({ key });
  }
}

export const rateLimitRepository = new RateLimitRepository();
