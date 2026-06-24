/**
 * @purpose Valida y define el esquema para las configuraciones del proveedor de identidad en la aplicación ABDAuth.
 * @purpose_en Validates and defines the schema for identity provider configurations in the ABDAuth application.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:3,imports:1,sig:1q7brrp
 * @lastUpdated 2026-06-23T22:42:52.177Z
 */

import { z } from 'zod';

/**
 * 🔐 Identity Provider Schema
 * Stores configuration for external OIDC/SAML identity providers.
 * ABDAuth acts as the Relying Party / Service Provider.
 */
export const IdentityProviderSchema = z.object({
  _id: z.any().optional(),
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional().default(''),
  providerType: z.enum(['OIDC', 'SAML']),
  active: z.boolean().default(true),
  tenantId: z.string().optional(),

  // OIDC-specific
  issuerUrl: z.string().url().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  oidcMetadataUrl: z.string().url().optional(),

  // SAML-specific
  entityId: z.string().optional(),
  metadataUrl: z.string().url().optional(),
  metadataXml: z.string().optional(),
  acsUrl: z.string().optional(), // Assertion Consumer Service URL

  // Shared
  authorizationEndpoint: z.string().optional(),
  tokenEndpoint: z.string().optional(),
  userinfoEndpoint: z.string().optional(),
  jwksUri: z.string().optional(),

  /**
   * Map external provider claims to ABD user fields.
   * Key = ABD field (sub, email, name, surname, role)
   * Value = provider claim path (e.g. "sub", "email", "given_name")
   */
  attributeMapping: z.object({
    sub: z.string().default('sub'),
    email: z.string().default('email'),
    name: z.string().default('name'),
    surname: z.string().default('family_name'),
    role: z.string().optional(),
    groups: z.string().optional(),
  }).default({
    sub: 'sub',
    email: 'email',
    name: 'name',
    surname: 'family_name',
  }),

  // Domain whitelist for auto-provisioning
  allowedDomains: z.array(z.string()).default([]),

  // Auto-provision users on first login
  autoProvision: z.boolean().default(false),

  // Default tenant for auto-provisioned users
  defaultTenantId: z.string().optional(),

  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().optional(),
});

export type IdentityProvider = z.infer<typeof IdentityProviderSchema>;
export type DbUpdateIdentityProvider = Partial<Omit<IdentityProvider, '_id'>>;
