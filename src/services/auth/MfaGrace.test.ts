import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authorizeUser } from './actions/authorize-user';

// Mock routing, cache, and localization to prevent ESM module resolution errors in Node
vi.mock('@/i18n/routing', () => ({
  redirect: vi.fn(),
  routing: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
  },
}));

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn(() => Promise.resolve('es')),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { skipMfaGraceAction } from './actions/mfa-actions';
import { userRepository } from '@/lib/repositories/UserRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { auth, unstable_update } from '@/auth';
import bcrypt from 'bcryptjs';

// Mock repositories and external dependencies
vi.mock('@/lib/repositories/UserRepository', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/AuditRepository', () => ({
  auditRepository: {
    create: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/TenantRepository', () => ({
  tenantRepository: {
    findByTenantId: vi.fn(() => Promise.resolve({
      tenantId: 'tenant-1',
      dbPrefix: 't1_',
      isolationStrategy: 'COLLECTION_PREFIX',
    })),
  },
}));

vi.mock('@/services/auth/SessionService', () => ({
  SessionService: {
    createSession: vi.fn(() => Promise.resolve('mock-session-id')),
  },
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
  unstable_update: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

describe('MFA Grace Period Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authorizeUser grace period logic', () => {
    const credentials = { email: 'user@example.com', password: 'password123' };

    it('should keep grace period active when limits are not reached', async () => {
      const mockUser = {
        _id: 'user-id-123',
        email: 'user@example.com',
        password: 'hashed-password',
        role: 'USER',
        tenantId: 'tenant-1',
        active: true,
        loginAttempts: 0,
        mfaEnabled: false,
        mfaEnforced: true,
        mfaGracePeriodActive: true,
        mfaGraceLoginsRemaining: 3,
        mfaGraceExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as unknown as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as unknown as any);

      const result = await authorizeUser(credentials);

      expect(result).not.toBeNull();
      expect(result?.mfaGracePeriodActive).toBe(true);
      expect(result?.mfaGraceLoginsRemaining).toBe(3);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should deactivate grace period when mfaGraceExpiresAt is in the past', async () => {
      const mockUser = {
        _id: 'user-id-123',
        email: 'user@example.com',
        password: 'hashed-password',
        role: 'USER',
        tenantId: 'tenant-1',
        active: true,
        loginAttempts: 0,
        mfaEnabled: false,
        mfaEnforced: true,
        mfaGracePeriodActive: true,
        mfaGraceLoginsRemaining: 3,
        mfaGraceExpiresAt: new Date(Date.now() - 1000), // 1s ago (expired)
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as unknown as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as unknown as any);

      const result = await authorizeUser(credentials);

      expect(result).not.toBeNull();
      expect(result?.mfaGracePeriodActive).toBe(false);
      expect(userRepository.update).toHaveBeenCalledWith('user-id-123', expect.objectContaining({
        mfaGracePeriodActive: false,
      }));
    });

    it('should deactivate grace period when mfaGraceLoginsRemaining is 0', async () => {
      const mockUser = {
        _id: 'user-id-123',
        email: 'user@example.com',
        password: 'hashed-password',
        role: 'USER',
        tenantId: 'tenant-1',
        active: true,
        loginAttempts: 0,
        mfaEnabled: false,
        mfaEnforced: true,
        mfaGracePeriodActive: true,
        mfaGraceLoginsRemaining: 0,
        mfaGraceExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as unknown as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as unknown as any);

      const result = await authorizeUser(credentials);

      expect(result).not.toBeNull();
      expect(result?.mfaGracePeriodActive).toBe(false);
      expect(userRepository.update).toHaveBeenCalledWith('user-id-123', expect.objectContaining({
        mfaGracePeriodActive: false,
      }));
    });
  });

  describe('skipMfaGraceAction server action', () => {
    it('should decrement logins count and update session', async () => {
      const mockSession = {
        user: {
          id: 'user-id-123',
          email: 'user@example.com',
          role: 'USER',
          tenantId: 'tenant-1',
          mfaGracePeriodActive: true,
          mfaGraceLoginsRemaining: 3,
        },
      };

      const mockDbUser = {
        _id: 'user-id-123',
        mfaGracePeriodActive: true,
        mfaGraceLoginsRemaining: 3,
      };

      vi.mocked(auth).mockResolvedValue(mockSession as unknown as any);
      vi.mocked(userRepository.findById).mockResolvedValue(mockDbUser as unknown as any);

      const result = await skipMfaGraceAction();

      expect(result.success).toBe(true);
      expect(result.remainingLogins).toBe(2);
      expect(userRepository.update).toHaveBeenCalledWith('user-id-123', expect.objectContaining({
        mfaGraceLoginsRemaining: 2,
        mfaGracePeriodActive: true,
      }));
      expect(unstable_update).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({
          mfaGraceBypassed: true,
          mfaGraceLoginsRemaining: 2,
          mfaGracePeriodActive: true,
        }),
      }));
      expect(auditRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        event: 'MFA_GRACE_BYPASS',
        metadata: { remainingLogins: 2 },
      }));
    });

    it('should disable grace period when remaining count becomes 0', async () => {
      const mockSession = {
        user: {
          id: 'user-id-123',
          email: 'user@example.com',
          role: 'USER',
          tenantId: 'tenant-1',
          mfaGracePeriodActive: true,
          mfaGraceLoginsRemaining: 1,
        },
      };

      const mockDbUser = {
        _id: 'user-id-123',
        mfaGracePeriodActive: true,
        mfaGraceLoginsRemaining: 1,
      };

      vi.mocked(auth).mockResolvedValue(mockSession as unknown as any);
      vi.mocked(userRepository.findById).mockResolvedValue(mockDbUser as unknown as any);

      const result = await skipMfaGraceAction();

      expect(result.success).toBe(true);
      expect(result.remainingLogins).toBe(0);
      expect(userRepository.update).toHaveBeenCalledWith('user-id-123', expect.objectContaining({
        mfaGraceLoginsRemaining: 0,
        mfaGracePeriodActive: false,
      }));
    });
  });
});
