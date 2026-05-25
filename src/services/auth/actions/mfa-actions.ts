"use server";

import { revalidatePath } from "next/cache";
import { auth, unstable_update } from "@/auth";
import { MfaService } from "../MfaService";
import { userRepository } from "@/lib/repositories/UserRepository";
import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import type { IndustrialUser } from "@/types/auth";
import type { EntityId } from "@/lib/schemas/common";

/**
 * 🛡️ Helper to fetch and guarantee the authenticated session user
 */
async function getRequiredUser(): Promise<IndustrialUser> {
  const session = await auth();
  const user = session?.user as IndustrialUser;
  if (!user) throw new Error("Unauthorized");
  return user;
}

/**
 * 🔒 MFA: Verify token during login flow
 */
export async function verifyMfaLoginAction(token: string) {
  const session = await auth();
  const user = session?.user as IndustrialUser;
  if (!user) return { success: false, error: "Unauthorized" };

  const isValid = await MfaService.verifyToken(user.id, token);
  
  if (isValid) {
    await unstable_update({
      user: {
        ...user,
        mfa_verified: true
      }
    });

    const locale = await getLocale();
    redirect({ href: '/dashboard', locale });
    return { success: true };
  }

  return { success: false, error: "Invalid Token" };
}

/**
 * 🔒 MFA: Setup initial configuration
 */
export async function setupMfaAction() {
  const user = await getRequiredUser();
  return await MfaService.setup(user.id, user.email || "");
}

/**
 * 🔓 MFA: Verify and enable
 */
export async function enableMfaAction(secret: string, token: string) {
  const user = await getRequiredUser();
  const result = await MfaService.enable(user.id, secret, token);
  
  if (result.success) {
    await unstable_update({
      user: {
        ...user,
        mfaEnabled: true,
        mfa_verified: true
      }
    });
    revalidatePath("/[locale]/dashboard/security", "page");
  }
  
  return result;
}

export async function disableMfaAction() {
  const user = await getRequiredUser();
  const dbUser = await userRepository.findById(user.id as EntityId);
  const mfaEnforced = dbUser?.mfaEnforced ?? user.mfaEnforced;

  await MfaService.disable(user.id);
  
  await unstable_update({
    user: {
      ...user,
      mfaEnabled: false,
      mfa_verified: false,
      mfaEnforced: !!mfaEnforced
    }
  });

  revalidatePath("/[locale]/dashboard/security", "page");
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

  await MfaService.disable(targetUserId);

  if (dbUser) {
    try {
      await EmailService.sendSecurityAlert({
        to: dbUser.email,
        userName: dbUser.name,
        event: 'MFA Reseteado por Administrador',
        details: 'Un administrador ha reseteado tu configuración de Segundo Factor (MFA). Por favor, vuelve a configurarlo en tu próximo acceso.'
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to send MFA reset alert:', err);
    }
  }

  revalidatePath("/[locale]/dashboard/users", "page");
  return { success: true };
}

/**
 * 🔄 Session: Force synchronize MFA enforcement from DB
 */
export async function syncMfaEnforcementAction() {
  const session = await auth();
  const user = session?.user as IndustrialUser;
  if (!user) return { success: false };

  const dbUser = await userRepository.findById(user.id as EntityId);
  const mfaEnforced = !!(dbUser?.mfaEnforced);

  if (user.mfaEnforced !== mfaEnforced) {
    await unstable_update({
      user: {
        ...user,
        mfaEnforced
      }
    });
  }

  return { success: true };
}

/**
 * 🔓 MFA Grace Period: Skip setup for now
 */
export async function skipMfaGraceAction() {
  const session = await auth();
  const user = session?.user as IndustrialUser;
  if (!user) return { success: false, error: "Unauthorized" };

  const dbUser = await userRepository.findById(user.id as EntityId);
  if (!dbUser || !dbUser.mfaGracePeriodActive) {
    return { success: false, error: "No active grace period found" };
  }

  const remainingLogins = Math.max(0, (dbUser.mfaGraceLoginsRemaining ?? 1) - 1);
  const graceActive = remainingLogins > 0;

  // Update in DB
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

  // Update session state
  await unstable_update({
    user: {
      ...user,
      mfaGraceBypassed: true,
      mfaGracePeriodActive: graceActive,
      mfaGraceLoginsRemaining: remainingLogins
    }
  });

  return { success: true, remainingLogins };
}
