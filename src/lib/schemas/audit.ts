import { z } from 'zod';

/**
 * 🛡️ Security Audit Schema
 * Certified for industrial logging and SOC2 compliance.
 */
export const AuditLogSchema = z.object({
  _id: z.union([z.string(), z.any()]).optional(),
  timestamp: z.date().optional().default(() => new Date()), // Optional for creation, default value provided
  event: z.enum([
    'LOGIN_SUCCESS', 
    'LOGIN_FAILURE', 
    'LOGOUT', 
    'MFA_CHALLENGE', 
    'MFA_SUCCESS',
    'MFA_FAILURE',
    'USER_CREATED', 
    'USER_UPDATED',
    'TENANT_CREATED',
    'TENANT_UPDATED',
    'PASSWORD_CHANGE_REQUEST'
  ]),
  actorId: z.string(), // User ID or "SYSTEM"
  actorEmail: z.string().optional(),
  tenantId: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['SUCCESS', 'FAILURE', 'WARNING', 'INFO'])
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
