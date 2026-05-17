import { getResend } from '@/lib/resend-client';

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

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <div style="margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.1em;">
            Recuperación de Identidad Industrial
          </h2>
          <p style="color: #64748b; font-size: 12px; margin: 4px 0;">SISTEMA_CERTIFICADO_V1.0</p>
        </div>
        
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Hola <strong>${userName}</strong>,
        </p>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Se ha solicitado un restablecimiento de contraseña para tu cuenta en el ecosistema ABD. Si no has sido tú, puedes ignorar este correo de forma segura.
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${resetUrl}" style="background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Restablecer Contraseña
          </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
          Este enlace expirará en 1 hora por motivos de seguridad industrial.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
        
        <p style="color: #94a3b8; font-size: 10px; text-align: center;">
          ABD Industrial Ecosystem © 2026<br />
          SOC2_TYPE_II_CERTIFIED_INFRASTRUCTURE
        </p>
      </div>
    `;

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

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <div style="margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.1em;">
            Activación de Identidad Industrial
          </h2>
          <p style="color: #64748b; font-size: 12px; margin: 4px 0;">SISTEMA_CERTIFICADO_V1.0</p>
        </div>
        
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Hola <strong>${userName}</strong>,
        </p>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Se ha creado una nueva identidad para ti en el ecosistema ABD. Para activar tu cuenta y establecer tus credenciales de acceso, haz clic en el siguiente botón:
        </p>
        
        <div style="margin: 32px 0;">
          <a href="${verificationUrl}" style="background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Activar Cuenta
          </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
          Este protocolo es obligatorio para cumplir con los estándares de seguridad SOC2 del ecosistema.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
        
        <p style="color: #94a3b8; font-size: 10px; text-align: center;">
          ABD Industrial Ecosystem © 2026<br />
          SOC2_TYPE_II_CERTIFIED_INFRASTRUCTURE
        </p>
      </div>
    `;

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

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; border-top: 4px solid #ef4444;">
        <div style="margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.1em;">
            Alerta de Seguridad Industrial
          </h2>
          <p style="color: #64748b; font-size: 12px; margin: 4px 0;">SISTEMA_CERTIFICADO_V1.0</p>
        </div>
        
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Hola <strong>${userName}</strong>,
        </p>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Se ha detectado un evento crítico de seguridad en tu cuenta:
        </p>
        
        <div style="margin: 24px 0; padding: 16px; background: #f8fafc; border-left: 4px solid #0f172a; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #0f172a;">${event}</p>
          ${details ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">${details}</p>` : ''}
        </div>
        
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Si no has realizado esta acción, te recomendamos cambiar tu contraseña inmediatamente y contactar con el administrador de tu organización.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
        
        <p style="color: #94a3b8; font-size: 10px; text-align: center;">
          ABD Industrial Ecosystem © 2026<br />
          SOC2_TYPE_II_CERTIFIED_INFRASTRUCTURE
        </p>
      </div>
    `;

    await resend.emails.send({
      from: this.FROM,
      to,
      subject: `🛡️ Alerta: ${event} - ABDAuth`,
      html,
    });
  }
}
