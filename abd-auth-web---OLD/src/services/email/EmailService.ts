import { getResend } from '@/lib/resend-client';
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
    const resend = getResend();
    const html = getPasswordResetHtml(userName, resetUrl);

    await resend.emails.send({
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
    const resend = getResend();
    const html = getVerificationEmailHtml(userName, verificationUrl);

    await resend.emails.send({
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
    const resend = getResend();
    const html = getSecurityAlertHtml(userName, event, details);

    await resend.emails.send({
      from: this.FROM,
      to,
      subject: `🛡️ Alerta: ${event} - ABDAuth`,
      html,
    });
  }
}
