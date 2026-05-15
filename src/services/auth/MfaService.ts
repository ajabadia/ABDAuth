import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import { type EntityId } from '@/lib/schemas/common';
import { mfaRepository } from '@/lib/repositories/MfaRepository';
import { userRepository } from '@/lib/repositories/UserRepository';
import type { MfaConfig } from '@/lib/schemas/auth';

/**
 * 🔐 MfaService
 * Multi-Factor Authentication Management (TOTP).
 * Uses otplib v13 functional API. Zero-Noise Purity Policy.
 */
export class MfaService {
  static async setup(email: string): Promise<{ secret: string; qrCode: string }> {
    const secret = generateSecret();
    const otpauth = generateURI({
      issuer: 'ABD Auth Central',
      label: email,
      secret,
    });

    const qrCode = await QRCode.toDataURL(otpauth);
    return { secret, qrCode };
  }

  static async enable(
    userId: EntityId,
    secret: string,
    token: string,
  ): Promise<{ success: boolean; recoveryCodes: string[] }> {
    const result = verifySync({ secret, token });
    const isValid = result.valid;

    if (!isValid) {
      return { success: false, recoveryCodes: [] };
    }

    const rawCodes = Array.from({ length: 8 }, () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 10; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    });

    const hashedCodes = await Promise.all(rawCodes.map(code => bcrypt.hash(code, 10)));

    const mfaUpdate: Partial<MfaConfig> = {
      userId,
      active: true,
      secret,
      backupCodes: hashedCodes,
      updatedAt: new Date(),
    };

    await mfaRepository.update(userId, mfaUpdate, undefined, { upsert: true });
    await userRepository.update(userId, { mfaEnabled: true });

    return { success: true, recoveryCodes: rawCodes };
  }

  static async verifyToken(userId: EntityId, token: string): Promise<boolean> {
    const config = await mfaRepository.findByUserId(userId);

    if (!config || !config.active) {
      return true;
    }

    if (!token || !/^\d{6,8}$/.test(token)) {
      return false;
    }

    const result = verifySync({ secret: config.secret, token });
    return result.valid;
  }

  static async disable(userId: EntityId): Promise<void> {
    await mfaRepository.softDelete(userId);
    await userRepository.update(userId, { mfaEnabled: false });
  }
}
