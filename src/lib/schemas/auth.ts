import { z } from 'zod';
import { TenantIdSchema } from './common';

export const EntityIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

/**
 * 🎭 User Roles
 */
export const UserRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'USER', 'AUDITOR', 'OPERATOR']);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * 👤 User Schema
 * Clean Industrial Model. Canonical fields only.
 */
export const UserSchema = z.object({
  _id: z.any().optional(),
  email: z.string().email(),
  password: z.string(),
  name: z.string(),
  surname: z.string(),
  telephone: z.string().optional().default(''),
  role: UserRoleSchema.default('USER'),
  position: z.string().optional().default('Staff'),
  tenantId: TenantIdSchema,
  industry: z.string().optional(),
  activeModules: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  mfaEnabled: z.boolean().default(false),
  mfaEnforced: z.boolean().default(false),
  emailVerified: z.date().optional(),
  verificationToken: z.string().optional(),
  loginAttempts: z.number().default(0),
  lockoutUntil: z.date().optional(),
  preferences: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

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
  active: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().optional(),
});

export type Tenant = z.infer<typeof TenantSchema>;

/**
 * 🔐 MFA Configuration Schema
 */
export const MfaConfigSchema = z.object({
  _id: z.any().optional(),
  userId: z.string(),
  secret: z.string(),
  backupCodes: z.array(z.string()),
  active: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().optional(),
});

export type MfaConfig = z.infer<typeof MfaConfigSchema>;

/**
 * 🛰️ Application (Satellite) Schema
 * Defines clients that can use ABDAuth for federated identity.
 */
export const ApplicationSchema = z.object({
  _id: z.any().optional(),
  name: z.string().min(2),
  description: z.string().optional().default(''),
  clientId: z.string().uuid(),
  clientSecret: z.string().min(32),
  redirectUris: z.array(z.string().url()).min(1, "At least one redirect URI is required"),
  active: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().optional(),
});

export type Application = z.infer<typeof ApplicationSchema>;

/**
 * 🛠️ Database Update Types (Industrial Purity)
 */
export type DbUpdateUser = Partial<Omit<User, '_id'>>;
export type DbUpdateTenant = Partial<Omit<Tenant, '_id'>>;
export type DbUpdateApplication = Partial<Omit<Application, '_id'>>;

/**
 * 🗝️ User Session Schema
 * Tracks active industrial sessions across the ecosystem.
 */
export const UserSessionSchema = z.object({
  _id: z.any().optional(),
  userId: z.string(),
  email: z.string().email(),
  tenantId: TenantIdSchema,
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  device: z.object({
    browser: z.string().optional(),
    os: z.string().optional(),
    type: z.enum(['DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN']).default('UNKNOWN')
  }).optional(),
  isCurrent: z.boolean().default(false),
  lastActive: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date()),
  expiresAt: z.date(),
});

export type UserSession = z.infer<typeof UserSessionSchema>;
