"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { SessionService } from "../SessionService";
import type { IndustrialUser } from "@/types/auth";
import type { EntityId } from "@/lib/schemas/common";

/**
 * 🗝️ Session: Revoke a specific session
 */
export async function revokeSessionAction(sessionId: string) {
  const session = await auth();
  const user = session?.user as IndustrialUser;
  if (!user) throw new Error("Unauthorized");

  await SessionService.revokeSession(sessionId, user.id as EntityId, user.tenantId);
  revalidatePath("/[locale]/dashboard/security", "page");
}

/**
 * 🧹 Session: Revoke all other sessions
 */
export async function revokeAllOtherSessionsAction() {
  const session = await auth();
  const user = session?.user as IndustrialUser;
  if (!user) throw new Error("Unauthorized");

  if (!user.sessionId) throw new Error("Current session ID missing");

  await SessionService.revokeAllOtherSessions(user.id as EntityId, user.sessionId, user.tenantId);
  revalidatePath("/[locale]/dashboard/security", "page");
}
