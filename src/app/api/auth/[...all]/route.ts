import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * 🆕 Better Auth Next.js Handler
 * The twoFactor plugin is fully enabled for MFA operations.
 *
 * @see https://better-auth.com/docs/integrations/next
 */
export const { POST, GET } = toNextJsHandler(auth);
