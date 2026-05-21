import { type Document, type Filter } from 'mongodb';
import { BaseRepository, type SafeFilter } from './BaseRepository';
import type { IndustrialSession } from '@/types/auth';

/**
 * 🏢 TenantAwareRepository
 * Specialized repository that enforces tenant isolation based on the user's session.
 * Supports explicit SUPER_ADMIN bypass for global management.
 */
export abstract class TenantAwareRepository<T extends Document> extends BaseRepository<T> {
  
  /**
   * 🛡️ Apply Security Filter
   * Injects tenantId if the user is not a SUPER_ADMIN.
   */
  protected applySecurityFilter(session: IndustrialSession, filter: SafeFilter<T> = {}): Filter<T> {
    if (session.role === 'SUPER_ADMIN') {
      return filter;
    }

    return {
      ...filter,
      tenantId: session.tenantId
    } as Filter<T>;
  }

  /**
   * 🔍 Filtered List
   */
  async listForSession(session: IndustrialSession, filter: SafeFilter<T> = {}): Promise<T[]> {
    const securityFilter = this.applySecurityFilter(session, filter);
    return this.list(securityFilter);
  }

  /**
   * 🎯 Filtered FindOne
   */
  async findOneForSession(session: IndustrialSession, filter: SafeFilter<T>): Promise<T | null> {
    const securityFilter = this.applySecurityFilter(session, filter);
    return this.findOne(securityFilter);
  }
}
