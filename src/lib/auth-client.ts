/**
 * @purpose Gestiona autenticación y verificación de dos factores para el ecosistema ABD Auth.
 * @purpose_en Manages authentication and two-factor verification for the ABD Auth ecosystem.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:tinf8v
 * @lastUpdated 2026-06-23T22:40:59.383Z
 */

import { createAuthClient } from "better-auth/client";
import { inferAdditionalFields, twoFactorClient } from "better-auth/client/plugins";
import type { auth } from "./auth";

/**
 * 🆕 Better Auth Client (Production)
 * Full authentication and two-factor client for the ABD Auth ecosystem.
 *
 * The handler is mounted at /api/auth/[...all].
 *
 * Usage:
 * ```ts
 * const { data: session } = await authClient.useSession();
 * await authClient.signIn.email({ email, password });
 * await authClient.twoFactor.enable({ password });
 * await authClient.twoFactor.verifyTotp({ code });
 * await authClient.signOut();
 * ```
 */
export const authClient = createAuthClient({
  /**
   * Base URL + handler path prefix.
   * Uses NEXT_PUBLIC_* for browser bundle compatibility.
   */
  baseURL: (process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:5001") + "/api/auth",
  plugins: [
    inferAdditionalFields<typeof auth>(),
    twoFactorClient({
      /**
       * Two-factor redirect endpoint — better-auth will redirect here
       * when 2FA verification is required after sign-in.
       */
      twoFactorPage: "/login/mfa",
    }),
  ],
});
