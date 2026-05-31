import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('@/lib/get-session', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('argon2', () => ({
  verify: vi.fn(),
  hash: vi.fn(),
}));

describe('skipMfaGraceAction server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should decrement logins count and update session', async () => {
    const { getServerSession } = await import('@/lib/get-session');
    const { userRepository } = await import('@/lib/repositories/UserRepository');
    const { auditRepository } = await import('@/lib/repositories/AuditRepository');
    const { skipMfaGraceAction } = await import('../actions/mfa-actions');

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

    vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
    vi.mocked(userRepository.findById).mockResolvedValue(mockDbUser as any);

    const result = await skipMfaGraceAction();

    expect(result.success).toBe(true);
    expect(result.remainingLogins).toBe(2);
    expect(userRepository.update).toHaveBeenCalledWith('user-id-123', expect.objectContaining({
      mfaGraceLoginsRemaining: 2,
      mfaGracePeriodActive: true,
    }));
    expect(auditRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      event: 'MFA_GRACE_BYPASS',
      metadata: { remainingLogins: 2 },
    }));
  });

  it('should disable grace period when remaining count becomes 0', async () => {
    const { getServerSession } = await import('@/lib/get-session');
    const { userRepository } = await import('@/lib/repositories/UserRepository');
    const { auditRepository } = await import('@/lib/repositories/AuditRepository');
    const { skipMfaGraceAction } = await import('../actions/mfa-actions');

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

    vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
    vi.mocked(userRepository.findById).mockResolvedValue(mockDbUser as any);

    const result = await skipMfaGraceAction();

    expect(result.success).toBe(true);
    expect(result.remainingLogins).toBe(0);
    expect(userRepository.update).toHaveBeenCalledWith('user-id-123', expect.objectContaining({
      mfaGraceLoginsRemaining: 0,
      mfaGracePeriodActive: false,
    }));
  });
});
