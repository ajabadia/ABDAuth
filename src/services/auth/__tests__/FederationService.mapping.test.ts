import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FederationService } from '../FederationService';
import type { IdentityProvider } from '@/lib/schemas/identity-provider';

/* ───────── HELPERS ───────── */

const defaultMapping = {
  sub: 'sub', email: 'email', name: 'name', surname: 'family_name', role: 'abd_role', groups: 'groups',
};

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
  attributeMapping: defaultMapping,
  allowedDomains: ['example.com'],
  autoProvision: true,
  defaultTenantId: 'tenant-abc',
  createdAt: new Date('2025-01-01'),
  ...overrides,
});

/* ───────── TESTS ───────── */

describe('FederationService.mapping', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  describe('mapProviderUser', () => {
    it('should map flat claims correctly', () => {
      const providerUser = { sub: 'google-oauth2|123456', email: 'john@example.com', name: 'John', family_name: 'Doe', abd_role: 'ADMIN', groups: 'engineering,platform,admins' };
      const result = FederationService.mapProviderUser(providerUser, defaultMapping);
      expect(result).toEqual({
        sub: 'google-oauth2|123456', email: 'john@example.com', name: 'John', surname: 'Doe', role: 'ADMIN',
        groups: ['engineering', 'platform', 'admins'],
      });
    });

    it('should resolve nested claim paths (dot notation)', () => {
      const providerUser = { sub: 'sub-456', email: 'jane@example.com', name: { givenName: 'Jane', familyName: 'Smith' }, family_name: 'Smith' };
      const nestedMapping = { ...defaultMapping, name: 'name.givenName', surname: 'name.familyName', role: undefined, groups: undefined };
      const result = FederationService.mapProviderUser(providerUser, nestedMapping);
      expect(result.name).toBe('Jane');
      expect(result.surname).toBe('Smith');
      expect(result.role).toBe('USER');
      expect(result.groups).toEqual([]);
    });

    it('should return empty string for missing claim paths', () => {
      const providerUser = { sub: 'sub-1', email: 'test@example.com' };
      const result = FederationService.mapProviderUser(providerUser, defaultMapping);
      expect(result.sub).toBe('sub-1');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('');
      expect(result.surname).toBe('');
      expect(result.role).toBe('');
      expect(result.groups).toEqual([]);
    });

    it('should handle deeply nested paths beyond two levels', () => {
      const providerUser = { sub: 'sub-789', email: 'deep@example.com', user: { profile: { display: 'Deep User' } } };
      const deepMapping = { ...defaultMapping, name: 'user.profile.display' };
      const result = FederationService.mapProviderUser(providerUser, deepMapping);
      expect(result.name).toBe('Deep User');
      expect(result.surname).toBe('');
    });

    it('should return default role and empty groups when mapping fields absent', () => {
      const providerUser = { sub: 'sub-only', email: 'roleless@example.com', name: 'No Role', family_name: 'User' };
      const mappingMinimal = { sub: 'sub', email: 'email', name: 'name', surname: 'family_name' };
      const result = FederationService.mapProviderUser(providerUser, mappingMinimal);
      expect(result.role).toBe('USER');
      expect(result.groups).toEqual([]);
    });

    it('should handle non-string values gracefully (numbers, booleans)', () => {
      const result = FederationService.mapProviderUser(
        { sub: 'sub-num', email: 'num@example.com', name: 42, family_name: true }, defaultMapping
      );
      expect(result.name).toBe('42');
      expect(result.surname).toBe('true');
    });

    it('should handle null/undefined values in provider claims', () => {
      const result = FederationService.mapProviderUser(
        { sub: 'sub-null', email: 'null@example.com', name: null, family_name: undefined }, defaultMapping
      );
      expect(result.name).toBe('');
      expect(result.surname).toBe('');
    });
  });
});
