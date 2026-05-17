import { TenantAwareRepository } from './TenantAwareRepository';
import type { UserSession } from '@/lib/schemas/auth';
import type { EntityId, TenantId } from '@/lib/schemas/common';
import type { SafeFilter } from './BaseRepository';
import { ObjectId } from 'mongodb';

/**
 * 🗝️ SessionRepository
 * Manages active user sessions with persistence in the Telemetry (LOGS) cluster.
 */
export class SessionRepository extends TenantAwareRepository<UserSession> {
  constructor() {
    super('sessions', 'LOGS');
  }

  /**
   * 📋 List active sessions for a specific user
   */
  async findByUserId(userId: string, tenantId: string): Promise<UserSession[]> {
    const filter: SafeFilter<UserSession> = { 
      userId: userId as EntityId, 
      tenantId: tenantId as TenantId,
      expiresAt: { $gt: new Date() }
    };
    const results = await this.list(filter);
    return results.sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
  }

  /**
   * 🚫 Revoke a specific session
   */
  async revoke(sessionId: string, userId: string, tenantId: string): Promise<boolean> {
    const filter: SafeFilter<UserSession> = { 
      _id: new ObjectId(sessionId) as unknown as ObjectId, // Filter<T> is very strict with _id
      userId: userId as EntityId,
      tenantId: tenantId as TenantId 
    };
    const col = await this.getCollection();
    const result = await col.deleteOne(filter);
    return result.deletedCount > 0;
  }

  /**
   * 🌪️ Revoke all sessions for a user
   */
  async revokeAllForUser(userId: string, tenantId: string): Promise<void> {
    const col = await this.getCollection();
    await col.deleteMany({ 
      userId: userId as EntityId, 
      tenantId: tenantId as TenantId 
    });
  }
}

export const sessionRepository = new SessionRepository();
