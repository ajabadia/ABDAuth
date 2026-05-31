import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SsoService } from '../SsoService';
import { userRepository } from '@/lib/repositories/UserRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { auditAuthOpsRepository } from '@/lib/repositories/AuditAuthOpsRepository';
import { federatedCodeRepository } from '@/lib/repositories/FederatedCodeRepository';

vi.mock('@/lib/repositories/UserRepository', () => ({
  userRepository: { findById: vi.fn() },
}));

vi.mock('@/lib/repositories/TenantRepository', () => ({
  tenantRepository: { findByTenantId: vi.fn() },
}));

vi.mock('@/lib/repositories/ApplicationRepository', () => ({
  applicationRepository: { findOne: vi.fn() },
}));

vi.mock('@/lib/repositories/AuditAuthOpsRepository', () => ({
  auditAuthOpsRepository: { create: vi.fn() },
}));

vi.mock('@/lib/repositories/FederatedCodeRepository', () => ({
  federatedCodeRepository: { create: vi.fn().mockResolvedValue({ _id: 'code-id' }) },
}));

describe('SsoService.performSsoHandshake - Authorization Code Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultParams = {
    appId: 'quiz-app', tenantId: 'tenant-1', userId: 'user-123',
    userEmail: 'user@example.com', userName: 'John', userSurname: 'Doe',
    redirectUri: 'https://quiz.abd.com/api/auth/federated/callback',
    ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0',
  };

  it('should succeed, generate auth code, build redirectUrl with code, and audit', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      _id: 'user-123', email: 'user@example.com', role: 'USER', tenantId: 'tenant-1',
      tenants: [{ tenantId: 'tenant-1', role: 'USER', allowedApps: ['quiz-app'] }],
    } as any);
    vi.mocked(tenantRepository.findByTenantId).mockResolvedValue({
      tenantId: 'tenant-1', active: true, dbPrefix: 't1_', isolationStrategy: 'COLLECTION_PREFIX', allowedApps: ['quiz-app'],
    } as any);
    vi.mocked(applicationRepository.findOne).mockResolvedValue({
      slug: 'quiz-app', active: true, clientId: 'client-123',
    } as any);

    const result = await SsoService.performSsoHandshake(defaultParams);

    expect(result.success).toBe(true);
    expect(result.redirectUrl).toBeDefined();

    const url = new URL(result.redirectUrl!);
    expect(url.origin).toBe('https://quiz.abd.com');
    expect(url.pathname).toBe('/api/auth/federated/callback');

    // Verify code is in URL instead of direct JWT token
    const code = url.searchParams.get('code');
    expect(code).toBeDefined();
    expect(code!.length).toBe(48); // 24 bytes hex = 48 chars
    expect(url.searchParams.get('token')).toBeNull();

    // Verify state is set
    expect(url.searchParams.get('state')).toBe('/');

    // Verify auth code was persisted in repository
    expect(federatedCodeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client-123',
        userId: 'user-123',
        redirectUri: 'https://quiz.abd.com/api/auth/federated/callback',
        used: false,
      })
    );

    // Verify audit
    expect(auditAuthOpsRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-1', action: 'SSO_HANDSHAKE_GRANTED',
    }));
  });
});
