import { BaseRepository, type SafeFilter } from './BaseRepository';
import type { Tenant } from '@/lib/schemas/auth';
import type { TenantId } from '@/lib/schemas/common';
import { IndustrialNormalizer } from '../utils/IndustrialNormalizer';

/**
 * 🏢 TenantRepository
 * Repository for organizational entity management with Industrial Normalization.
 */
export class TenantRepository extends BaseRepository<Tenant> {
  constructor() {
    super('tenants', 'AUTH');
  }

  async findByTenantId(tenantId: TenantId): Promise<Tenant | null> {
    const query: SafeFilter<Tenant> = { tenantId };
    const raw = await this.findOne(query);
    return raw ? IndustrialNormalizer.normalizeTenant(raw) : null;
  }

  // Override list to ensure all tenants are normalized
  async listAll(): Promise<Tenant[]> {
    const raws = await this.list({});
    return raws.map(IndustrialNormalizer.normalizeTenant);
  }
}

export const tenantRepository = new TenantRepository();
