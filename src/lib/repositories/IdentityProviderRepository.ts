import { BaseRepository, type SafeFilter } from './BaseRepository';
import type { IdentityProvider } from '@/lib/schemas/identity-provider';

/**
 * 🔐 IdentityProviderRepository
 * Persistence for external OIDC/SAML identity provider configurations.
 */
class IdentityProviderRepository extends BaseRepository<IdentityProvider> {
  constructor() {
    super('identity_providers', 'AUTH');
  }

  /**
   * Find all active providers
   */
  async findActive(): Promise<IdentityProvider[]> {
    return await this.list({ active: true } as SafeFilter<IdentityProvider>);
  }

  /**
   * Find providers by type
   */
  async findByType(type: 'OIDC' | 'SAML'): Promise<IdentityProvider[]> {
    return await this.list({ providerType: type, active: true } as SafeFilter<IdentityProvider>);
  }

  /**
   * Find provider by issuer URL (OIDC) or entity ID (SAML)
   */
  async findByIssuer(issuer: string): Promise<IdentityProvider | null> {
    return await this.findOne({
      $or: [
        { issuerUrl: issuer },
        { entityId: issuer },
      ],
    } as SafeFilter<IdentityProvider>);
  }
}

export const identityProviderRepository = new IdentityProviderRepository();
