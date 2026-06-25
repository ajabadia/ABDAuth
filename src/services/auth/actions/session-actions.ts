/**
 * @purpose Gestiona sesiones de usuario revocando sesiones específicas o todas las demás.
 * @purpose_en Manages user sessions by revoking specific or all other sessions.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:6,sig:66r279
 * @lastUpdated 2026-06-25T10:17:48.841Z
 */

"use server";

import { revalidatePath } from "next/cache";
import { logger } from '@ajabadia/satellite-sdk/logger';;
import { getServerSession } from '@/lib/get-session';
import { SessionService } from "../SessionService";
import type { IndustrialUser } from "@/types/auth";
import type { EntityId } from "@/lib/schemas/common";

/**
 * 🗝️ Session: Revoke a specific session
 */
export async function revokeSessionAction(sessionId: string) {
  const s = await getServerSession();
  const user = s?.user as IndustrialUser;
  if (!user) throw new Error("Unauthorized");

  await SessionService.revokeSession(sessionId, user.id as EntityId, user.tenantId);
  await logger.audit({
    tenantId: user.tenantId || 'system',
    action: 'SESSION_REVOKED',
    entityType: 'SSO_SESSION',
    entityId: sessionId || 'unknown',
    userId: user.id || 'system',
    userEmail: user.email || 'system@abd.com',
    changedFields: {},
  });
  revalidatePath("/[locale]/dashboard/security", "page");
}

/**
 * 🧹 Session: Revoke all other sessions
 */
export async function revokeAllOtherSessionsAction() {
  const s = await getServerSession();
  const user = s?.user as IndustrialUser;
  if (!user) throw new Error("Unauthorized");

  if (!user.sessionId) throw new Error("Current session ID missing");

  await SessionService.revokeAllOtherSessions(user.id as EntityId, user.sessionId, user.tenantId);
  await logger.audit({
    tenantId: user.tenantId || 'system',
    action: 'ALL_OTHER_SESSIONS_REVOKED',
    entityType: 'SSO_SESSION',
    entityId: user.sessionId || 'unknown',
    userId: user.id || 'system',
    userEmail: user.email || 'system@abd.com',
    changedFields: {},
  });
  revalidatePath("/[locale]/dashboard/security", "page");
}
