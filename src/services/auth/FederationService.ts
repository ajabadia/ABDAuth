/**
 * @purpose Gestiona la integración de proveedores de identidad OIDC/SAML externos, manejando la descubierta de configuraciones, creando URLs de autorización y mapeando datos de usuario.
 * @purpose_en Manages external OIDC/SAML identity provider integration, handling discovery of configurations, building authorization URLs, and mapping user data.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:3,sig:hnbqte
 * @lastUpdated 2026-06-23T22:45:12.699Z
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import { identityProviderRepository } from '@/lib/repositories/IdentityProviderRepository';
import type { IdentityProvider } from '@/lib/schemas/identity-provider';

/**
 * 🌐 FederationService
 * Handles external OIDC/SAML identity provider integration.
 * ABDAuth acts as the Relying Party / Service Provider.
 */
export class FederationService {
  /**
   * 🔍 Discover OIDC configuration from issuer's well-known endpoint.
   * Caches the result for 1 hour.
   */
  private static oidcConfigCache = new Map<string, { config: OIDCConfiguration; fetchedAt: number }>();

  static async discoverOIDCConfiguration(issuerUrl: string): Promise<OIDCConfiguration> {
    const cached = this.oidcConfigCache.get(issuerUrl);
    if (cached && Date.now() - cached.fetchedAt < 3600_000) {
      return cached.config;
    }

    const wellKnownUrl = `${issuerUrl.replace(/\/$/, '')}/.well-known/openid-configuration`;
    const response = await fetch(wellKnownUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`OIDC discovery failed: ${response.status} ${response.statusText}`);
    }

    const config = await response.json() as OIDCConfiguration;
    this.oidcConfigCache.set(issuerUrl, { config, fetchedAt: Date.now() });
    return config;
  }

  /**
   * 🔗 Build OIDC Authorization URL for redirect.
   */
  static buildAuthorizeUrl(
    provider: IdentityProvider,
    config: OIDCConfiguration,
    state: string,
    callbackUrl: string
  ): string {
    const authUrl = new URL(config.authorization_endpoint || provider.authorizationEndpoint!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', provider.clientId!);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    return authUrl.toString();
  }

  /**
   * 🎫 Exchange authorization code for tokens via OIDC token endpoint.
   */
  static async exchangeCode(
    provider: IdentityProvider,
    config: OIDCConfiguration,
    code: string,
    callbackUrl: string
  ): Promise<{ accessToken: string; idToken: string; expiresIn?: number }> {
    const tokenUrl = config.token_endpoint || provider.tokenEndpoint!;
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl,
      client_id: provider.clientId!,
      client_secret: provider.clientSecret!,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: params.toString(),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Token exchange failed: ${response.status} ${body}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      idToken: data.id_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * ✅ Verify ID Token (JWT) using provider's JWKS.
   */
  static async verifyIdToken(idToken: string, provider: IdentityProvider, config: OIDCConfiguration): Promise<Record<string, unknown>> {
    const jwksUri = config.jwks_uri || provider.jwksUri!;
    const JWKS = createRemoteJWKSet(new URL(jwksUri));

    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: config.issuer || provider.issuerUrl,
      audience: provider.clientId,
    });

    return payload as Record<string, unknown>;
  }

  /**
   * 👤 Fetch userinfo from OIDC userinfo endpoint.
   */
  static async fetchUserInfo(userinfoEndpoint: string, accessToken: string): Promise<Record<string, unknown>> {
    const response = await fetch(userinfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Userinfo fetch failed: ${response.status}`);
    }

    return await response.json() as Record<string, unknown>;
  }

  /**
   * 🗺️ Map external provider claims to ABD user fields using attribute mapping.
   */
  static mapProviderUser(
    providerUser: Record<string, unknown>,
    mapping: IdentityProvider['attributeMapping']
  ): FederatedUser {
    function resolveValue(obj: Record<string, unknown>, path: string): string {
      const parts = path.split('.');
      let current: unknown = obj;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
          current = (current as Record<string, unknown>)[part];
        } else {
          return '';
        }
      }
      return String(current ?? '');
    }

    return {
      sub: resolveValue(providerUser, mapping.sub),
      email: resolveValue(providerUser, mapping.email),
      name: resolveValue(providerUser, mapping.name),
      surname: mapping.surname ? resolveValue(providerUser, mapping.surname) : '',
      role: mapping.role ? resolveValue(providerUser, mapping.role) : 'USER',
      groups: mapping.groups ? resolveValue(providerUser, mapping.groups).split(',').filter(Boolean) : [],
    };
  }

  /**
   * 🔄 Invalidate OIDC config cache for a provider
   */
  static invalidateCache(issuerUrl?: string): void {
    if (issuerUrl) {
      this.oidcConfigCache.delete(issuerUrl);
    } else {
      this.oidcConfigCache.clear();
    }
  }
}

export interface OIDCConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
  grant_types_supported?: string[];
  [key: string]: unknown;
}

export interface FederatedUser {
  sub: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  groups: string[];
}
