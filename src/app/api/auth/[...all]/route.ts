/**
 * @purpose Gestiona rutas de autenticación para la aplicación ABDAuth utilizando Better Auth Next.js.
 * @purpose_en Handles authentication routes for the ABDAuth application using Better Auth Next.js.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:vd6t5l
 * @lastUpdated 2026-06-23T22:39:28.916Z
 */

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * 🆕 Better Auth Next.js Handler
 * The twoFactor plugin is fully enabled for MFA operations.
 *
 * @see https://better-auth.com/docs/integrations/next
 */
export const { POST, GET } = toNextJsHandler(auth);
