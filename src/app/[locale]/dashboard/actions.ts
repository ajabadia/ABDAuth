/**
 * @purpose Gestiona el cambio de inquilinos para una sesión de usuario conectado, incluyendo verificaciones de autorización, actualizaciones de preferencias del usuario, configuración de cookies y registro de eventos operativos.
 * @purpose_en Manages the switching of tenants for a logged-in user session, including authorization checks, updating user preferences, setting cookies, and logging operational events.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:12fz6f7
 * @lastUpdated 2026-06-25T10:16:38.864Z
 */

'use server';

import { logger } from '@ajabadia/satellite-sdk/logger';;
import { getServerSession } from '@/lib/get-session';
import { userRepository } from '@/lib/repositories/UserRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { auditAuthOpsRepository } from '@/lib/repositories/AuditAuthOpsRepository';
import type { TenantId } from '@/lib/schemas/common';

/**
 * 🏢 Switch Tenant Server Action
 * Changes the active tenant for the logged-in session.
 * With better-auth, the tenantId is stored in the user document.
 * The session will reflect the change on next getSession() call.
 */
export async function switchTenantAction(tenantId: string) {
  try {
    const session = await getServerSession();
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

    // 3. Update user's active tenant in DB (session will reflect on next getSession)
    await userRepository.update(user.id, {
      tenantId,
      dbPrefix,
      isolationStrategy,
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
    const switchErr = error instanceof Error ? error.message : 'Unknown error';
    await logger.audit({
      tenantId: tenantId || 'unknown',
      action: 'SWITCH_TENANT_ACTION_ERROR',
      entityType: 'TENANT',
      entityId: tenantId || 'unknown',
      userId: 'system',
      userEmail: 'system@abd.com',
      changedFields: { error: switchErr, targetTenantId: tenantId },
    });
    console.error('[SWITCH_TENANT_ACTION] Failed:', error);
    return { success: false, error: 'INTERNAL_ERROR' };
  }
}
