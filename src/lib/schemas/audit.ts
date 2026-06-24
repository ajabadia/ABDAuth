/**
 * @purpose Valida y define esquemas para registros de auditoría y registros operativos en la aplicación ABDAuth, asegurando la integridad de los datos y la conformidad.
 * @purpose_en Validates and defines schemas for audit logs and operational logs in the ABDAuth application, ensuring data integrity and compliance.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:5,imports:1,sig:v2g8si
 * @lastUpdated 2026-06-23T22:42:41.023Z
 */

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
  'MFA_GRACE_BYPASS',
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

/**
 * 🛡️ AuditAuthOps Schema (Local Operational Logs)
 * Compliant with DISENO_SSO_TENANTS.md standard
 */
export const AuditAuthOpsSchema = z.object({
  _id: z.any().optional(),
  tenantId: z.string(), // Slug of the tenant (or 'SYSTEM' or 'GLOBAL')
  action: z.enum([
    'USER_LOGIN',
    'USER_LOGOUT',
    'SSO_HANDSHAKE_GRANTED',
    'SSO_HANDSHAKE_DENIED',
    'TENANT_CREATED',
    'TENANT_UPDATED',
    'TENANT_SUSPENDED',
  ]),
  entityType: z.enum(['USER', 'TENANT', 'SSO']),
  entityId: z.string(), // ID of target entity
  userId: z.string(),   // Actor User ID
  userEmail: z.string(), // Actor Email
  changedFields: z.record(z.string(), z.unknown()).default({}),
  previousState: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date().optional(),
});

export type AuditAuthOps = z.infer<typeof AuditAuthOpsSchema>;

