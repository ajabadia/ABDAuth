import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SsoService } from '../SsoService';
import { userRepository } from '@/lib/repositories/UserRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { auditAuthOpsRepository } from '@/lib/repositories/AuditAuthOpsRepository';

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

describe('SsoService.performSsoHandshake - Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultParams = {
    appId: 'quiz-app', tenantId: 'tenant-1', userId: 'user-123',
    userEmail: 'user@example.com', userName: 'John', userSurname: 'Doe',
    redirectUri: 'https://quiz.abd.com/api/auth/federated/callback',
    ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0',
  };

  it('should return USER_NOT_FOUND when user does not exist', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(null);
    const result = await SsoService.performSsoHandshake(defaultParams);
    expect(result).toEqual({ success: false, errorType: 'USER_NOT_FOUND' });
  });

  it('should return UNAUTHORIZED_TENANT_ACCESS when user not member of tenant', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      _id: 'user-123', email: 'user@example.com', role: 'USER', tenantId: 'different-tenant', tenantIds: [], tenants: [],
    } as any);
    const result = await SsoService.performSsoHandshake(defaultParams);
    expect(result).toEqual({ success: false, errorType: 'UNAUTHORIZED_TENANT_ACCESS' });
    expect(auditAuthOpsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SSO_HANDSHAKE_DENIED' })
    );
  });

  it('should return TENANT_INACTIVE when tenant is inactive', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      _id: 'user-123', email: 'user@example.com', role: 'USER', tenantId: 'tenant-1',
    } as any);
    vi.mocked(tenantRepository.findByTenantId).mockResolvedValue(null);
    const result = await SsoService.performSsoHandshake(defaultParams);
    expect(result).toEqual({ success: false, errorType: 'TENANT_INACTIVE' });
  });

  it('should return APPLICATION_NOT_LICENSED when tenant does not license app', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      _id: 'user-123', email: 'user@example.com', role: 'USER', tenantId: 'tenant-1',
    } as any);
    vi.mocked(tenantRepository.findByTenantId).mockResolvedValue({
      tenantId: 'tenant-1', active: true, dbPrefix: 't1_', allowedApps: ['other-app'],
    } as any);
    const result = await SsoService.performSsoHandshake(defaultParams);
    expect(result).toEqual({ success: false, errorType: 'APPLICATION_NOT_LICENSED' });
  });

  it('should return APPLICATION_INACTIVE when app not found', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      _id: 'user-123', email: 'user@example.com', role: 'USER', tenantId: 'tenant-1',
    } as any);
    vi.mocked(tenantRepository.findByTenantId).mockResolvedValue({
      tenantId: 'tenant-1', active: true, dbPrefix: 't1_', allowedApps: ['quiz-app'],
    } as any);
    vi.mocked(applicationRepository.findOne).mockResolvedValue(null);
    const result = await SsoService.performSsoHandshake(defaultParams);
    expect(result).toEqual({ success: false, errorType: 'APPLICATION_INACTIVE' });
  });

  it('should return APPLICATION_NOT_LICENSED when user not licensed for app', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      _id: 'user-123', email: 'user@example.com', role: 'USER', tenantId: 'tenant-1',
      tenants: [{ tenantId: 'tenant-1', role: 'USER', allowedApps: ['other-app'] }],
    } as any);
    vi.mocked(tenantRepository.findByTenantId).mockResolvedValue({
      tenantId: 'tenant-1', active: true, dbPrefix: 't1_', allowedApps: ['quiz-app'],
    } as any);
    vi.mocked(applicationRepository.findOne).mockResolvedValue({ slug: 'quiz-app', active: true } as any);
    const result = await SsoService.performSsoHandshake(defaultParams);
    expect(result).toEqual({ success: false, errorType: 'APPLICATION_NOT_LICENSED' });
  });
});
