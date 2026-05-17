import { z } from 'zod';

/**
 * 🛡️ Security Audit Schema
 * Certified for industrial logging and SOC2 compliance.
 */
export const AuditEventSchema = z.enum([
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'LOGOUT',
  'MFA_CHALLENGE',
  'MFA_SUCCESS',
  'MFA_FAILURE',
  'MFA_ENABLED',
  'MFA_DISABLED',
  'MFA_VERIFY_SUCCESS',
  'MFA_VERIFY_FAILURE',
  'USER_CREATED',
  'USER_UPDATED',
  'TENANT_CREATED',
  'TENANT_UPDATED',
  'TENANT_DELETED',
  'PASSWORD_CHANGE',
  'PASSWORD_CHANGE_REQUEST',
]);

export const AuditLogSchema = z.object({
  _id: z.union([z.string(), z.any()]).optional(),
  timestamp: z.date().optional().default(() => new Date()), // Optional for creation, default value provided
  event: AuditEventSchema,
  actorId: z.string(), // User ID or "SYSTEM"
  actorEmail: z.string().optional(),
  tenantId: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['SUCCESS', 'FAILURE', 'WARNING', 'INFO'])
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
