import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authorizeUser } from '../actions/authorize-user';

vi.mock('@/i18n/routing', () => ({
  redirect: vi.fn(),
  routing: { locales: ['es', 'en'], defaultLocale: 'es' },
}));

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn(() => Promise.resolve('es')),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

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
      tenantId: 'tenant-1', dbPrefix: 't1_', isolationStrategy: 'COLLECTION_PREFIX',
    })),
  },
}));

vi.mock('@/services/auth/SessionService', () => ({
  SessionService: {
    createSession: vi.fn(() => Promise.resolve('mock-session-id')),
  },
}));

vi.mock('@/lib/get-session', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('argon2', () => ({
  verify: vi.fn(),
  hash: vi.fn(),
}));

describe('authorizeUser grace period logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const credentials = { email: 'user@example.com', password: 'password123' };

  it('should keep grace period active when limits are not reached', async () => {
    const { userRepository } = await import('@/lib/repositories/UserRepository');
    const argon2 = await import('argon2');

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
      mfaGraceExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);
    vi.mocked(argon2.verify).mockResolvedValue(true as any);

    const result = await authorizeUser(credentials);

    expect(result).not.toBeNull();
    expect(result?.mfaGracePeriodActive).toBe(true);
    expect(result?.mfaGraceLoginsRemaining).toBe(3);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('should deactivate grace period when mfaGraceExpiresAt is in the past', async () => {
    const { userRepository } = await import('@/lib/repositories/UserRepository');
    const argon2 = await import('argon2');

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
      mfaGraceExpiresAt: new Date(Date.now() - 1000),
    };

    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);
    vi.mocked(argon2.verify).mockResolvedValue(true as any);

    const result = await authorizeUser(credentials);

    expect(result).not.toBeNull();
    expect(result?.mfaGracePeriodActive).toBe(false);
    expect(userRepository.update).toHaveBeenCalledWith('user-id-123', expect.objectContaining({
      mfaGracePeriodActive: false,
    }));
  });

  it('should deactivate grace period when mfaGraceLoginsRemaining is 0', async () => {
    const { userRepository } = await import('@/lib/repositories/UserRepository');
    const argon2 = await import('argon2');

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

    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);
    vi.mocked(argon2.verify).mockResolvedValue(true as any);

    const result = await authorizeUser(credentials);

    expect(result).not.toBeNull();
    expect(result?.mfaGracePeriodActive).toBe(false);
    expect(userRepository.update).toHaveBeenCalledWith('user-id-123', expect.objectContaining({
      mfaGracePeriodActive: false,
    }));
  });
});
