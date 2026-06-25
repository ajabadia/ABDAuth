/**
 * @purpose Gestiona acciones de autenticación multifactor, incluyendo resetear MFA para usuarios y sincronizar el cumplimiento de MFA.
 * @purpose_en Manages Multi-Factor Authentication actions, including resetting MFA for users and synchronizing MFA enforcement.
 * @refactorable true (contains multiple distinct functions)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:6,sig:1v9l2ms
 * @lastUpdated 2026-06-25T10:17:29.941Z
 */

"use server";

import { revalidatePath } from "next/cache";
import { logger } from '@ajabadia/satellite-sdk/logger';;
import { getServerSession } from "@/lib/get-session";
import { userRepository } from "@/lib/repositories/UserRepository";
import type { IndustrialUser } from "@/types/auth";
import type { EntityId } from "@/lib/schemas/common";

/**
 * 🛡️ Helper to fetch and guarantee the authenticated session user
 */
async function getRequiredUser(): Promise<IndustrialUser> {
  const session = await getServerSession();
  const user = session?.user as IndustrialUser;
  if (!user) throw new Error("Unauthorized");
  return user;
}

/**
 * 🔒 Admin: Reset MFA for a specific user
 */
export async function adminResetMfaAction(targetUserId: string) {
  const user = await getRequiredUser();
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    throw new Error("Unauthorized: Admin privileges required");
  }

  const { EmailService } = await import('@/services/email/EmailService');
  const dbUser = await userRepository.findById(targetUserId as EntityId);

  await userRepository.updateMfaStatus(targetUserId, false);

  const { auditRepository } = await import('@/lib/repositories/AuditRepository');
  await auditRepository.create({
    timestamp: new Date(),
    event: 'MFA_DISABLED',
    actorId: user.id || 'SYSTEM',
    actorEmail: user.email || 'system@abd.com',
    tenantId: user.tenantId || 'SYSTEM',
    status: 'SUCCESS',
    metadata: { targetUserId, targetEmail: dbUser?.email, action: 'ADMIN_RESET' }
  });

  if (dbUser) {
    try {
      await EmailService.sendSecurityAlert({
        to: dbUser.email,
        userName: dbUser.name,
        event: 'MFA Reseteado por Administrador',
        details: 'Un administrador ha reseteado tu configuración de Segundo Factor (MFA). Por favor, vuelve a configurarlo en tu próximo acceso.'
      });
    } catch (err) {
      const mfaErr = err instanceof Error ? err.message : 'Unknown error';
      await logger.audit({
        tenantId: dbUser?.tenantId || 'unknown',
        action: 'MFA_RESET_ALERT_ERROR',
        entityType: 'USER',
        entityId: targetUserId,
        userId: user?.id || 'system',
        userEmail: user?.email || 'system@abd.com',
        changedFields: { error: mfaErr, targetUserId },
      });
      console.error('Failed to send MFA reset alert:', err);
    }
  }

  revalidatePath("/[locale]/dashboard/users", "page");
  return { success: true };
}

/**
 * 🔄 Session: Force synchronize MFA enforcement from DB
 * Session reflects DB state on next request — no need for unstable_update.
 */
export async function syncMfaEnforcementAction() {
  const session = await getServerSession();
  const user = session?.user as IndustrialUser;
  if (!user) return { success: false };

  const dbUser = await userRepository.findById(user.id as EntityId);
  const mfaEnforced = !!(dbUser?.mfaEnforced);

  // Return current enforcement state; session refreshes on next request
  return { success: true, mfaEnforced };
}

/**
 * 🔓 MFA Grace Period: Skip setup for now
 */
export async function skipMfaGraceAction() {
  const session = await getServerSession();
  const user = session?.user as IndustrialUser;
  if (!user) return { success: false, error: "Unauthorized" };

  const dbUser = await userRepository.findById(user.id as EntityId);
  if (!dbUser || !dbUser.mfaGracePeriodActive) {
    return { success: false, error: "No active grace period found" };
  }

  const remainingLogins = Math.max(0, (dbUser.mfaGraceLoginsRemaining ?? 1) - 1);
  const graceActive = remainingLogins > 0;

  // Update in DB — session reflects changes on next request
  await userRepository.update(user.id as EntityId, {
    mfaGraceLoginsRemaining: remainingLogins,
    mfaGracePeriodActive: graceActive,
    updatedAt: new Date(),
  });

  // Audit this bypass
  const { auditRepository } = await import('@/lib/repositories/AuditRepository');
  await auditRepository.create({
    timestamp: new Date(),
    event: 'MFA_GRACE_BYPASS',
    actorId: user.id,
    actorEmail: user.email,
    tenantId: user.tenantId || 'SYSTEM',
    status: 'SUCCESS',
    metadata: { remainingLogins }
  });

  return { success: true, remainingLogins };
}
