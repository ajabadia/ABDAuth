/**
 * @purpose Gestiona autorización del usuario mediante validación de credenciales, verificación del estado de cuenta y creación de registros de auditoría.
 * @purpose_en Manages user authorization by validating credentials, checking account status, and creating audit logs.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:10,sig:gt4op5
 * @lastUpdated 2026-06-25T10:17:21.061Z
 */

import * as argon2 from 'argon2';
import { logger } from '@ajabadia/satellite-sdk/logger';;
import { userRepository } from '@/lib/repositories/UserRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { SessionService } from '@/services/auth/SessionService';
import type { EntityId } from '@/lib/schemas/common';
import type { IndustrialUser } from '@/types/auth';
import { LoginSchema } from './login-schema';
import { resolveUserTenant } from './tenant-resolver';
import { evaluateMfaGrace } from './mfa-grace-helper';

export async function authorizeUser(credentials: Record<string, any> | undefined): Promise<IndustrialUser | null> {
  if (process.env.NODE_ENV === 'development') console.log('[AUTHORIZE_USER] Called for email:', credentials?.email);
  const parsed = LoginSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const { email, password, passkeyBypassToken, tenantId: requestedTenantId } = parsed.data;
  const user = await userRepository.findByEmail(email);
  if (process.env.NODE_ENV === 'development') console.log('[AUTHORIZE_USER] User lookup:', user ? `Found (Active: ${user.active})` : 'NULL');

  if (!user) {
    await auditRepository.create({ timestamp: new Date(), event: 'LOGIN_FAILURE', actorId: 'SYSTEM', actorEmail: email, status: 'FAILURE', metadata: { reason: 'USER_NOT_FOUND' } });
    return null;
  }

  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    await auditRepository.create({ timestamp: new Date(), event: 'LOGIN_FAILURE', actorId: user._id?.toString() || 'UNKNOWN', actorEmail: email, tenantId: user.tenantId, status: 'FAILURE', metadata: { reason: 'ACCOUNT_LOCKED' } });
    throw new Error('ACCOUNT_LOCKED');
  }

  if (!user.active) throw new Error('ACCOUNT_INACTIVE');

  let isBypassOrPasswordValid = false;

  if (passkeyBypassToken) {
    const jwtSecret = process.env.AUTH_JWT_SECRET;
    if (!jwtSecret) throw new Error('AUTH_JWT_SECRET is required for passkey bypass');
    try {
      const { jwtVerify } = await import('jose');
      const { payload } = await jwtVerify(passkeyBypassToken, new TextEncoder().encode(jwtSecret));
      if (payload.email === email && payload.passkeyLogin) isBypassOrPasswordValid = true;
      else throw new Error('INVALID_BYPASS_TOKEN');
    } catch (err) {
      await auditRepository.create({ timestamp: new Date(), event: 'LOGIN_FAILURE', actorId: user._id?.toString() || 'UNKNOWN', actorEmail: email, tenantId: user.tenantId, status: 'FAILURE', metadata: { reason: 'INVALID_BYPASS_TOKEN' } });
      return null;
    }
  } else {
    isBypassOrPasswordValid = await argon2.verify(user.password, password!);
  }

  if (isBypassOrPasswordValid) {
    if (user.loginAttempts > 0 || user.lockoutUntil) {
      await userRepository.update(user._id as EntityId, { loginAttempts: 0, lockoutUntil: undefined });
    }

    const { activeTenantId, dbPrefix, isolationStrategy } = await resolveUserTenant(user, requestedTenantId);
    let sessionId = undefined;
    try { sessionId = await SessionService.createSession({ userId: user._id?.toString() || '', email: user.email, tenantId: activeTenantId }); }
    catch (error) {
      const authError = error instanceof Error ? error.message : 'Unknown error';
      await logger.audit({
        tenantId: user?.tenantId || 'unknown',
        action: 'AUTHORIZE_USER_SESSION_ERROR',
        entityType: 'USER',
        entityId: user?._id?.toString() || 'unknown',
        userId: user?._id?.toString() || 'system',
        userEmail: user?.email || email,
        changedFields: { error: authError },
      });
      console.error('[AUTH ERROR] Failed to create session:', error);
    }

    const graceState = await evaluateMfaGrace(user);
    await auditRepository.create({ timestamp: new Date(), event: 'LOGIN_SUCCESS', actorId: user._id?.toString() || 'UNKNOWN', actorEmail: user.email, tenantId: activeTenantId, status: 'SUCCESS', metadata: { name: user.name, surname: user.surname } });
    return { id: user._id?.toString() || '', sessionId, name: user.name, surname: user.surname, email: user.email, role: user.role, tenantId: activeTenantId, dbPrefix, isolationStrategy, mfaEnabled: !!user.mfaEnabled, mfaEnforced: !!user.mfaEnforced, mfa_verified: false, mfaGracePeriodActive: graceState.mfaGracePeriodActive, mfaGraceLoginsRemaining: graceState.mfaGraceLoginsRemaining, mfaGraceExpiresAt: graceState.mfaGraceExpiresAt, mfaGraceBypassed: false } as IndustrialUser;
  } else {
    if (process.env.NODE_ENV === 'development') console.log('[AUTHORIZE_USER] Password mismatch. Incrementing login attempts.');
    const newAttempts = (user.loginAttempts || 0) + 1;
    const updateData: Partial<IndustrialUser> = { loginAttempts: newAttempts };
    if (newAttempts >= 5) updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
    await userRepository.update(user._id as EntityId, updateData);
    await auditRepository.create({ timestamp: new Date(), event: 'LOGIN_FAILURE', actorId: user._id?.toString() || 'UNKNOWN', actorEmail: email, tenantId: user.tenantId, status: 'FAILURE', metadata: { reason: 'INVALID_PASSWORD', attempts: newAttempts } });
  }
  return null;
}
