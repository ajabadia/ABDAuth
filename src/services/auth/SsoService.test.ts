import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SsoService } from './SsoService';
import { userRepository } from '@/lib/repositories/UserRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { auditAuthOpsRepository } from '@/lib/repositories/AuditAuthOpsRepository';
import { jwtVerify } from 'jose';

// Mock the repositories
vi.mock('@/lib/repositories/UserRepository', () => ({
  userRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/TenantRepository', () => ({
  tenantRepository: {
    findByTenantId: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/ApplicationRepository', () => ({
  applicationRepository: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/AuditAuthOpsRepository', () => ({
  auditAuthOpsRepository: {
    create: vi.fn(),
  },
}));

describe('SsoService.performSsoHandshake', () => {
  const secretKey = 'abd-auth-industrial-fallback-secret-2026';
  const encoderSecret = new TextEncoder().encode(secretKey);

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_JWT_SECRET = secretKey;
  });

  const defaultParams = {
    appId: 'quiz-app',
    tenantId: 'tenant-1',
    userId: 'user-123',
    userEmail: 'user@example.com',
    userName: 'John',
    userSurname: 'Doe',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
  };

  it('should return USER_NOT_FOUND when user does not exist', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(null);

    const result = await SsoService.performSsoHandshake(defaultParams);

    expect(result).toEqual({ success: false, errorType: 'USER_NOT_FOUND' });
    expect(userRepository.findById).toHaveBeenCalledWith('user-123');
  });

  it('should return UNAUTHORIZED_TENANT_ACCESS when user is not member of target tenant', async () => {
    const mockUser = {
      _id: 'user-123',
      email: 'user@example.com',
      role: 'USER',
      tenantId: 'different-tenant',
      tenantIds: [],
      tenants: [],
    };
    vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);

    const result = await SsoService.performSsoHandshake(defaultParams);

    expect(result).toEqual({ success: false, errorType: 'UNAUTHORIZED_TENANT_ACCESS' });
    expect(auditAuthOpsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SSO_HANDSHAKE_DENIED',
        changedFields: { appId: 'quiz-app', reason: 'UNAUTHORIZED_TENANT_ACCESS' },
      })
    );
  });

  it('should return TENANT_INACTIVE when tenant is inactive or missing dbPrefix', async () => {
    const mockUser = {
      _id: 'user-123',
      email: 'user@example.com',
      role: 'USER',
      tenantId: 'tenant-1',
    };
    vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);
    vi.mocked(tenantRepository.findByTenantId).mockResolvedValue(null); // Tenant not found

    const result = await SsoService.performSsoHandshake(defaultParams);

    expect(result).toEqual({ success: false, errorType: 'TENANT_INACTIVE' });
    expect(tenantRepository.findByTenantId).toHaveBeenCalledWith('tenant-1');
  });

  it('should return APPLICATION_NOT_LICENSED when tenant allowedApps does not include appId', async () => {
    const mockUser = {
      _id: 'user-123',
      email: 'user@example.com',
      role: 'USER',
      tenantId: 'tenant-1',
    };
    const mockTenant = {
      tenantId: 'tenant-1',
      active: true,
      dbPrefix: 't1_',
      allowedApps: ['other-app'], // quiz-app is not licensed
    };
    vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);
    vi.mocked(tenantRepository.findByTenantId).mockResolvedValue(mockTenant as any);

    const result = await SsoService.performSsoHandshake(defaultParams);

    expect(result).toEqual({ success: false, errorType: 'APPLICATION_NOT_LICENSED' });
  });

  it('should return APPLICATION_INACTIVE when application is inactive or not found', async () => {
    const mockUser = {
      _id: 'user-123',
      email: 'user@example.com',
      role: 'USER',
      tenantId: 'tenant-1',
    };
    const mockTenant = {
      tenantId: 'tenant-1',
      active: true,
      dbPrefix: 't1_',
      allowedApps: ['quiz-app'],
    };
    vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);
    vi.mocked(tenantRepository.findByTenantId).mockResolvedValue(mockTenant as any);
    vi.mocked(applicationRepository.findOne).mockResolvedValue(null); // App not found

    const result = await SsoService.performSsoHandshake(defaultParams);

    expect(result).toEqual({ success: false, errorType: 'APPLICATION_INACTIVE' });
  });

  it('should return APPLICATION_NOT_LICENSED when normal user is not licensed for app', async () => {
    const mockUser = {
      _id: 'user-123',
      email: 'user@example.com',
      role: 'USER',
      tenantId: 'tenant-1',
      tenants: [
        {
          tenantId: 'tenant-1',
          role: 'USER',
          allowedApps: ['other-app'], // User not licensed for quiz-app
        },
      ],
    };
    const mockTenant = {
      tenantId: 'tenant-1',
      active: true,
      dbPrefix: 't1_',
      allowedApps: ['quiz-app'],
    };
    const mockApp = {
      slug: 'quiz-app',
      active: true,
    };
    vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);
    vi.mocked(tenantRepository.findByTenantId).mockResolvedValue(mockTenant as any);
    vi.mocked(applicationRepository.findOne).mockResolvedValue(mockApp as any);

    const result = await SsoService.performSsoHandshake(defaultParams);

    expect(result).toEqual({ success: false, errorType: 'APPLICATION_NOT_LICENSED' });
  });

  it('should succeed, sign JWT, build redirectUrl, and audit on successful validation', async () => {
    const mockUser = {
      _id: 'user-123',
      email: 'user@example.com',
      role: 'USER',
      tenantId: 'tenant-1',
      tenants: [
        {
          tenantId: 'tenant-1',
          role: 'USER',
          allowedApps: ['quiz-app'],
        },
      ],
    };
    const mockTenant = {
      tenantId: 'tenant-1',
      active: true,
      dbPrefix: 't1_',
      isolationStrategy: 'COLLECTION_PREFIX',
      allowedApps: ['quiz-app'],
    };
    const mockApp = {
      slug: 'quiz-app',
      active: true,
      urlPattern: 'https://{tenant}.quiz.abd.com/sso-login',
    };

    vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);
    vi.mocked(tenantRepository.findByTenantId).mockResolvedValue(mockTenant as any);
    vi.mocked(applicationRepository.findOne).mockResolvedValue(mockApp as any);

    const result = await SsoService.performSsoHandshake(defaultParams);

    expect(result.success).toBe(true);
    expect(result.redirectUrl).toBeDefined();

    // Verify redirectUrl structure
    const url = new URL(result.redirectUrl!);
    expect(url.origin).toBe('https://tenant-1.quiz.abd.com');
    expect(url.pathname).toBe('/sso-login');

    const token = url.searchParams.get('token');
    expect(token).toBeDefined();

    // Verify JWT payload
    const { payload } = await jwtVerify(token!, encoderSecret);
    expect(payload).toEqual(
      expect.objectContaining({
        sub: 'user-123',
        email: 'user@example.com',
        name: 'John',
        surname: 'Doe',
        tenantId: 'tenant-1',
        role: 'USER',
        dbPrefix: 't1_',
        isolationStrategy: 'COLLECTION_PREFIX',
        allowedApps: ['quiz-app'],
      })
    );

    // Verify audit log
    expect(auditAuthOpsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        action: 'SSO_HANDSHAKE_GRANTED',
        userId: 'user-123',
        changedFields: {
          appId: 'quiz-app',
          destinationUrl: 'https://tenant-1.quiz.abd.com/sso-login',
        },
      })
    );
  });
});
