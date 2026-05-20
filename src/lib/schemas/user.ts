import { z } from 'zod';
import { TenantIdSchema } from './common';

export const EntityIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

/**
 * 🎭 User Roles
 */
export const UserRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'USER', 'AUDITOR', 'OPERATOR']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserTenantMembershipSchema = z.object({
  tenantId: z.string(),
  role: z.enum(['owner', 'admin', 'student']).default('student'),
  status: z.enum(['active', 'suspended']).default('active'),
  appPermissions: z.array(z.string()).default([]),
  allowedApps: z.array(z.string()).default([]),
  groupIds: z.array(z.string()).default([]),
});

export type UserTenantMembership = z.infer<typeof UserTenantMembershipSchema>;

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
  tenantIds: z.array(TenantIdSchema).default([]),
  tenants: z.array(UserTenantMembershipSchema).default([]),
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

export type DbUpdateUser = Partial<Omit<User, '_id'>>;
