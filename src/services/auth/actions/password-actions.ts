/**
 * @purpose Gestiona el proceso de cambiar la contraseña de un usuario, incluyendo validar la contraseña actual, cifrar la nueva, actualizar la base de datos, auditorizar el cambio, revocar otras sesiones y enviar una alerta de seguridad.
 * @purpose_en Manages the process of changing a user's password, including validating the current password, hashing the new one, updating the database, auditing the change, revoking other sessions, and sending a security alert.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:v02kzu
 * @lastUpdated 2026-06-25T10:17:42.004Z
 */

"use server";

import { logger } from '@ajabadia/satellite-sdk/logger';;
import { getServerSession } from '@/lib/get-session';
import { userRepository } from "@/lib/repositories/UserRepository";
import { SessionService } from "../SessionService";
import type { IndustrialUser } from "@/types/auth";
import type { EntityId } from "@/lib/schemas/common";

/**
 * 🔐 Security: Change user password
 */
export async function changePasswordAction(currentPass: string, newPass: string) {
  const session = await getServerSession();
  const user = session?.user as IndustrialUser;
  if (!user) return { success: false, error: 'UNAUTHORIZED' };

  const dbUser = await userRepository.findById(user.id as EntityId);
  if (!dbUser) return { success: false, error: 'USER_NOT_FOUND' };

  const argon2 = await import('argon2');
  const isMatch = await argon2.verify(dbUser.password, currentPass);
  if (!isMatch) {
    return { success: false, error: 'INVALID_CURRENT_PASSWORD' };
  }

  const hashedPassword = await argon2.hash(newPass);
  const updated = await userRepository.update(user.id as EntityId, { 
    password: hashedPassword,
    updatedAt: new Date()
  });

  if (updated) {
    const { auditRepository } = await import('@/lib/repositories/AuditRepository');
    const { EmailService } = await import('@/services/email/EmailService');
    
    await auditRepository.create({
      timestamp: new Date(),
      event: 'PASSWORD_CHANGE',
      actorId: user.id as EntityId,
      actorEmail: user.email,
      tenantId: user.tenantId,
      status: 'SUCCESS'
    });

    if (user.sessionId) {
      try {
        await SessionService.revokeAllOtherSessions(user.id as EntityId, user.sessionId, user.tenantId);
      } catch (err) {
        const revokeErr = err instanceof Error ? err.message : 'Unknown error';
        await logger.audit({
          tenantId: user?.tenantId || 'unknown',
          action: 'PASSWORD_CHANGE_REVOKE_SESSIONS_ERROR',
          entityType: 'USER',
          entityId: user?.id || 'unknown',
          userId: user?.id || 'system',
          userEmail: user?.email || 'system@abd.com',
          changedFields: { error: revokeErr },
        });
        console.error('Failed to revoke other sessions during password change:', err);
      }
    }

    try {
      await EmailService.sendSecurityAlert({
        to: user.email || '',
        userName: user.name || '',
        event: 'Cambio de Contraseña',
        details: 'Tu contraseña ha sido actualizada satisfactoriamente desde el panel de seguridad.'
      });
    } catch (err) {
      const alertErr = err instanceof Error ? err.message : 'Unknown error';
      await logger.audit({
        tenantId: user?.tenantId || 'unknown',
        action: 'PASSWORD_CHANGE_SECURITY_ALERT_ERROR',
        entityType: 'USER',
        entityId: user?.id || 'unknown',
        userId: user?.id || 'system',
        userEmail: user?.email || 'system@abd.com',
        changedFields: { error: alertErr },
      });
      console.error('Failed to send security alert:', err);
    }
    
    return { success: true };
  }

  return { success: false, error: 'UPDATE_FAILED' };
}
