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
  dbPrefix: z.string().optional(),
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
 * 🛠️ Database Update Types (Industrial Purity)
 */
export type DbUpdateUser = Partial<Omit<User, '_id'>>;
export type DbUpdateTenant = Partial<Omit<Tenant, '_id'>>;
