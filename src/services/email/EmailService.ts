import { ResendEmailService } from '@ajabadia/satellite-sdk';
import {
  getPasswordResetHtml,
  getVerificationEmailHtml,
  getSecurityAlertHtml,
} from './templates/EmailTemplates';

/**
 * 📧 ABDAuth Industrial Email Service
 * Orchestrates all identity-related outgoing communications.
 */
export class EmailService {
  private static readonly FROM = process.env.RESEND_FROM_EMAIL || 'ABDAuth <noreply@abdauth.com>';

  /**
   * 🔑 Send Password Reset Link
   */
  static async sendPasswordReset(params: {
    to: string;
    userName: string;
    resetUrl: string;
  }): Promise<void> {
    const { to, userName, resetUrl } = params;
    const html = getPasswordResetHtml(userName, resetUrl);

    await ResendEmailService.sendEmail({
      from: this.FROM,
      to,
      subject: '🔑 Restablecer Contraseña - ABDAuth',
      html,
    });
  }

  /**
   * 📧 Send Account Activation / Verification Email
   */
  static async sendVerificationEmail(params: {
    to: string;
    userName: string;
    verificationUrl: string;
  }): Promise<void> {
    const { to, userName, verificationUrl } = params;
    const html = getVerificationEmailHtml(userName, verificationUrl);

    await ResendEmailService.sendEmail({
      from: this.FROM,
      to,
      subject: '🛡️ Activación de Cuenta - ABDAuth',
      html,
    });
  }

  /**
   * 🛡️ Send Security Alert Email (Critical Events)
   */
  static async sendSecurityAlert(params: {
    to: string;
    userName: string;
    event: string;
    details?: string;
  }): Promise<void> {
    const { to, userName, event, details } = params;
    const html = getSecurityAlertHtml(userName, event, details);

    await ResendEmailService.sendEmail({
      from: this.FROM,
      to,
      subject: `🛡️ Alerta: ${event} - ABDAuth`,
      html,
    });
  }
}
