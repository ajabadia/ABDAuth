import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import { mfaRepository } from '@/lib/repositories/MfaRepository';
import { userRepository } from '@/lib/repositories/UserRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import type { EntityId } from '@/lib/schemas/common';

/**
 * 🔒 MfaService
 * Industrial engine for Multi-Factor Authentication (TOTP).
 * Ported and refined from ABDAgRAG to otplib v13 functional API.
 */
export class MfaService {
  static async setup(userId: string, email: string): Promise<{ secret: string, qrCode: string }> {
    const secret = generateSecret();
    const otpauth = generateURI({
      secret,
      label: email || 'industrial-user',
      issuer: 'ABD Auth Industrial'
    });

    if (!otpauth) {
      throw new Error('🛡️ MFA Engine failed to generate OTP Auth URI.');
    }

    try {
      const qrCode = await QRCode.toDataURL(otpauth);
      return { secret, qrCode };
    } catch (err: unknown) {
      throw new Error(`🛡️ QR Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * 🔓 Enable MFA after verifying the first token
   */
  static async enable(userId: string, secret: string, token: string): Promise<{ success: boolean, backupCodes: string[] }> {
    // 1. Verify the initial token with a 30s tolerance (equivalent to window 1)
    const result = await verify({ 
      token, 
      secret,
      epochTolerance: 30 
    });

    if (!result.valid) {
      return { success: false, backupCodes: [] };
    }

    // 2. Generate 8 backup codes (10 chars each)
    const rawBackupCodes = Array.from({ length: 8 }, () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      return Array.from({ length: 10 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    });

    const hashedBackupCodes = await Promise.all(
      rawBackupCodes.map(code => bcrypt.hash(code, 10))
    );

    // 3. Persist MFA Config
    await mfaRepository.enable(userId, {
      userId,
      secret,
      backupCodes: hashedBackupCodes,
      active: true
    });

    // 4. Update User Profile
    await userRepository.updateMfaStatus(userId, true);

    // 5. Audit the event
    const user = await userRepository.findById(userId);
    await auditRepository.create({
      timestamp: new Date(),
      event: 'MFA_ENABLED',
      actorId: userId,
      actorEmail: user?.email,
      tenantId: user?.tenantId || 'SYSTEM',
      status: 'SUCCESS'
    });

    return { success: true, backupCodes: rawBackupCodes };
  }

  /**
   * 🔍 Verify an MFA token during login (TOTP or Recovery Code)
   */
  static async verifyToken(userId: string, token: string): Promise<boolean> {
    const config = await mfaRepository.findByUserId(userId as EntityId);
    
    if (!config || !config.active) {
      const user = await userRepository.findById(userId);
      if (user?.mfaEnabled) return false;
      return true;
    }

    // 1. Try TOTP Verification (Standard 6 digits)
    if (token.length === 6 && /^\d+$/.test(token)) {
      const result = await verify({ 
        token, 
        secret: config.secret,
        epochTolerance: 30 
      });

      if (result.valid) {
        await this.logSuccess(userId, 'TOTP');
        return true;
      }
    }

    // 2. Try Backup Codes Verification (Usually 10 chars)
    const backupCodes = config.backupCodes || [];
    for (let i = 0; i < backupCodes.length; i++) {
      const matches = await bcrypt.compare(token.toUpperCase(), backupCodes[i]);
      if (matches) {
        // Remove used code
        const updatedCodes = backupCodes.filter((_, index) => index !== i);
        await mfaRepository.updateBackupCodes(userId, updatedCodes);
        
        await this.logSuccess(userId, 'BACKUP_CODE');
        return true;
      }
    }

    return false;
  }

  private static async logSuccess(userId: string, method: string) {
    const user = await userRepository.findById(userId);
    await auditRepository.create({
      timestamp: new Date(),
      event: 'MFA_VERIFY_SUCCESS',
      actorId: userId,
      actorEmail: user?.email,
      tenantId: user?.tenantId || 'SYSTEM',
      status: 'SUCCESS',
      metadata: { method }
    });
  }

  /**
   * 🔒 Disable MFA
   */
  static async disable(userId: string): Promise<void> {
    await mfaRepository.disable(userId);
    await userRepository.updateMfaStatus(userId, false);

    const user = await userRepository.findById(userId);
    await auditRepository.create({
      timestamp: new Date(),
      event: 'MFA_DISABLED',
      actorId: userId,
      actorEmail: user?.email,
      tenantId: user?.tenantId || 'SYSTEM',
      status: 'SUCCESS'
    });
  }

  /**
   * ✅ Check if MFA is required for a user
   */
  static async isRequired(userId: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    return !!user?.mfaEnabled;
  }
}
