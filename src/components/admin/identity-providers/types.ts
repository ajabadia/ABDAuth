/**
 * @purpose Gestiona tipos y interfaces de TypeScript para proveedores de identidad en la aplicación ABDAuth.
 * @purpose_en Defines TypeScript types/interfaces for identity providers in the ABDAuth application.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:3,imports:1,sig:l1c4tr
 * @lastUpdated 2026-06-21T14:24:55.864Z
 */

import type { IdentityProvider } from '@/lib/schemas/identity-provider';

export interface IdentityProviderDisplay extends Omit<IdentityProvider, '_id' | 'createdAt' | 'updatedAt'> {
  _id: string;
  createdAt: Date;
  updatedAt?: Date;
  clientSecret: string; // masked
}

export interface IdentityProviderFormValues {
  name: string;
  description: string;
  providerType: 'OIDC' | 'SAML';
  active: boolean;
  issuerUrl?: string;
  clientId?: string;
  clientSecret?: string;
  entityId?: string;
  metadataUrl?: string;
  attributeMapping: {
    sub: string;
    email: string;
    name: string;
    surname: string;
    role?: string;
    groups?: string;
  };
  allowedDomains: string[];
  autoProvision: boolean;
  defaultTenantId?: string;
}

export interface IdentityProviderTranslations {
  title: string;
  subtitle: string;
  add_provider: string;
  new_provider: string;
  edit_provider: string;
  delete_confirm: string;
  no_providers: string;
  oidc_label: string;
  saml_label: string;
  active: string;
  inactive: string;
  form: {
    name: string;
    description: string;
    provider_type: string;
    active: string;
    issuer_url: string;
    client_id: string;
    client_secret: string;
    entity_id: string;
    metadata_url: string;
    attribute_mapping: string;
    allowed_domains: string;
    auto_provision: string;
    default_tenant: string;
    save: string;
    cancel: string;
    placeholder_name: string;
    placeholder_description: string;
    placeholder_issuer: string;
    placeholder_entity_id: string;
    placeholder_metadata_url: string;
    placeholder_client_id: string;
    placeholder_client_secret: string;
    placeholder_domain: string;
  };
  cards: {
    oidc: string;
    saml: string;
    client_credentials: string;
    authorized_domains: string;
    issuer: string;
    entity_id: string;
  };
}
