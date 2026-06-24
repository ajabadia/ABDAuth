/**
 * @purpose Gestiona acciones relacionadas con autenticación como configuración de MFA, revocación de sesiones y cambios de contraseña.
 * @purpose_en Manages authentication-related actions such as MFA setup, session revocation, and password changes.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:6,imports:3,sig:0mjtst
 * @lastUpdated 2026-06-21T14:25:07.708Z
 */

"use server";

import * as mfa from "./actions/mfa-actions";
import * as sessions from "./actions/session-actions";
import * as password from "./actions/password-actions";

// 🛡️ Industrial Proxy Hub: Re-exporting as explicit async functions to satisfy Next.js bundling
//
// Phase 3: MFA setup/enable/disable/verify are now client-side via authClient.twoFactor.*
// Remaining server actions: adminReset, syncMfaEnforcement, skipMfaGrace

export async function adminResetMfaAction(targetUserId: string) {
  return mfa.adminResetMfaAction(targetUserId);
}

export async function syncMfaEnforcementAction() {
  return mfa.syncMfaEnforcementAction();
}

export async function revokeSessionAction(sessionId: string) {
  return sessions.revokeSessionAction(sessionId);
}

export async function revokeAllOtherSessionsAction() {
  return sessions.revokeAllOtherSessionsAction();
}

export async function changePasswordAction(currentPass: string, newPass: string) {
  return password.changePasswordAction(currentPass, newPass);
}

export async function skipMfaGraceAction() {
  return mfa.skipMfaGraceAction();
}


