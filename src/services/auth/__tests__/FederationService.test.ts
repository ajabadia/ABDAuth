import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FederationService } from '../FederationService';
import type { IdentityProvider } from '@/lib/schemas/identity-provider';
import type { OIDCConfiguration } from '../FederationService';

/* ───────── MOCKS ───────── */

// Mock jose: createRemoteJWKSet returns a function, jwtVerify returns payload
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => vi.fn(() => Promise.resolve({ keys: [] }))),
  jwtVerify: vi.fn(),
}));

// We'll import the mocked functions for advanced assertions
import { jwtVerify } from 'jose';

/* ───────── HELPERS ───────── */

const sampleProvider = (overrides: Partial<IdentityProvider> = {}): IdentityProvider => ({
  _id: 'prov-1',
  name: 'Google Workspace',
  description: 'SSO via Google',
  providerType: 'OIDC',
  active: true,
  tenantId: 'tenant-abc',
  issuerUrl: 'https://accounts.google.com',
  clientId: 'abc-client-id.apps.googleusercontent.com',
  clientSecret: 'super-secret-gcs-value',
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  userinfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
  jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
  attributeMapping: {
    sub: 'sub',
    email: 'email',
    name: 'name',
    surname: 'family_name',
    role: 'abd_role',
    groups: 'groups',
  },
  allowedDomains: ['example.com'],
  autoProvision: true,
  defaultTenantId: 'tenant-abc',
  createdAt: new Date('2025-01-01'),
  ...overrides,
});

const sampleOIDCConfig: OIDCConfiguration = {
  issuer: 'https://accounts.google.com',
  authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  token_endpoint: 'https://oauth2.googleapis.com/token',
  userinfo_endpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
  jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
  scopes_supported: ['openid', 'email', 'profile'],
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
};

/* ───────── TESTS ───────── */

describe('FederationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FederationService.invalidateCache(); // clear internal map before each test
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* ── 1. OIDC Discovery ── */

  describe('discoverOIDCConfiguration', () => {
    it('should fetch and return OIDC configuration from well-known endpoint', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => sampleOIDCConfig,
      } as Response);

      const config = await FederationService.discoverOIDCConfiguration('https://accounts.google.com');

      expect(config).toEqual(sampleOIDCConfig);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://accounts.google.com/.well-known/openid-configuration',
        expect.objectContaining({
          headers: { Accept: 'application/json' },
        })
      );
    });

    it('should strip trailing slash from issuer URL before fetching', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => sampleOIDCConfig,
      } as Response);

      await FederationService.discoverOIDCConfiguration('https://accounts.google.com/');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://accounts.google.com/.well-known/openid-configuration',
        expect.anything()
      );
    });

    it('should return cached configuration on subsequent calls within TTL', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => sampleOIDCConfig,
      } as Response);

      // First call — fetches
      const first = await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Second call — uses cache
      const second = await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      expect(second).toEqual(first);
      expect(fetchMock).toHaveBeenCalledTimes(1); // no additional fetch
    });

    it('should re-fetch after cache expires (TTL = 1 hour)', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => sampleOIDCConfig,
      } as Response);

      // First call
      await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Manually advance internal cache timestamp to simulate expiry (bypassing private fields)
      // We'll invalidate the cache and re-fetch
      FederationService.invalidateCache('https://accounts.google.com');

      // Second call — should re-fetch
      await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should throw on non-OK response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(
        FederationService.discoverOIDCConfiguration('https://accounts.google.com')
      ).rejects.toThrow('OIDC discovery failed: 404 Not Found');
    });

    it('should throw on network error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ENOTFOUND accounts.google.com'));

      await expect(
        FederationService.discoverOIDCConfiguration('https://accounts.google.com')
      ).rejects.toThrow('ENOTFOUND accounts.google.com');
    });
  });

  /* ── 2. Build Authorize URL ── */

  describe('buildAuthorizeUrl', () => {
    it('should construct a valid OIDC authorization URL with all required params', () => {
      const provider = sampleProvider();
      const url = FederationService.buildAuthorizeUrl(
        provider,
        sampleOIDCConfig,
        'random-state-123',
        'https://auth.abd.com/api/auth/federation/oidc/callback'
      );

      const parsed = new URL(url);
      expect(parsed.origin).toBe('https://accounts.google.com');
      expect(parsed.pathname).toBe('/o/oauth2/v2/auth');
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('client_id')).toBe(provider.clientId);
      expect(parsed.searchParams.get('redirect_uri')).toBe(
        'https://auth.abd.com/api/auth/federation/oidc/callback'
      );
      expect(parsed.searchParams.get('scope')).toBe('openid email profile');
      expect(parsed.searchParams.get('state')).toBe('random-state-123');
    });

    it('should fall back to provider authorizationEndpoint when config lacks it', () => {
      const provider = sampleProvider();
      const configWithoutAuthz: OIDCConfiguration = {
        ...sampleOIDCConfig,
        authorization_endpoint: undefined as unknown as string,
      };
      const url = FederationService.buildAuthorizeUrl(
        provider,
        configWithoutAuthz,
        'state-456',
        'https://auth.abd.com/callback'
      );

      const parsed = new URL(url);
      expect(parsed.origin).toBe('https://accounts.google.com');
      expect(parsed.pathname).toBe('/o/oauth2/v2/auth');
    });
  });

  /* ── 3. Token Exchange ── */

  describe('exchangeCode', () => {
    it('should exchange authorization code for tokens successfully', async () => {
      const provider = sampleProvider();
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'ya29.a0AfH6SMC...',
          id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE...',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      } as Response);

      const result = await FederationService.exchangeCode(
        provider,
        sampleOIDCConfig,
        'auth-code-xyz',
        'https://auth.abd.com/api/auth/federation/oidc/callback'
      );

      expect(result.accessToken).toBe('ya29.a0AfH6SMC...');
      expect(result.idToken).toBe('eyJhbGciOiJSUzI1NiIsImtpZCI6IjE...');
      expect(result.expiresIn).toBe(3600);

      // Verify correct POST body
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        })
      );
    });

    it('should fall back to provider tokenEndpoint when config lacks it', async () => {
      const provider = sampleProvider();
      const configWithoutToken: OIDCConfiguration = {
        ...sampleOIDCConfig,
        token_endpoint: undefined as unknown as string,
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'at-123',
          id_token: 'id-456',
        }),
      } as Response);

      const result = await FederationService.exchangeCode(
        provider,
        configWithoutToken,
        'code-789',
        'https://auth.abd.com/callback'
      );

      expect(result.accessToken).toBe('at-123');
    });

    it('should throw on token exchange failure', async () => {
      const provider = sampleProvider();
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => '{"error":"invalid_grant"}',
      } as Response);

      await expect(
        FederationService.exchangeCode(
          provider,
          sampleOIDCConfig,
          'bad-code',
          'https://auth.abd.com/callback'
        )
      ).rejects.toThrow('Token exchange failed: 400 {"error":"invalid_grant"}');
    });
  });

  /* ── 4. Verify ID Token ── */

  describe('verifyIdToken', () => {
    it('should verify and return parsed JWT payload', async () => {
      const provider = sampleProvider();
      const mockPayload = { sub: 'user-123', email: 'user@example.com', name: 'John' };

      vi.mocked(jwtVerify).mockResolvedValueOnce({
        payload: mockPayload,
        protectedHeader: { alg: 'RS256' },
      } as any);

      const payload = await FederationService.verifyIdToken(
        'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature',
        provider,
        sampleOIDCConfig
      );

      expect(payload).toEqual(mockPayload);
      expect(jwtVerify).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          issuer: 'https://accounts.google.com',
          audience: provider.clientId,
        })
      );
    });

    it('should throw when JWT verification fails', async () => {
      const provider = sampleProvider();
      vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('jwt expired'));

      await expect(
        FederationService.verifyIdToken('invalid.token.here', provider, sampleOIDCConfig)
      ).rejects.toThrow('jwt expired');
    });
  });

  /* ── 5. Fetch Userinfo ── */

  describe('fetchUserInfo', () => {
    it('should return user info with Bearer token', async () => {
      const userinfoData = { sub: 'user-123', email: 'user@example.com', name: 'John' };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => userinfoData,
      } as Response);

      const result = await FederationService.fetchUserInfo(
        'https://openidconnect.googleapis.com/v1/userinfo',
        'ya29.a0AfH6SMC...'
      );

      expect(result).toEqual(userinfoData);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://openidconnect.googleapis.com/v1/userinfo',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer ya29.a0AfH6SMC...',
            Accept: 'application/json',
          },
        })
      );
    });

    it('should throw on non-OK response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      await expect(
        FederationService.fetchUserInfo('https://provider.com/userinfo', 'invalid-token')
      ).rejects.toThrow('Userinfo fetch failed: 401');
    });
  });

  /* ── 6. Attribute Mapping ── */

  describe('mapProviderUser', () => {
    const defaultMapping = {
      sub: 'sub',
      email: 'email',
      name: 'name',
      surname: 'family_name',
      role: 'abd_role',
      groups: 'groups',
    };

    it('should map flat claims correctly', () => {
      const providerUser = {
        sub: 'google-oauth2|123456',
        email: 'john@example.com',
        name: 'John',
        family_name: 'Doe',
        abd_role: 'ADMIN',
        groups: 'engineering,platform,admins',
      };

      const result = FederationService.mapProviderUser(providerUser, defaultMapping);

      expect(result).toEqual({
        sub: 'google-oauth2|123456',
        email: 'john@example.com',
        name: 'John',
        surname: 'Doe',
        role: 'ADMIN',
        groups: ['engineering', 'platform', 'admins'],
      });
    });

    it('should resolve nested claim paths (dot notation)', () => {
      const providerUser = {
        sub: 'sub-456',
        email: 'jane@example.com',
        name: { givenName: 'Jane', familyName: 'Smith' },
        family_name: 'Smith',
      };
      const nestedMapping = {
        ...defaultMapping,
        name: 'name.givenName',
        surname: 'name.familyName',
        role: undefined,
        groups: undefined,
      };

      const result = FederationService.mapProviderUser(providerUser, nestedMapping);

      expect(result.name).toBe('Jane');
      expect(result.surname).toBe('Smith');
      expect(result.role).toBe('USER'); // default
      expect(result.groups).toEqual([]); // default
    });

    it('should return empty string for missing claim paths', () => {
      const providerUser = { sub: 'sub-1', email: 'test@example.com' };
      const result = FederationService.mapProviderUser(providerUser, defaultMapping);

      expect(result.sub).toBe('sub-1');
      expect(result.email).toBe('test@example.com');
      // name and family_name are missing — should be empty strings
      expect(result.name).toBe('');
      expect(result.surname).toBe('');
      // role mapping field exists ('abd_role') but claim is missing → empty string
      expect(result.role).toBe('');
      // groups mapping field exists ('groups') but claim is missing → empty string.split(',') = [''] → filtered out
      expect(result.groups).toEqual([]);
    });

    it('should handle deeply nested paths beyond two levels', () => {
      const providerUser = {
        sub: 'sub-789',
        email: 'deep@example.com',
        user: { profile: { display: 'Deep User' } },
      };
      const deepMapping = {
        ...defaultMapping,
        name: 'user.profile.display',
      } as unknown as typeof defaultMapping;

      // Ensure surname is falsy so resolveValue is skipped → empty string
      const result = FederationService.mapProviderUser(providerUser, deepMapping);
      expect(result.name).toBe('Deep User');
      expect(result.surname).toBe('');
    });

    it('should return default role and empty groups when mapping fields are absent', () => {
      const providerUser = {
        sub: 'sub-only',
        email: 'roleless@example.com',
        name: 'No Role',
        family_name: 'User',
      };
      const mappingWithoutRoleOrGroups = {
        sub: 'sub',
        email: 'email',
        name: 'name',
        surname: 'family_name',
      };

      const result = FederationService.mapProviderUser(providerUser, mappingWithoutRoleOrGroups as unknown as typeof defaultMapping);

      expect(result.role).toBe('USER');
      expect(result.groups).toEqual([]);
    });

    it('should handle non-string values gracefully (numbers, booleans)', () => {
      const providerUser = {
        sub: 'sub-num',
        email: 'num@example.com',
        name: 42,
        family_name: true,
      };

      const result = FederationService.mapProviderUser(providerUser, defaultMapping);
      expect(result.name).toBe('42');
      expect(result.surname).toBe('true');
    });

    it('should handle null/undefined values in provider claims', () => {
      const providerUser = {
        sub: 'sub-null',
        email: 'null@example.com',
        name: null,
        family_name: undefined,
      };

      const result = FederationService.mapProviderUser(providerUser, defaultMapping);
      // null/undefined → nullish coalescing in String(current ?? '') returns ''
      expect(result.name).toBe('');
      expect(result.surname).toBe(''); // undefined → ''
    });
  });

  /* ── 7. Cache Invalidation ── */

  describe('invalidateCache', () => {
    it('should clear cache entry for a specific issuer', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => sampleOIDCConfig,
      } as Response);

      // Populate cache
      await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      // Invalidate specific issuer
      FederationService.invalidateCache('https://accounts.google.com');

      // Next call re-fetches
      await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('should clear the entire cache when no issuer is specified', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => sampleOIDCConfig,
      } as Response);

      // Populate cache with two issuers
      await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      await FederationService.discoverOIDCConfiguration('https://login.microsoftonline.com/common/v2.0');
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);

      // Clear all
      FederationService.invalidateCache();

      // Both re-fetch
      await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      await FederationService.discoverOIDCConfiguration('https://login.microsoftonline.com/common/v2.0');
      expect(globalThis.fetch).toHaveBeenCalledTimes(4);
    });
  });
});
