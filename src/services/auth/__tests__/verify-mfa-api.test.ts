import { describe, it, expect } from 'vitest';
import { auth } from '@/lib/auth';

describe('Better Auth API check', () => {
  it('should expose MFA APIs on auth.api', () => {
    console.log('Available auth.api keys:', Object.keys(auth.api));
    expect(auth.api.verifyTOTP).toBeDefined();
    expect(auth.api.verifyBackupCode).toBeDefined();
  });
});
