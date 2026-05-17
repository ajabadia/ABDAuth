"use server";

import { auth } from "@/auth";
import { userRepository } from "@/lib/repositories/UserRepository";
import { SessionService } from "../SessionService";
import type { IndustrialUser } from "@/types/auth";
import type { EntityId } from "@/lib/schemas/common";

/**
 * 🔐 Security: Change user password
 */
export async function changePasswordAction(currentPass: string, newPass: string) {
  const session = await auth();
  const user = session?.user as IndustrialUser;
  if (!user) return { success: false, error: 'UNAUTHORIZED' };

  const dbUser = await userRepository.findById(user.id as EntityId);
  if (!dbUser) return { success: false, error: 'USER_NOT_FOUND' };

  const bcrypt = await import('bcryptjs');
  const isMatch = await bcrypt.compare(currentPass, dbUser.password);
  if (!isMatch) {
    return { success: false, error: 'INVALID_CURRENT_PASSWORD' };
  }

  const hashedPassword = await bcrypt.hash(newPass, 12);
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
