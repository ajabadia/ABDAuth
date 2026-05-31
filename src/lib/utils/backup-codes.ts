import * as argon2 from 'argon2';

/**
 * 🔑 Generates 8 unique alphanumeric backup codes (10 characters each)
 */
export function generateBackupCodes(): string[] {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => {
    return Array.from({ length: 10 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  });
}

/**
 * 🔒 Hashes a list of raw backup codes asynchronously using bcrypt
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return await Promise.all(
    codes.map(code => argon2.hash(code))
  );
}
