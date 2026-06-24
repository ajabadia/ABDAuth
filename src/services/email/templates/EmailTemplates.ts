/**
 * @purpose Gestiona plantillas HTML para diversas notificaciones de correo electrónico dentro de la aplicación ABDAuth, incluyendo correos electrónicos de restablecimiento de contraseña y alertas de seguridad.
 * @purpose_en Generates HTML templates for various email notifications within the ABDAuth application, including password reset and security alert emails.
 * @refactorable true (contains multiple distinct functions)
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:3,imports:0,sig:1tcbezp
 * @lastUpdated 2026-06-23T23:00:56.951Z
 */

/**
 * 🧱 Base Email Layout Wrapper
 * Implements standard styling, footer telemetries, and SOC2 signatures to maintain DRY.
 */
function getBaseTemplate(title: string, bodyHtml: string, containerStyleExtra = ''): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; ${containerStyleExtra}">
      <div style="margin-bottom: 24px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.1em;">
          ${title}
        </h2>
        <p style="color: #64748b; font-size: 12px; margin: 4px 0;">SISTEMA_CERTIFICADO_V1.0</p>
      </div>
      
      ${bodyHtml}
      
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
      
      <p style="color: #94a3b8; font-size: 10px; text-align: center;">
        ABD Industrial Ecosystem © 2026<br />
        SOC2_TYPE_II_CERTIFIED_INFRASTRUCTURE
      </p>
    </div>
  `;
}

/**
 * 🔑 Send Password Reset Link Template
 */
export function getPasswordResetHtml(userName: string, resetUrl: string): string {
  const body = `
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
  `;
  return getBaseTemplate('Recuperación de Identidad Industrial', body);
}

/**
 * 📧 Send Account Activation / Verification Email Template
 */
export function getVerificationEmailHtml(userName: string, verificationUrl: string): string {
  const body = `
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
  `;
  return getBaseTemplate('Activación de Identidad Industrial', body);
}

/**
 * 🛡️ Send Security Alert Email Template (Critical Events)
 */
export function getSecurityAlertHtml(userName: string, event: string, details?: string): string {
  const body = `
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
  `;
  return getBaseTemplate('Alerta de Seguridad Industrial', body, 'border-top: 4px solid #ef4444;');
}
