/**
 * @purpose Gestiona el manejo de entidad organizacional con normalización industrial.
 * @purpose_en Manages organizational entity management with Industrial Normalization.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:6,sig:xe41i3
 * @lastUpdated 2026-06-23T22:42:25.826Z
 */

import { TenantAwareRepository } from './TenantAwareRepository';
import { type SafeFilter } from './BaseRepository';
import type { Tenant } from '@/lib/schemas/auth';
import type { TenantId } from '@/lib/schemas/common';
import { IndustrialNormalizer } from '../utils/IndustrialNormalizer';
import type { IndustrialSession } from '@/types/auth';

/**
 * 🏢 TenantRepository
 * Repository for organizational entity management with Industrial Normalization.
 */
export class TenantRepository extends TenantAwareRepository<Tenant> {
  constructor() {
    super('tenants', 'AUTH');
  }

  async findByTenantId(tenantId: TenantId): Promise<Tenant | null> {
    const query: SafeFilter<Tenant> = { tenantId };
    const raw = await this.findOne(query);
    return raw ? IndustrialNormalizer.normalizeTenant(raw) : null;
  }

  /**
   * 📋 List tenants for the current session context
   */
  async listForCurrentSession(session: IndustrialSession): Promise<Tenant[]> {
    const raws = await this.listForSession(session);
    return raws.map(IndustrialNormalizer.normalizeTenant);
  }
}

export const tenantRepository = new TenantRepository();
