import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * 🛂 Server-side session retrieval helper
 * Usage:
 * ```ts
 * import { getServerSession } from '@/lib/get-session';
 * const session = await getServerSession();
 * if (!session) { redirect(...); }
 * const user = session.user; // typed via inferAdditionalFields
 * ```
 *
 * @returns The better-auth session, or `null` if not authenticated.
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}
