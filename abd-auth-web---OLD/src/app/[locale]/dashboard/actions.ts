'use server';

import { auth, unstable_update } from '@/auth';
import { userRepository } from '@/lib/repositories/UserRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { auditAuthOpsRepository } from '@/lib/repositories/AuditAuthOpsRepository';
import type { TenantId } from '@/lib/schemas/common';

/**
 * 🏢 Switch Tenant Server Action
 * Changes the active tenant for the logged-in session.
 */
export async function switchTenantAction(tenantId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'UNAUTHORIZED_SESSION' };
    }

    const user = session.user;
    const dbUser = await userRepository.findById(user.id);
    if (!dbUser) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    // 1. Authorization checks
    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN';
    const isMember = isSuperAdmin || 
                     dbUser.tenantId === tenantId || 
                     dbUser.tenantIds?.includes(tenantId as TenantId) || 
                     dbUser.tenants?.some(t => t.tenantId === tenantId);

    if (!isMember) {
      return { success: false, error: 'UNAUTHORIZED_TENANT_ACCESS' };
    }

    // 2. Fetch tenant config for dbPrefix/isolationStrategy
    let dbPrefix = 'default';
    let isolationStrategy: 'COLLECTION_PREFIX' | 'DATABASE_PER_TENANT' = 'COLLECTION_PREFIX';

    if (tenantId !== 'GLOBAL') {
      const tenant = await tenantRepository.findByTenantId(tenantId as TenantId);
      if (!tenant || !tenant.active) {
        return { success: false, error: 'TENANT_INACTIVE' };
      }
      dbPrefix = tenant.dbPrefix;
      isolationStrategy = tenant.isolationStrategy;
    } else {
      dbPrefix = 'global_';
      isolationStrategy = 'COLLECTION_PREFIX';
    }

    // 3. Update NextAuth JWT Session Cookie
    await unstable_update({
      user: {
        ...session.user,
        tenantId,
        dbPrefix,
        isolationStrategy,
      }
    });

    // 4. Fallback Cookie for sub-domains or static layouts
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.set('active_tenant_id', tenantId, {
      path: '/',
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // 5. Log operational switch event
    await auditAuthOpsRepository.create({
      tenantId,
      action: 'USER_LOGIN', // Log as login/session change event
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      userEmail: user.email,
      changedFields: { switchedToTenant: tenantId, dbPrefix, isolationStrategy },
    });

    return { success: true };

  } catch (error) {
    console.error('[SWITCH_TENANT_ACTION] Failed:', error);
    return { success: false, error: 'INTERNAL_ERROR' };
  }
}
