import type { AuditLog } from '@/lib/schemas/audit';
import { TenantAwareRepository } from './TenantAwareRepository';
import type { IndustrialSession } from '@/types/auth';

/**
 * 🛡️ AuditRepository
 * Immutable repository for security event logging.
 */
export class AuditRepository extends TenantAwareRepository<AuditLog> {
  constructor() {
    super('audit_logs', 'AUTH');
  }

  /**
   * 📋 List logs for the current session context
   */
  async listForCurrentSession(session: IndustrialSession): Promise<AuditLog[]> {
    const results = await this.listForSession(session);
    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 100);
  }
}

// Fixed: Export the singleton instance
export const auditRepository = new AuditRepository();
