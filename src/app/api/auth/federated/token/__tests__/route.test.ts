import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';

// ── Module-level mocks (vi.hoisted ensures variables accessible in vi.mock factories) ──

const mockFindByClientId = vi.hoisted(() => vi.fn());
const mockFindOne = vi.hoisted(() => vi.fn());
const mockMarkAsUsed = vi.hoisted(() => vi.fn());
const mockFindByIdUser = vi.hoisted(() => vi.fn());
const mockFindByTenantId = vi.hoisted(() => vi.fn());
const mockGenerateToken = vi.hoisted(() => vi.fn());

vi.mock('@/lib/repositories/ApplicationRepository', () => ({
  applicationRepository: {
    findByClientId: mockFindByClientId,
  },
}));

vi.mock('@/lib/repositories/FederatedCodeRepository', () => ({
  federatedCodeRepository: {
    findOne: mockFindOne,
    markAsUsed: mockMarkAsUsed,
  },
}));

vi.mock('@/lib/repositories/UserRepository', () => ({
  userRepository: {
    findById: mockFindByIdUser,
  },
}));

vi.mock('@/lib/repositories/TenantRepository', () => ({
  tenantRepository: {
    findByTenantId: mockFindByTenantId,
  },
}));

vi.mock('@/services/auth/SsoService', () => ({
  SsoService: {
    generateToken: mockGenerateToken,
  },
}));

// ── Test Helpers ────────────────────────────────────────────────────

const VALID_BODY = {
  code: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
  client_id: 'client-123',
  client_secret: 'secret-456',
  redirect_uri: 'https://quiz.abd.com/api/auth/federated/callback',
};

const MOCK_APP = {
  _id: 'app-1',
  clientId: 'client-123',
  clientSecret: 'secret-456',
  active: true,
  slug: 'quiz-app',
};

const MOCK_USER = {
  _id: 'user-1',
  email: 'admin@quiz.com',
  name: 'Admin',
  surname: 'User',
  role: 'ADMIN',
  tenantId: 'tenant-1',
  tenants: [{ tenantId: 'tenant-1', role: 'ADMIN', allowedApps: ['quiz-app'] }],
};

const MOCK_TENANT = {
  tenantId: 'tenant-1',
  active: true,
  dbPrefix: 't1_',
  isolationStrategy: 'COLLECTION_PREFIX',
  allowedApps: ['quiz-app'],
  branding: { logo: 'https://cdn.example.com/logo.png' },
};

const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token';

function buildUsedCode(usedAt: Date) {
  return {
    _id: 'code-1',
    code: VALID_BODY.code,
    clientId: 'client-123',
    userId: 'user-1',
    redirectUri: VALID_BODY.redirect_uri,
    expiresAt: new Date(Date.now() + 60_000),
    used: true,
    usedAt,
    sessionId: 'session-1',
  };
}

function buildFreshCode() {
  return {
    _id: 'code-1',
    code: VALID_BODY.code,
    clientId: 'client-123',
    userId: 'user-1',
    redirectUri: VALID_BODY.redirect_uri,
    expiresAt: new Date(Date.now() + 60_000),
    used: false,
    sessionId: 'session-1',
  };
}

function buildRequest(body: Record<string, unknown> = VALID_BODY): Request {
  return new Request('https://auth.abd.com/api/auth/federated/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockHappyPath(code: Record<string, unknown> = buildFreshCode()) {
  mockFindByClientId.mockResolvedValue(MOCK_APP);
  mockFindOne.mockResolvedValue(code);
  mockFindByIdUser.mockResolvedValue(MOCK_USER);
  mockFindByTenantId.mockResolvedValue(MOCK_TENANT);
  mockGenerateToken.mockResolvedValue(MOCK_TOKEN);
}

// ── Grace Period Tests ──────────────────────────────────────────────

describe('POST /api/auth/federated/token — Grace Period (15s)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow exchange when code was used 5 seconds ago (within grace period)', async () => {
    const usedAt = new Date(Date.now() - 5_000); // 5 seconds ago
    mockHappyPath(buildUsedCode(usedAt));

    const res = await POST(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.token).toBe(MOCK_TOKEN);
    expect(body.user.email).toBe('admin@quiz.com');

    // markAsUsed is still called (idempotent update — used: true, usedAt: now)
    expect(mockMarkAsUsed).toHaveBeenCalledWith('code-1');
  });

  it('should allow exchange when code was used 1 second ago (network retry edge)', async () => {
    const usedAt = new Date(Date.now() - 1_000); // 1 second ago
    mockHappyPath(buildUsedCode(usedAt));

    const res = await POST(buildRequest());

    expect(res.status).toBe(200);
    expect((await res.json()).token).toBe(MOCK_TOKEN);
    expect(mockMarkAsUsed).toHaveBeenCalledWith('code-1');
  });

  it('should reject exchange when code was used 30 seconds ago (outside grace period)', async () => {
    const usedAt = new Date(Date.now() - 30_000); // 30 seconds ago
    mockHappyPath(buildUsedCode(usedAt));

    const res = await POST(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Code already used');
    expect(body.token).toBeUndefined();
  });

  it('should reject exchange when code was used exactly 15 seconds ago (edge of grace window)', async () => {
    const usedAt = new Date(Date.now() - 15_000); // exactly 15 seconds ago
    mockHappyPath(buildUsedCode(usedAt));

    const res = await POST(buildRequest());
    const body = await res.json();

    // The check is `Date.now() - usedTime < gracePeriodMs` (strict less than)
    // 15000 - 15000 = 0, which is NOT < 15000 → should reject
    expect(res.status).toBe(400);
    expect(body.error).toBe('Code already used');
  });

  it('should reject exchange when usedAt is undefined (missing timestamp)', async () => {
    const code = {
      _id: 'code-1',
      code: VALID_BODY.code,
      clientId: 'client-123',
      userId: 'user-1',
      redirectUri: VALID_BODY.redirect_uri,
      expiresAt: new Date(Date.now() + 60_000),
      used: true,
      // usedAt is intentionally missing
    };
    mockHappyPath(code);

    const res = await POST(buildRequest());
    const body = await res.json();

    // usedAt is undefined → usedTime = 0 → 0 > 0 is false → wasUsedRecently = false
    expect(res.status).toBe(400);
    expect(body.error).toBe('Code already used');
  });

  it('should work normally when code has never been used', async () => {
    mockHappyPath(buildFreshCode());

    const res = await POST(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.token).toBe(MOCK_TOKEN);
    expect(body.user.email).toBe('admin@quiz.com');

    // Should have called markAsUsed since code was never used
    expect(mockMarkAsUsed).toHaveBeenCalledWith('code-1');
  });
});

// ── Standard Validation Tests ───────────────────────────────────────

describe('POST /api/auth/federated/token — Validation', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for invalid request body (missing fields)', async () => {
    const res = await POST(buildRequest({ code: 'short' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid parameters');
  });

  it('should return 401 for invalid client credentials', async () => {
    mockFindByClientId.mockResolvedValue(null);

    const res = await POST(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Invalid client credentials');
  });

  it('should return 400 when code is not found', async () => {
    mockFindByClientId.mockResolvedValue(MOCK_APP);
    mockFindOne.mockResolvedValue(null);

    const res = await POST(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Code not found');
  });

  it('should return 400 for client ID mismatch', async () => {
    mockFindByClientId.mockResolvedValue(MOCK_APP);
    mockFindOne.mockResolvedValue({
      ...buildFreshCode(),
      clientId: 'different-client',
    });

    const res = await POST(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Client ID mismatch');
  });

  it('should return 400 for redirect URI mismatch', async () => {
    mockFindByClientId.mockResolvedValue(MOCK_APP);
    mockFindOne.mockResolvedValue({
      ...buildFreshCode(),
      redirectUri: 'https://evil.com/callback',
    });

    const res = await POST(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Redirect URI mismatch');
  });

  it('should return 400 for expired code', async () => {
    mockFindByClientId.mockResolvedValue(MOCK_APP);
    mockFindOne.mockResolvedValue({
      ...buildFreshCode(),
      expiresAt: new Date(Date.now() - 60_000), // expired 1 minute ago
    });

    const res = await POST(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Code expired');
  });

  it('should return 404 when user is not found after code validation', async () => {
    mockFindByClientId.mockResolvedValue(MOCK_APP);
    mockFindOne.mockResolvedValue(buildFreshCode());
    mockFindByIdUser.mockResolvedValue(null);

    const res = await POST(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('User not found');
  });

  it('should return 500 on unexpected errors', async () => {
    mockFindByClientId.mockRejectedValue(new Error('DB connection lost'));

    const res = await POST(buildRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Identity exchange failed');
    expect(body.code).toBe('FEDERATION_ERROR');
  });
});
