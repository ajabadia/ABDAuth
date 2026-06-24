/**
 * @purpose Gestiona identificadores de proveedores de identidad con traducciones y datos iniciales.
 * @purpose_en Renders a page for managing identity providers with translations and initial data.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:1iok2oe
 * @lastUpdated 2026-06-21T10:21:26.014Z
 */

import { getTranslations } from 'next-intl/server';
import { IdentityProviderManagementContainer } from '@/components/admin/identity-providers/IdentityProviderManagementContainer';
import { identityProviderRepository } from '@/lib/repositories/IdentityProviderRepository';
import type { IdentityProviderDisplay, IdentityProviderTranslations } from '@/components/admin/identity-providers/types';

export default async function IdentityProvidersPage() {
  const t = await getTranslations('dashboard.identity_providers');
  const d = await getTranslations('dashboard');

  const providers = await identityProviderRepository.list();

  // Serialize for client consumption
  const initialProviders: IdentityProviderDisplay[] = providers.map(p => ({
    ...p,
    _id: p._id?.toString() || '',
    clientSecret: p.clientSecret ? '••••••••' : '',
    createdAt: p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt || Date.now()),
    updatedAt: p.updatedAt ? (p.updatedAt instanceof Date ? p.updatedAt : new Date(p.updatedAt)) : undefined,
  }));

  const translations: IdentityProviderTranslations = {
    title: t('title'),
    subtitle: t('subtitle'),
    add_provider: t('add_provider'),
    new_provider: t('new_provider'),
    edit_provider: t('edit_provider'),
    delete_confirm: t('delete_confirm'),
    no_providers: t('no_providers'),
    oidc_label: t('oidc_label'),
    saml_label: t('saml_label'),
    active: t('active'),
    inactive: t('inactive'),
    form: {
      name: t('form.name'),
      description: t('form.description'),
      provider_type: t('form.provider_type'),
      active: t('form.active'),
      issuer_url: t('form.issuer_url'),
      client_id: t('form.client_id'),
      client_secret: t('form.client_secret'),
      entity_id: t('form.entity_id'),
      metadata_url: t('form.metadata_url'),
      attribute_mapping: t('form.attribute_mapping'),
      allowed_domains: t('form.allowed_domains'),
      auto_provision: t('form.auto_provision'),
      default_tenant: t('form.default_tenant'),
      save: t('form.save'),
      cancel: t('form.cancel'),
      placeholder_name: t('form.placeholder_name'),
      placeholder_description: t('form.placeholder_description'),
      placeholder_issuer: t('form.placeholder_issuer'),
      placeholder_entity_id: t('form.placeholder_entity_id'),
      placeholder_metadata_url: t('form.placeholder_metadata_url'),
      placeholder_client_id: t('form.placeholder_client_id'),
      placeholder_client_secret: t('form.placeholder_client_secret'),
      placeholder_domain: t('form.placeholder_domain'),
    },
    cards: {
      oidc: t('cards.oidc'),
      saml: t('cards.saml'),
      client_credentials: t('cards.client_credentials'),
      authorized_domains: t('cards.authorized_domains'),
      issuer: t('cards.issuer'),
      entity_id: t('cards.entity_id'),
    },
  };

  return (
    <div className="animate-in fade-in duration-500">
      <IdentityProviderManagementContainer
        initialProviders={initialProviders}
        t={translations}
      />
    </div>
  );
}
