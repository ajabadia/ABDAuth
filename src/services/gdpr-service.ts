/**
 * @purpose Gestiona el exportación de datos del usuario de acuerdo con las regulaciones de GDPR, incluyendo perfil de usuario, sesiones, cuentas, claves de acceso, configuración de MFA y tokens de reinicio.
 * @purpose_en Manages the export of user data in accordance with GDPR regulations, including user profile, sessions, accounts, passkeys, MFA config, and reset tokens.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:2,sig:1q5lgax
 * @lastUpdated 2026-06-26T06:16:54.652Z
 */

import JSZip from 'jszip';
import { mongoClientPromise } from '@/lib/mongodb';

export class GDPRService {
  static async exportUserData(userId: string, tenantId: string, email?: string): Promise<Uint8Array> {
    const client = await mongoClientPromise;
    const db = client.db(process.env.MONGODB_AUTH_DB || 'ABDElevators-Auth');

    const data: Record<string, unknown> = {
      userId,
      tenantId,
      exportedAt: new Date().toISOString(),
    };

    // 1. User profile
    const user = await db.collection('users').findOne({ _id: userId as any });
    if (user) {
      const { password, ...safeUser } = user as any;
      data.user = safeUser;
    }

    // 2. Sessions for this user
    const sessions = await db.collection('sessions').find({ userId }).toArray();
    data.sessions = sessions;

    // 3. Accounts (social logins)
    const accounts = await db.collection('accounts').find({ userId }).toArray();
    data.accounts = accounts;

    // 4. Passkeys (metadata only)
    const passkeys = await db.collection('passkeys').find({ userId }).toArray();
    data.passkeys = passkeys.map((p: Record<string, unknown>) => {
      const { credentialID, publicKey, ...meta } = p as any;
      return { ...meta, credentialID: '[REDACTED]', publicKey: '[REDACTED]' };
    });

    // 5. MFA config
    const mfaConfig = await db.collection('mfa_configs').findOne({ userId });
    if (mfaConfig) {
      const { secret, backupCodes, ...safeMfa } = mfaConfig as any;
      data.mfaConfig = { ...safeMfa, secret: '[REDACTED]', backupCodes: backupCodes ? `[${backupCodes.length} codes redacted]` : undefined };
    }

    // 6. Reset tokens
    const resetTokens = await db.collection('reset_tokens').find({ userId }).toArray();
    data.resetTokens = resetTokens.map((t: Record<string, unknown>) => {
      const { token, ...meta } = t as any;
      return { ...meta, token: '[REDACTED]' };
    });

    const zip = new JSZip();
    zip.file('user_data.json', JSON.stringify(data, null, 2));
    zip.file('README.txt', [
      'ABDAuth GDPR Data Export',
      '==============================================',
      `User ID: ${userId}`,
      `Tenant ID: ${tenantId}`,
      `Export Date: ${new Date().toISOString()}`,
      '',
      'Contents:',
      '- user_data.json: profile, sessions, accounts, passkeys, MFA config.',
      '',
      'Sensitive fields (passwords, secrets, backup codes) are redacted.',
      'This file contains your personal data as stored in the ABDAuth system.',
    ].join('\n'));

    return await zip.generateAsync({ type: 'uint8array' });
  }
}
