import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FederationService } from '../FederationService';
import type { IdentityProvider } from '@/lib/schemas/identity-provider';
import type { OIDCConfiguration } from '../FederationService';

/* ───────── HELPERS ───────── */

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

describe('FederationService.discovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FederationService.invalidateCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
        expect.objectContaining({ headers: { Accept: 'application/json' } })
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

      const first = await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const second = await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      expect(second).toEqual(first);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should re-fetch after cache expiry', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => sampleOIDCConfig,
      } as Response);

      await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      FederationService.invalidateCache('https://accounts.google.com');
      await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should throw on non-OK response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false, status: 404, statusText: 'Not Found',
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

  describe('invalidateCache', () => {
    it('should clear cache entry for a specific issuer', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => sampleOIDCConfig,
      } as Response);

      await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      FederationService.invalidateCache('https://accounts.google.com');
      await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('should clear entire cache when no issuer specified', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => sampleOIDCConfig,
      } as Response);

      await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      await FederationService.discoverOIDCConfiguration('https://login.microsoftonline.com/common/v2.0');
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);

      FederationService.invalidateCache();
      await FederationService.discoverOIDCConfiguration('https://accounts.google.com');
      await FederationService.discoverOIDCConfiguration('https://login.microsoftonline.com/common/v2.0');
      expect(globalThis.fetch).toHaveBeenCalledTimes(4);
    });
  });
});
