import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FederationService } from '../FederationService';
import type { IdentityProvider } from '@/lib/schemas/identity-provider';
import type { OIDCConfiguration } from '../FederationService';

// Mock jose for ID token verification
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => vi.fn(() => Promise.resolve({ keys: [] }))),
  jwtVerify: vi.fn(),
}));

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
  attributeMapping: { sub: 'sub', email: 'email', name: 'name', surname: 'family_name', role: 'abd_role', groups: 'groups' },
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

describe('FederationService.verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FederationService.invalidateCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyIdToken', () => {
    it('should verify and return parsed JWT payload', async () => {
      const provider = sampleProvider();
      const mockPayload = { sub: 'user-123', email: 'user@example.com', name: 'John' };
      vi.mocked(jwtVerify).mockResolvedValueOnce({
        payload: mockPayload, protectedHeader: { alg: 'RS256' },
      } as any);

      const payload = await FederationService.verifyIdToken(
        'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature',
        provider, sampleOIDCConfig
      );

      expect(payload).toEqual(mockPayload);
      expect(jwtVerify).toHaveBeenCalledWith(
        expect.any(String), expect.any(Function),
        expect.objectContaining({ issuer: 'https://accounts.google.com', audience: provider.clientId })
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

  describe('fetchUserInfo', () => {
    it('should return user info with Bearer token', async () => {
      const userinfoData = { sub: 'user-123', email: 'user@example.com', name: 'John' };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true, json: async () => userinfoData,
      } as Response);

      const result = await FederationService.fetchUserInfo(
        'https://openidconnect.googleapis.com/v1/userinfo', 'ya29.a0AfH6SMC...'
      );

      expect(result).toEqual(userinfoData);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://openidconnect.googleapis.com/v1/userinfo',
        expect.objectContaining({ headers: { Authorization: 'Bearer ya29.a0AfH6SMC...', Accept: 'application/json' } })
      );
    });

    it('should throw on non-OK response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 401 } as Response);
      await expect(
        FederationService.fetchUserInfo('https://provider.com/userinfo', 'invalid-token')
      ).rejects.toThrow('Userinfo fetch failed: 401');
    });
  });
});
