/**
 * @purpose Gestiona sesiones de usuario revocando sesiones específicas o todas las demás.
 * @purpose_en Manages user sessions by revoking specific or all other sessions.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:5,sig:7cj682
 * @lastUpdated 2026-06-23T22:44:48.497Z
 */

"use server";

import { revalidatePath } from "next/cache";
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
  revalidatePath("/[locale]/dashboard/security", "page");
}
