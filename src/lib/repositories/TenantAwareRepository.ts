/**
 * @purpose Gestiona operaciones de base de datos con aislamiento de tenant basado en sesiones de usuario, apoyando bypass explícito para SUPER_ADMIN global.
 * @purpose_en Manages database operations with tenant isolation based on user sessions, supporting explicit SUPER_ADMIN bypass for global management.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:0,imports:3,sig:1h43u5e
 * @lastUpdated 2026-06-23T22:42:22.216Z
 */

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
