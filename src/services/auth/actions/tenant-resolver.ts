import { tenantRepository } from '@/lib/repositories/TenantRepository';
import type { TenantId } from '@/lib/schemas/common';

export interface ResolvedTenant {
  activeTenantId: TenantId;
  dbPrefix: string;
  isolationStrategy: string;
}

/**
 * 🛡️ Resolves the effective tenant for a user session.
 * Accepts a user-like object (from MongoDB or session) with tenantId and optional tenantIds.
 */
export async function resolveUserTenant(
  user: { tenantId: string; tenantIds?: string[]; role: string },
  requestedTenantId?: string
): Promise<ResolvedTenant> {
  let activeTenantId: TenantId = user.tenantId as TenantId;

  if (user.role === 'SUPER_ADMIN') {
    activeTenantId = 'GLOBAL' as TenantId;
  } else if (requestedTenantId) {
    const userTenantIds = user.tenantIds || [];
    if (requestedTenantId === user.tenantId || userTenantIds.includes(requestedTenantId)) {
      activeTenantId = requestedTenantId as TenantId;
    } else {
      throw new Error('UNAUTHORIZED_TENANT_ACCESS');
    }
  } else if (user.tenantIds && user.tenantIds.length > 0) {
    activeTenantId = user.tenantId as TenantId;
  }

  let dbPrefix = 'global_';
  let isolationStrategy: string = 'COLLECTION_PREFIX';

  if (activeTenantId !== 'GLOBAL') {
    const tenant = await tenantRepository.findByTenantId(activeTenantId);
    if (tenant && tenant.dbPrefix) {
      dbPrefix = tenant.dbPrefix;
      isolationStrategy = tenant.isolationStrategy || 'COLLECTION_PREFIX';
    } else {
      throw new Error('TENANT_NOT_FOUND_OR_MISSING_PREFIX');
    }
  }

  return { activeTenantId, dbPrefix, isolationStrategy };
}
