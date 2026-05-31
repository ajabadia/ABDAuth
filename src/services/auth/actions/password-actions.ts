"use server";

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
        // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.error('Failed to send security alert:', err);
    }
    
    return { success: true };
  }

  return { success: false, error: 'UPDATE_FAILED' };
}
