/**
 * @purpose Valida y define la estructura del objeto de inquilino utilizando el esquema de Zod.
 * @purpose_en Validates and defines the structure of a tenant object using Zod schema.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:3,imports:2,sig:1tm3d5s
 * @lastUpdated 2026-06-23T22:43:16.219Z
 */

import { z } from 'zod';
import { TenantIdSchema } from './common';

/**
 * 🏢 Tenant Schema
 */
export const TenantSchema = z.object({
  _id: z.any().optional(),
  tenantId: TenantIdSchema,
  name: z.string(),
  industry: z.string().optional().default('Industrial'),
  dbPrefix: z.string().min(2, "Database prefix must be at least 2 chars"),
  isolationStrategy: z.enum(['COLLECTION_PREFIX', 'DATABASE_PER_TENANT']).default('COLLECTION_PREFIX'),
  allowedApps: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  branding: z.object({
    logoUrl: z.string().url().optional().or(z.null()).or(z.literal('')),
    theme: z.object({
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      background: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      rounded: z.boolean().optional().default(true),
      radius: z.string().regex(/^[0-9.]+(rem|px|em|%)$/).optional()
    }).optional(),
    logo: z.object({
      url: z.string().url().optional().or(z.null()).or(z.literal('')),
      publicId: z.string().optional(),
    }).optional(),
    favicon: z.object({
      url: z.string().url().optional().or(z.null()).or(z.literal('')),
      publicId: z.string().optional(),
    }).optional(),
    colors: z.object({
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      primaryDark: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      accentDark: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    }).optional(),
    autoDarkMode: z.boolean().optional(),
    rounded: z.boolean().optional(),
    radius: z.string().regex(/^[0-9.]+(rem|px|em|%)$/).optional()
  }).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().optional(),
});

export type Tenant = z.infer<typeof TenantSchema>;

export type DbUpdateTenant = Partial<Omit<Tenant, '_id'>>;
