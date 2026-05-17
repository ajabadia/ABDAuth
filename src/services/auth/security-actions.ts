"use server";

import * as mfa from "./actions/mfa-actions";
import * as sessions from "./actions/session-actions";
import * as password from "./actions/password-actions";

// 🛡️ Industrial Proxy Hub: Re-exporting as explicit async functions to satisfy Next.js bundling

export async function verifyMfaLoginAction(token: string) {
  return mfa.verifyMfaLoginAction(token);
}

export async function setupMfaAction() {
  return mfa.setupMfaAction();
}

export async function enableMfaAction(secret: string, token: string) {
  return mfa.enableMfaAction(secret, token);
}

export async function disableMfaAction() {
  return mfa.disableMfaAction();
}

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
