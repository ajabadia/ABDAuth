/**
 * @purpose Gestiona el envío de correos de activación para usuarios recientemente provisionados.
 * @purpose_en Orchestrates sending activation emails for newly provisioned users.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:12xsuzo
 * @lastUpdated 2026-06-25T10:17:03.943Z
 */

import { ResendEmailService } from '@ajabadia/satellite-sdk/utils';;
import { AppError } from '../errors';

/**
 * 📧 InviteService
 * Orchestrates sending activation emails for newly provisioned users
 */
export class InviteService {
  async sendActivationEmail(email: string, name: string, token: string, tenantId: string) {
    try {
      const activateUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/activate?token=${token}&tenantId=${tenantId}`;
      
      await ResendEmailService.sendEmail({
        from: 'ABDSuite IAM <no-reply@abd-suite.com>', // Update with verified domain if applicable
        to: email,
        subject: 'Activa tu cuenta en ABDSuite',
        html: `
          <div style="font-family: monospace; background: #000; color: #fff; padding: 20px;">
            <h2>[ABDSuite] INVITACIÓN DE SISTEMA</h2>
            <p>Hola ${name},</p>
            <p>Has sido invitado al tenant <strong>${tenantId}</strong>.</p>
            <p>Para activar tu cuenta y establecer tu contraseña, haz clic en el siguiente enlace:</p>
            <br/>
            <a href="${activateUrl}" style="background: #00ffcc; color: #000; padding: 10px 20px; text-decoration: none; font-weight: bold;">ACTIVAR CUENTA</a>
            <br/><br/>
            <p>Este enlace expirará en 24 horas.</p>
          </div>
        `
      });
      if (process.env.NODE_ENV === 'development') {
        console.log(`[IAM] Activation email sent for tenant ${tenantId}`);
      }
    } catch (error) {
      console.error('[IAM] Error sending activation email:', error);
      // In development, we don't fail if Resend is not configured, just log
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Failed to send activation email');
      }
    }
  }
}

export const inviteService = new InviteService();
