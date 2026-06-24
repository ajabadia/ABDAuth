/**
 * @purpose Gestiona límites de velocidad para solicitudes API incrementando puntos y reiniciando límites.
 * @purpose_en Manages rate limiting for API requests by incrementing points and resetting limits.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:1395j4x
 * @lastUpdated 2026-06-21T12:07:05.635Z
 */

import { BaseRepository } from './BaseRepository';
import type { RateLimit } from '../schemas/rate-limit';

export class RateLimitRepository extends BaseRepository<RateLimit> {
  constructor() {
    super('rate_limits');
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const collection = await this.getCollection();
    const now = new Date();
    
    const doc = await collection.findOne({ key } as Record<string, unknown>);
    
    if (!doc || new Date(doc.expireAt) < now) {
      const result = await collection.findOneAndUpdate(
        { key },
        { 
          $set: { 
            points: 1, 
            expireAt: new Date(Date.now() + ttlSeconds * 1000) 
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
      return result?.points || 1;
    } else {
      const result = await collection.findOneAndUpdate(
        { key },
        { $inc: { points: 1 } },
        { returnDocument: 'after' }
      );
      return result?.points || (doc.points + 1);
    }
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
