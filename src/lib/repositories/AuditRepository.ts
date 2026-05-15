import type { AuditLog } from '@/lib/schemas/audit';
import { BaseRepository, type SafeFilter } from './BaseRepository';

/**
 * 🛡️ AuditRepository
 * Immutable repository for security event logging.
 */
export class AuditRepository extends BaseRepository<AuditLog> {
  constructor() {
    super('audit_logs', 'AUTH');
  }

  async findByTenant(tenantId: string): Promise<AuditLog[]> {
    const query: SafeFilter<AuditLog> = { tenantId };
    const db = await this.getCollection();
    const results = await db.find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    return results as unknown as AuditLog[];
  }

  async findByActor(actorId: string): Promise<AuditLog[]> {
    const query: SafeFilter<AuditLog> = { actorId };
    const db = await this.getCollection();
    const results = await db.find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    return results as unknown as AuditLog[];
  }
}

// Fixed: Export the singleton instance
export const auditRepository = new AuditRepository();
