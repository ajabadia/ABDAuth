import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FederationService } from '../FederationService';
import type { IdentityProvider } from '@/lib/schemas/identity-provider';
import type { OIDCConfiguration } from '../FederationService';

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

describe('FederationService.authz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FederationService.invalidateCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildAuthorizeUrl', () => {
    it('should construct valid OIDC authorization URL with all required params', () => {
      const provider = sampleProvider();
      const url = FederationService.buildAuthorizeUrl(
        provider, sampleOIDCConfig, 'random-state-123',
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
      const configNoAuthz: OIDCConfiguration = { ...sampleOIDCConfig, authorization_endpoint: undefined as unknown as string };
      const url = FederationService.buildAuthorizeUrl(provider, configNoAuthz, 'state-456', 'https://auth.abd.com/callback');
      const parsed = new URL(url);
      expect(parsed.origin).toBe('https://accounts.google.com');
      expect(parsed.pathname).toBe('/o/oauth2/v2/auth');
    });
  });

  describe('exchangeCode', () => {
    it('should exchange authorization code for tokens successfully', async () => {
      const provider = sampleProvider();
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'ya29.a0AfH6SMC...', id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE...', expires_in: 3600, token_type: 'Bearer' }),
      } as Response);

      const result = await FederationService.exchangeCode(provider, sampleOIDCConfig, 'auth-code-xyz', 'https://auth.abd.com/callback');
      expect(result.accessToken).toBe('ya29.a0AfH6SMC...');
      expect(result.idToken).toBe('eyJhbGciOiJSUzI1NiIsImtpZCI6IjE...');
      expect(result.expiresIn).toBe(3600);
      expect(globalThis.fetch).toHaveBeenCalledWith('https://oauth2.googleapis.com/token', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      }));
    });

    it('should fall back to provider tokenEndpoint when config lacks it', async () => {
      const provider = sampleProvider();
      const configNoToken: OIDCConfiguration = { ...sampleOIDCConfig, token_endpoint: undefined as unknown as string };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true, json: async () => ({ access_token: 'at-123', id_token: 'id-456' }),
      } as Response);

      const result = await FederationService.exchangeCode(provider, configNoToken, 'code-789', 'https://auth.abd.com/callback');
      expect(result.accessToken).toBe('at-123');
    });

    it('should throw on token exchange failure', async () => {
      const provider = sampleProvider();
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false, status: 400, text: async () => '{"error":"invalid_grant"}',
      } as Response);

      await expect(
        FederationService.exchangeCode(provider, sampleOIDCConfig, 'bad-code', 'https://auth.abd.com/callback')
      ).rejects.toThrow('Token exchange failed: 400 {"error":"invalid_grant"}');
    });
  });
});
