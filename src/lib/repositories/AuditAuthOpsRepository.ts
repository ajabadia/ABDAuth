import { BaseRepository, type SafeFilter } from './BaseRepository';
import type { AuditAuthOps } from '@/lib/schemas/audit';

/**
 * 🛡️ AuditAuthOpsRepository
 * Persistence repository for local auth operations and SSO logs.
 * Target: 'audit_auth_ops' collection in AUTH database.
 */
export class AuditAuthOpsRepository extends BaseRepository<AuditAuthOps> {
  constructor() {
    super('audit_auth_ops', 'AUTH');
  }

  /**
   * 📋 List operational logs filtered by tenantId
   */
  async findByTenantId(tenantId: string): Promise<AuditAuthOps[]> {
    const query: SafeFilter<AuditAuthOps> = { tenantId };
    const results = await this.list(query);
    return results.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  /**
   * 📋 List operational logs for a user
   */
  async findByUserId(userId: string): Promise<AuditAuthOps[]> {
    const query: SafeFilter<AuditAuthOps> = { userId };
    const results = await this.list(query);
    return results.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }
}

export const auditAuthOpsRepository = new AuditAuthOpsRepository();
