import { z } from 'zod';
import { TenantIdSchema } from './common';

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
