/**
 * @purpose Gestiona el proceso de solicitud y manejo de acciones de restablecimiento de contraseñas, incluyendo la generación de tokens, envío de correos electrónicos, auditoría de eventos y revocación de sesiones de usuario.
 * @purpose_en Manages the process of requesting and handling password reset actions, including generating tokens, sending emails, auditing events, and revoking user sessions.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:7,sig:qw07mu
 * @lastUpdated 2026-06-25T10:18:00.174Z
 */

'use server';

import { logger } from '@ajabadia/satellite-sdk/logger';;
import { userRepository } from '@/lib/repositories/UserRepository';
import { resetTokenRepository } from '@/lib/repositories/ResetTokenRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { EmailService } from '../email/EmailService';
import type { EntityId } from '@/lib/schemas/common';
import crypto from 'crypto';

/**
 * 🛰️ Recovery: Request a password reset link
 */
export async function requestPasswordResetAction(email: string) {
  const { RateLimitService } = await import('@/services/security/RateLimitService');
  const ip = await RateLimitService.getClientIp();
  
  // 🛡️ Volumetric Protection: 3 recovery requests per 1 hour per IP
  const isAllowed = await RateLimitService.check(ip, 'recovery', 3, 3600);
  if (!isAllowed) {
    return { success: false, error: 'TOO_MANY_REQUESTS' };
  }

  // 1. Find user (don't reveal if exists for security)
  const dbUser = await userRepository.findByEmail(email);
  if (!dbUser) {
    // Return success anyway to prevent email enumeration
    return { success: true };
  }

  // 2. Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  // 3. Invalidate previous tokens and save new one
  await resetTokenRepository.invalidateTokens(dbUser._id!.toString());
  await resetTokenRepository.create({
    userId: dbUser._id!.toString(),
    token,
    expiresAt,
    createdAt: new Date(),
  });

  // 4. Send email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:5001';
  const resetUrl = `${baseUrl}/login/reset-password?token=${token}`;

  try {
    await EmailService.sendPasswordReset({
      to: email,
      userName: dbUser.name || email.split('@')[0],
      resetUrl,
    });

    // 5. Audit
    await auditRepository.create({
      timestamp: new Date(),
      event: 'PASSWORD_CHANGE_REQUEST',
      actorId: dbUser._id!.toString(),
      actorEmail: email,
      tenantId: dbUser.tenantId,
      status: 'SUCCESS'
    });
  } catch (error) {
    const resetErr = error instanceof Error ? error.message : 'Unknown error';
    await logger.audit({
      tenantId: dbUser?.tenantId || 'unknown',
      action: 'PASSWORD_RESET_EMAIL_ERROR',
      entityType: 'USER',
      entityId: dbUser?._id?.toString() || 'unknown',
      userId: dbUser?._id?.toString() || 'system',
      userEmail: email,
      changedFields: { error: resetErr },
    });
    console.error('Failed to send reset email:', error);
    return { success: false, error: 'EMAIL_FAILURE' };
  }

  return { success: true };
}

/**
 * 🔐 Recovery: Reset password using token
 */
export async function resetPasswordAction(token: string, newPass: string) {
  // 1. Validate token
  const resetToken = await resetTokenRepository.findByToken(token);
  if (!resetToken) {
    return { success: false, error: 'INVALID_OR_EXPIRED_TOKEN' };
  }

  const dbUser = await userRepository.findById(resetToken.userId as EntityId);
  if (!dbUser) return { success: false, error: 'USER_NOT_FOUND' };

  // 2. Hash and update password
  const argon2 = await import('argon2');
  const hashedPassword = await argon2.hash(newPass);
  
  const updated = await userRepository.update(dbUser._id as EntityId, {
    password: hashedPassword,
    active: true,
    emailVerified: new Date(),
    updatedAt: new Date(),
  });

  if (updated) {
    // 3. Mark token as used
    await resetTokenRepository.markAsUsed(resetToken._id as EntityId);

    // 4. Audit
    await auditRepository.create({
      timestamp: new Date(),
      event: 'PASSWORD_CHANGE',
      actorId: dbUser._id!.toString(),
      actorEmail: dbUser.email,
      tenantId: dbUser.tenantId,
      status: 'SUCCESS',
      metadata: { method: 'RECOVERY_TOKEN' }
    });

    // 🛡️ Global Revocation: Kill ALL active sessions for this user
    try {
      const { SessionService } = await import('@/services/auth/SessionService');
      await SessionService.revokeAllUserSessions(dbUser._id!.toString() as EntityId, dbUser.tenantId);
    } catch (err) {
      const revokeErr = err instanceof Error ? err.message : 'Unknown error';
      await logger.audit({
        tenantId: dbUser?.tenantId || 'unknown',
        action: 'PASSWORD_RESET_REVOKE_SESSIONS_ERROR',
        entityType: 'USER',
        entityId: dbUser?._id?.toString() || 'unknown',
        userId: dbUser?._id?.toString() || 'system',
        userEmail: dbUser?.email || 'system@abd.com',
        changedFields: { error: revokeErr },
      });
      console.error('Failed to revoke sessions during recovery reset:', err);
    }

    // 📧 Security Notification
    try {
      await EmailService.sendSecurityAlert({
        to: dbUser.email,
        userName: dbUser.name,
        event: 'Contraseña Restaurada',
        details: 'Tu contraseña ha sido restaurada satisfactoriamente utilizando un enlace de recuperación.'
      });
    } catch (err) {
      const alertErr = err instanceof Error ? err.message : 'Unknown error';
      await logger.audit({
        tenantId: dbUser?.tenantId || 'unknown',
        action: 'PASSWORD_RESET_SECURITY_ALERT_ERROR',
        entityType: 'USER',
        entityId: dbUser?._id?.toString() || 'unknown',
        userId: dbUser?._id?.toString() || 'system',
        userEmail: dbUser?.email || 'system@abd.com',
        changedFields: { error: alertErr },
      });
      console.error('Failed to send security alert:', err);
    }

    return { success: true };
  }

  return { success: false, error: 'UPDATE_FAILED' };
}
