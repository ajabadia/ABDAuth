import { AppError } from '@/lib/errors';
import * as crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM

/**
 * SecurityService: Handles field-level encryption for sensitive data.
 * Ported from ABDAgRAG Industrial Stack.
 */
export class SecurityService {
  private static encryptionKey: Buffer;

  private static getEncryptionKey(): Buffer {
    if (!this.encryptionKey) {
      const secret = process.env.ENCRYPTION_SECRET;
      if (!secret) {
        if (process.env.NODE_ENV === 'production') {
          throw new AppError('ENCRYPTION_SECRET is missing', 'INTERNAL_ERROR', 500);
        }
        // Fallback for dev (32 bytes)
        this.encryptionKey = crypto.scryptSync('dev-secret-key-abd-auth-2026', 'salt', 32);
      } else {
        this.encryptionKey = crypto.scryptSync(secret, 'abd-salt', 32);
      }
    }
    return this.encryptionKey;
  }

  /**
   * Encrypts a string.
   */
  public static encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, this.getEncryptionKey(), iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag().toString('hex');

      return `${iv.toString('hex')}:${encrypted}:${authTag}`;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown encryption error';
      throw new AppError(`Encryption failed: ${message}`, 'INTERNAL_ERROR', 500);
    }
  }

  /**
   * Decrypts an encrypted string.
   */
  public static decrypt(encryptedData: string): string {
    try {
      const [ivHex, encryptedHex, authTagHex] = encryptedData.split(':');

      if (!ivHex || !encryptedHex || !authTagHex) {
        return encryptedData; // Not encrypted
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, this.getEncryptionKey(), iv);

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: unknown) {
      const _message = error instanceof Error ? error.message : 'Unknown decryption error';
      // Decryption failed. Silence is industrial.
      return '[ERROR_DECRYPTING]';
    }
  }

  /**
   * Determines if a field should be encrypted.
   */
  public static shouldEncryptField(fieldName: string): boolean {
    const sensitiveFields = ['password', 'secret', 'iban', 'dni', 'privatephone', 'customkey'];
    return sensitiveFields.includes(fieldName.toLowerCase());
  }
}
